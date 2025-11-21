// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Daftar nama software real & fiksi untuk dummy
const SOFTWARE_NAMES = [
  "Jira Software",
  "Trello",
  "Asana",
  "ClickUp",
  "Monday.com",
  "Basecamp",
  "Wrike",
  "Notion",
  "Microsoft Project",
  "Zoho Projects",
  "Smartsheet",
  "Teamwork",
  "Podio",
  "Redmine",
  "GitLab",
  "Airtable",
  "MeisterTask",
  "Paymo",
  "ProofHub",
  "Nifty",
  "Mavenlink",
  "Clarizen",
  "Scoro",
  "Workzone",
  "ActiveCollab",
  "Celoxis",
  "LiquidPlanner",
  "Planview",
  "Targetprocess",
  "VersionOne",
  "Pivotal Tracker",
  "Backlog",
  "Shortcut",
  "Hubstaff Tasks",
  "Freedcamp",
  "Bitrix24",
  "Quire",
  "Taskworld",
  "Flow",
  "ZenHub",
  "Clubhouse",
  "Rally",
  "FogBugz",
  "Planbox",
  "Axosoft",
  "GoodDay",
  "Hitask",
  "ProWorkflow",
  "Avaza",
  "TeamGantt",
];

async function main() {
  console.log("🔄 Menghapus data lama...");
  await prisma.assessment.deleteMany();
  await prisma.alternative.deleteMany();
  await prisma.criteria.deleteMany();

  console.log("🛠️  Membuat Kriteria...");
  // 1. Buat Kriteria
  await prisma.criteria.createMany({
    data: [
      { code: "C1", name: "Penggunaan (User Experience)", type: "BENEFIT" },
      { code: "C2", name: "Kolaborasi (Teamwork)", type: "BENEFIT" },
      { code: "C3", name: "Biaya (Cost)", type: "COST" },
      { code: "C4", name: "Manajemen Bug", type: "BENEFIT" },
      { code: "C5", name: "Integrasi", type: "BENEFIT" },
    ],
  });

  // Ambil ID kriteria yang baru dibuat
  const criteriaList = await prisma.criteria.findMany({
    orderBy: { code: "asc" },
  });

  console.log(`🚀 Mengisi ${SOFTWARE_NAMES.length} Data Alternatif...`);

  // 2. Loop 50 Software
  for (const name of SOFTWARE_NAMES) {
    // Buat Alternatif
    const alt = await prisma.alternative.create({
      data: { name },
    });

    // Buat Nilai Random (1-5) untuk setiap kriteria
    for (const criteria of criteriaList) {
      // Logika Random:
      // Math.floor(Math.random() * 5) + 1 -> menghasilkan angka 1 s/d 5
      const randomScore = Math.floor(Math.random() * 5) + 1;

      await prisma.assessment.create({
        data: {
          alternativeId: alt.id,
          criteriaId: criteria.id,
          value: randomScore,
        },
      });
    }
  }

  console.log("✅ SEEDING SELESAI! 50 Data telah masuk.");
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
