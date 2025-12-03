// app/actions.ts
"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { calculateAHP } from "@/utils/ahp"; // Pastikan path sesuai

const prisma = new PrismaClient();

export async function getCriteriaData() {
  const criteria = await prisma.criteria.findMany({
    orderBy: { code: "asc" },
  });
  return criteria;
}
// --- ALTERNATIVES ACTIONS ---
export async function createAlternative(formData: FormData) {
  "use server";
  const name = formData.get("name") as string;

  if (!name?.trim()) {
    throw new Error("Nama software wajib diisi");
  }

  try {
    const criteria = await prisma.criteria.findMany({
      orderBy: { code: "asc" },
    });

    const alternative = await prisma.alternative.create({
      data: { name: name.trim() },
    });

    for (const crit of criteria) {
      let value = parseInt(formData.get(crit.code) as string) || 3;

      // Validasi berdasarkan tipe kriteria
      if (crit.type === "COST") {
        // Untuk kriteria COST, nilai bisa lebih besar (harga asli)
        if (value < 0) value = 0; // Minimal 0
      } else {
        // Untuk kriteria lain (BENEFIT), tetap skala 1-5
        if (value < 1) value = 1;
        if (value > 5) value = 5;
      }

      await prisma.assessment.create({
        data: {
          alternativeId: alternative.id,
          criteriaId: crit.id,
          value,
        },
      });
    }

    revalidatePath("/alternative");
    revalidatePath("/calculation");
  } catch (error: any) {
    throw new Error("Gagal tambah software: " + error.message);
  }
}

export async function updateAlternative(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;

  if (!name?.trim()) {
    throw new Error("Nama software wajib diisi");
  }

  try {
    const criteria = await prisma.criteria.findMany({
      orderBy: { code: "asc" },
    });

    await prisma.alternative.update({
      where: { id },
      data: { name: name.trim() },
    });

    for (const crit of criteria) {
      let value = parseInt(formData.get(crit.code) as string) || 3;

      // Validasi berdasarkan tipe kriteria
      if (crit.type === "COST") {
        // Untuk kriteria COST, nilai bisa lebih besar (harga asli)
        if (value < 0) value = 0;
      } else {
        // Untuk kriteria lain (BENEFIT), tetap skala 1-5
        if (value < 1) value = 1;
        if (value > 5) value = 5;
      }

      const existing = await prisma.assessment.findFirst({
        where: {
          alternativeId: id,
          criteriaId: crit.id,
        },
      });

      if (existing) {
        await prisma.assessment.update({
          where: { id: existing.id },
          data: { value },
        });
      } else {
        await prisma.assessment.create({
          data: {
            alternativeId: id,
            criteriaId: crit.id,
            value,
          },
        });
      }
    }

    revalidatePath("/alternative");
    revalidatePath("/calculation");
  } catch (error: any) {
    throw new Error("Gagal update software: " + error.message);
  }
}

export async function importAlternativesFromExcel(jsonData: string) {
  "use server";

  try {
    const data = JSON.parse(jsonData);

    const criteria = await prisma.criteria.findMany({
      orderBy: { code: "asc" },
    });

    if (criteria.length === 0) {
      throw new Error(
        "Belum ada kriteria. Tambahkan kriteria terlebih dahulu."
      );
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const row of data) {
      try {
        const name = row["Nama Software"];

        if (!name || typeof name !== "string" || !name.trim()) {
          errorCount++;
          errors.push(`Baris dengan nama kosong dilewati`);
          continue;
        }

        // Cek duplikat
        const existing = await prisma.alternative.findFirst({
          where: { name: name.trim() },
        });

        if (existing) {
          errorCount++;
          errors.push(`"${name}" sudah ada (duplikat)`);
          continue;
        }

        // Buat alternative baru
        const alternative = await prisma.alternative.create({
          data: { name: name.trim() },
        });

        // Buat assessment untuk setiap kriteria
        for (const crit of criteria) {
          let value = parseInt(row[crit.code]) || 3;

          // Validasi berdasarkan tipe kriteria
          if (crit.type === "COST") {
            // Untuk kriteria COST, nilai bisa lebih besar (harga asli)
            if (value < 0) value = 0;
          } else {
            // Untuk kriteria lain (BENEFIT), tetap skala 1-5
            if (value < 1) value = 1;
            if (value > 5) value = 5;
          }

          await prisma.assessment.create({
            data: {
              alternativeId: alternative.id,
              criteriaId: crit.id,
              value,
            },
          });
        }

        successCount++;
      } catch (err: any) {
        errorCount++;
        errors.push(`Error: ${err.message}`);
        console.error("Error importing row:", err);
      }
    }

    revalidatePath("/alternative");
    revalidatePath("/calculation");

    if (errorCount > 0) {
      const errorMsg = `Import selesai: ${successCount} berhasil, ${errorCount} gagal/duplikat.\n\nDetail error:\n${errors
        .slice(0, 10)
        .join("\n")}${
        errors.length > 10
          ? `\n... dan ${errors.length - 10} error lainnya`
          : ""
      }`;
      throw new Error(errorMsg);
    }

    return { success: true, count: successCount };
  } catch (error: any) {
    throw new Error(error.message || "Gagal import data dari Excel");
  }
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

  // Update database dengan bobot baru DAN matriks perbandingan
  const criteria = await prisma.criteria.findMany({ orderBy: { code: "asc" } });

  for (let i = 0; i < criteria.length; i++) {
    await prisma.criteria.update({
      where: { id: criteria[i].id },
      data: {
        weight: result.weights[i],
        comparisonRow: JSON.stringify(matrix[i]), // Simpan baris matriks sebagai JSON
      },
    });
  }

  revalidatePath("/calculation");
  return { success: true, cr: result.consistencyRatio };
}

export async function createCriterion(formData: FormData) {
  const name = formData.get("name") as string;
  const type = formData.get("type") as "BENEFIT" | "COST";

  // 1. Generate Kode Otomatis (C1, C2, dst)
  const count = await prisma.criteria.count();
  const code = `C${count + 1}`;

  // 2. Buat Kriteria Baru
  const newCriteria = await prisma.criteria.create({
    data: {
      code,
      name,
      type,
      weight: 0, // Default bobot 0 sebelum dihitung AHP
    },
  });

  // 3. PENTING: Isi nilai default (1) untuk semua Alternatif yang sudah ada
  // Agar tabel SAW tidak bolong/error
  const alternatives = await prisma.alternative.findMany();
  if (alternatives.length > 0) {
    await prisma.assessment.createMany({
      data: alternatives.map((alt) => ({
        alternativeId: alt.id,
        criteriaId: newCriteria.id,
        value: 1, // Nilai default 'Buruk'
      })),
    });
  }

  revalidatePath("/criteria");
  revalidatePath("/alternative");
  revalidatePath("/calculation");
}

export async function deleteCriterion(id: string) {
  // Hapus kriteria (Cascade delete akan menghapus nilai assessment terkait)
  await prisma.criteria.delete({ where: { id } });

  // Opsional: Re-index kode C1, C2 (tapi untuk simpel biarkan saja urutan DB)

  revalidatePath("/criteria");
  revalidatePath("/alternative");
  revalidatePath("/calculation");
}