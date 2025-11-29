// prisma/seed.ts (improved)
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Daftar nama software real & fiksi untuk dummy (50+)
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

function chunkArray<T>(arr: T[], size: number) {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

async function main() {
  console.log("🔄 Menghapus data lama...");
  await prisma.$connect();

  // Hapus data lama (urutan penting karena FK)
  await prisma.assessment.deleteMany();
  await prisma.alternative.deleteMany();
  await prisma.criteria.deleteMany();

  console.log("🛠️  Membuat Kriteria...");

  // Contoh matriks perbandingan AHP 5x5
  const comparisonMatrix = [
    [1, 3, 5, 2, 4],
    [1 / 3, 1, 2, 1 / 2, 3 / 2],
    [1 / 5, 1 / 2, 1, 1 / 3, 1 / 2],
    [1 / 2, 2, 3, 1, 2],
    [1 / 4, 2 / 3, 2, 1 / 2, 1],
  ];

  const weights = [0.4166, 0.1666, 0.0666, 0.2333, 0.1166];

  // Bulk insert criteria
  const criteriaData = [
    { code: "C1", name: "Penggunaan (User Experience)", type: "BENEFIT", weight: weights[0], comparisonRow: JSON.stringify(comparisonMatrix[0]) },
    { code: "C2", name: "Kolaborasi (Teamwork)", type: "BENEFIT", weight: weights[1], comparisonRow: JSON.stringify(comparisonMatrix[1]) },
    { code: "C3", name: "Biaya (Cost)", type: "COST", weight: weights[2], comparisonRow: JSON.stringify(comparisonMatrix[2]) },
    { code: "C4", name: "Manajemen Bug", type: "BENEFIT", weight: weights[3], comparisonRow: JSON.stringify(comparisonMatrix[3]) },
    { code: "C5", name: "Integrasi", type: "BENEFIT", weight: weights[4], comparisonRow: JSON.stringify(comparisonMatrix[4]) },
  ];

  // createMany typing with Prisma enums can be strict in TS; ignore type-check for seeding
  // @ts-expect-error allow enum typing flex during seeding
  await prisma.criteria.createMany({ data: criteriaData });

  const criteriaList = await prisma.criteria.findMany({ orderBy: { code: "asc" } });

  // Bulk insert alternatives
  console.log(`🚀 Mengisi ${SOFTWARE_NAMES.length} Data Alternatif...`);
  const altData = SOFTWARE_NAMES.map((name) => ({ name }));
  await prisma.alternative.createMany({ data: altData });

  const alternatives = await prisma.alternative.findMany();

  // Build assessments array (bulk), but chunk to avoid too large single query
  const assessments: { alternativeId: string; criteriaId: string; value: number }[] = [];
  for (const alt of alternatives) {
    for (const crit of criteriaList) {
      const randomScore = Math.floor(Math.random() * 5) + 1; // 1..5
      assessments.push({ alternativeId: alt.id, criteriaId: crit.id, value: randomScore });
    }
  }

  console.log(`🔢 Membuat ${assessments.length} penilaian (dibatch)...`);
  const chunks = chunkArray(assessments, 500); // batch size 500
  for (const [i, c] of chunks.entries()) {
    console.log(` - Menginsert batch ${i + 1}/${chunks.length} (${c.length} items)`);
    await prisma.assessment.createMany({ data: c });
  }

  console.log("✅ SEEDING SELESAI!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
