// app/actions.ts
"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { calculateAHP } from "@/utils/ahp"; // Pastikan path sesuai

const prisma = new PrismaClient();

export async function getCriteriaData() {
  const criteria = await prisma.criteria.findMany({
    orderBy: { code: 'asc' }
  })
  return criteria
}
// --- ALTERNATIVES ACTIONS ---
export async function createAlternative(formData: FormData) {
  const name = formData.get("name") as string;
  const scores = {
    C1: Number(formData.get("C1")),
    C2: Number(formData.get("C2")),
    C3: Number(formData.get("C3")),
    C4: Number(formData.get("C4")),
    C5: Number(formData.get("C5")),
  };

  // 1. Buat Alternatif Baru
  const alt = await prisma.alternative.create({ data: { name } });

  // 2. Masukkan Nilai (Assessments)
  const criteriaList = await prisma.criteria.findMany();

  for (const crit of criteriaList) {
    await prisma.assessment.create({
      data: {
        alternativeId: alt.id,
        criteriaId: crit.id,
        value: scores[crit.code as keyof typeof scores] || 1,
      },
    });
  }

  revalidatePath("/alternative");
}

export async function deleteAlternative(id: string) {
  await prisma.alternative.delete({ where: { id } });
  revalidatePath("/alternative");
}

// --- AHP ACTIONS ---
export async function saveAhpWeights(matrix: number[][]) {
  const result = calculateAHP(matrix);

  if (!result.isConsistent) {
    throw new Error(
      `Data Tidak Konsisten! CR = ${result.consistencyRatio.toFixed(
        3
      )} (Harus < 0.1)`
    );
  }

  // Update database dengan bobot baru
  const criteria = await prisma.criteria.findMany({ orderBy: { code: "asc" } });

  for (let i = 0; i < criteria.length; i++) {
    await prisma.criteria.update({
      where: { id: criteria[i].id },
      data: { weight: result.weights[i] },
    });
  }

  revalidatePath("/calculation");
  return { success: true, cr: result.consistencyRatio };
}

export async function createCriterion(formData: FormData) {
  const name = formData.get('name') as string
  const type = formData.get('type') as 'BENEFIT' | 'COST'

  // 1. Generate Kode Otomatis (C1, C2, dst)
  const count = await prisma.criteria.count()
  const code = `C${count + 1}`

  // 2. Buat Kriteria Baru
  const newCriteria = await prisma.criteria.create({
    data: {
      code,
      name,
      type,
      weight: 0 // Default bobot 0 sebelum dihitung AHP
    }
  })

  // 3. PENTING: Isi nilai default (1) untuk semua Alternatif yang sudah ada
  // Agar tabel SAW tidak bolong/error
  const alternatives = await prisma.alternative.findMany()
  if (alternatives.length > 0) {
    await prisma.assessment.createMany({
      data: alternatives.map(alt => ({
        alternativeId: alt.id,
        criteriaId: newCriteria.id,
        value: 1 // Nilai default 'Buruk'
      }))
    })
  }

  revalidatePath('/criteria')
  revalidatePath('/alternative')
  revalidatePath('/calculation')
}

export async function deleteCriterion(id: string) {
  // Hapus kriteria (Cascade delete akan menghapus nilai assessment terkait)
  await prisma.criteria.delete({ where: { id } })
  
  // Opsional: Re-index kode C1, C2 (tapi untuk simpel biarkan saja urutan DB)
  
  revalidatePath('/criteria')
  revalidatePath('/alternative')
  revalidatePath('/calculation')
}
