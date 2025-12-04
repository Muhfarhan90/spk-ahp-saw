import { PrismaClient } from "@prisma/client";
import { calculateSAW } from "@/utils/saw";
import {
  Trophy,
  Award,
  BarChart3,
  AlertCircle,
  TrendingUp,
  Target,
  CheckCircle2,
  Calculator,
  Eye,
  Table2,
  Info,
} from "lucide-react";

const prisma = new PrismaClient();

export default async function CalculationPage() {
  // 1. Ambil Data dari Database
  const criteria = await prisma.criteria.findMany({ orderBy: { code: "asc" } });
  const alternatives = await prisma.alternative.findMany({
    include: { assessments: true },
  });

  // Cek jika data kosong
  if (alternatives.length === 0 || criteria.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50 flex flex-col items-center justify-center text-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md border border-slate-200">
          <div className="bg-orange-100 p-4 rounded-full w-fit mx-auto text-orange-600 mb-4">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            Data Belum Lengkap
          </h2>
          <p className="text-slate-500">
            Pastikan Anda sudah mengisi <strong>Kriteria</strong> dan minimal
            satu <strong>Data Alternatif</strong> sebelum melihat hasil
            rekomendasi.
          </p>
        </div>
      </div>
    );
  }

  // 2. Calculate normalization factors per criterion
  const normalizationFactors: {
    [key: string]: { max: number; min: number; type: string };
  } = {};

  criteria.forEach((criterion) => {
    const values = alternatives.map(
      (alt) =>
        alt.assessments.find((ass) => ass.criteriaId === criterion.id)?.value ||
        0
    );
    normalizationFactors[criterion.id] = {
      max: Math.max(...values),
      min: Math.min(...values),
      type: criterion.type,
    };
  });

  // 3. Proses Perhitungan SAW
  const altIds = alternatives.map((a) => a.id);
  const assessmentsFlat = alternatives.flatMap((a) => a.assessments);
  const rankings = calculateSAW(altIds, criteria, assessmentsFlat);

  // 4. Siapkan data detail dengan nilai normalized dan weighted
  const detailData = alternatives.map((alt) => {
    const ranking = rankings.find((r) => r.alternativeId === alt.id);
    const details: {
      id: string;
      name: string;
      score: number;
      rank: number;
      criteriaValues: { [key: string]: number };
      normalizedValues: { [key: string]: number };
      weightedValues: { [key: string]: number };
    } = {
      id: alt.id,
      name: alt.name,
      score: ranking?.score || 0,
      rank: rankings.findIndex((r) => r.alternativeId === alt.id) + 1,
      criteriaValues: {},
      normalizedValues: {},
      weightedValues: {},
    };

    criteria.forEach((crit) => {
      const assessment = alt.assessments.find((a) => a.criteriaId === crit.id);
      const rawValue = assessment?.value || 0;
      const weight = crit.weight || 0;
      const normFactor = normalizationFactors[crit.id];

      details.criteriaValues[crit.id] = rawValue;

      // Calculate normalized value based on criterion type
      let normalized = 0;
      if (normFactor.type === "BENEFIT") {
        normalized = rawValue / normFactor.max;
      } else {
        // COST
        normalized = normFactor.min / rawValue;
      }
      details.normalizedValues[crit.id] = normalized;

      // Calculate weighted value
      details.weightedValues[crit.id] = normalized * weight;
    });

    return details;
  });

  // Ambil Top 1 untuk Highlight
  const winnerId = rankings[0]?.alternativeId;
  const winnerName = alternatives.find((a) => a.id === winnerId)?.name;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* === HEADER === */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <Trophy className="text-white" size={28} />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
                Hasil Rekomendasi
              </h1>
              <p className="text-slate-500 mt-1">
                Sistem mengurutkan software terbaik berdasarkan bobot AHP dan
                nilai performa SAW
              </p>
            </div>
            <span className="hidden lg:flex items-center px-4 py-2 bg-green-50 text-green-700 rounded-xl text-sm font-bold border-2 border-green-200">
              <CheckCircle2 size={18} className="mr-2" />
              {rankings.length} Hasil
            </span>
          </div>
        </div>

        {/* === CONTENT GRID === */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* --- KOLOM KIRI (2/3) --- */}
          <div className="xl:col-span-2 space-y-6">
            {/* CARD: FORMULA EXPLANATION */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-sm border-2 border-blue-200 p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-600 rounded-lg shadow-md">
                  <Info className="text-white" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 text-lg mb-3">
                    Rumus Normalisasi SAW
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="text-green-600" size={18} />
                        <span className="font-semibold text-slate-700">
                          Kriteria BENEFIT (semakin tinggi semakin baik):
                        </span>
                      </div>
                      <div className="text-sm text-slate-600 ml-7">
                        <code className="bg-slate-100 px-2 py-1 rounded text-xs">
                          r<sub>ij</sub> = x<sub>ij</sub> / max(x<sub>j</sub>)
                        </code>
                        <p className="mt-2">
                          Nilai alternatif dibagi dengan nilai maksimum
                        </p>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="text-red-600" size={18} />
                        <span className="font-semibold text-slate-700">
                          Kriteria COST (semakin rendah semakin baik):
                        </span>
                      </div>
                      <div className="text-sm text-slate-600 ml-7">
                        <code className="bg-slate-100 px-2 py-1 rounded text-xs">
                          r<sub>ij</sub> = min(x<sub>j</sub>) / x<sub>ij</sub>
                        </code>
                        <p className="mt-2">
                          Nilai minimum dibagi dengan nilai alternatif
                        </p>
                      </div>
                    </div>
                    <div className="bg-blue-600 text-white rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Calculator className="text-white" size={18} />
                        <span className="font-semibold">Skor Akhir:</span>
                      </div>
                      <div className="text-sm ml-7">
                        <code className="bg-blue-700 px-2 py-1 rounded text-xs">
                          V<sub>i</sub> = Σ (w<sub>j</sub> × r<sub>ij</sub>)
                        </code>
                        <p className="mt-2">
                          Total dari perkalian bobot dengan nilai normalisasi
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD: TABEL DETAIL PERHITUNGAN */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-white border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Table2 className="text-blue-600" size={20} />
                    <div>
                      <h2 className="font-bold text-slate-800 text-lg">
                        Detail Perhitungan SAW
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Nilai ternormalisasi, bobot, dan skor akhir setiap
                        alternatif
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                    {alternatives.length} Software
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider border-b-2 border-slate-200 w-12">
                        Rank
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider border-b-2 border-slate-200 min-w-[150px]">
                        Alternatif
                      </th>
                      {criteria.map((c) => {
                        const normFactor = normalizationFactors[c.id];
                        const displayValue =
                          normFactor.type === "BENEFIT"
                            ? `MAX: ${normFactor.max}`
                            : `MIN: ${normFactor.min}`;
                        return (
                          <th
                            key={c.id}
                            className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider border-b-2 border-slate-200"
                          >
                            <div className="flex flex-col items-center gap-1">
                              <span className="font-mono text-blue-600">
                                {c.code}
                              </span>
                              <span className="text-[10px] text-slate-500 font-normal normal-case">
                                {c.name}
                              </span>
                              <span className="text-[9px] text-orange-600 font-semibold mt-0.5 bg-orange-50 px-2 py-0.5 rounded">
                                {displayValue}
                              </span>
                            </div>
                          </th>
                        );
                      })}
                      <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider border-b-2 border-l-2 border-slate-300 bg-blue-50">
                        Total Skor
                      </th>
                    </tr>
                    <tr className="bg-yellow-50 border-b border-yellow-200">
                      <th
                        colSpan={2}
                        className="px-4 py-2 text-right text-xs font-bold text-yellow-800"
                      >
                        Bobot (W):
                      </th>
                      {criteria.map((c) => (
                        <td
                          key={c.id}
                          className="px-4 py-2 text-center text-xs font-mono font-bold text-yellow-700"
                        >
                          {Math.round(c.weight * 100)}%
                        </td>
                      ))}
                      <td className="px-4 py-2 text-center text-xs font-mono font-bold text-yellow-700 border-l-2 border-yellow-200 bg-yellow-100">
                        100%
                      </td>
                    </tr>
                  </thead>
                  <tbody>
                    {detailData
                      .sort((a, b) => b.score - a.score)
                      .map((detail, index) => {
                        const isWinner = index === 0;
                        const isTop3 = index < 3;

                        return (
                          <tr
                            key={detail.id}
                            className={`border-b border-slate-100 transition-colors ${
                              isWinner ? "bg-blue-50/60" : "hover:bg-slate-50"
                            }`}
                          >
                            <td className="px-4 py-3 text-center">
                              <div
                                className={`w-8 h-8 mx-auto flex items-center justify-center rounded-lg font-bold text-sm ${
                                  isWinner
                                    ? "bg-gradient-to-br from-yellow-400 to-yellow-500 text-yellow-900 shadow-md"
                                    : index === 1
                                    ? "bg-gradient-to-br from-slate-300 to-slate-400 text-slate-700 shadow-sm"
                                    : index === 2
                                    ? "bg-gradient-to-br from-orange-300 to-orange-400 text-orange-800 shadow-sm"
                                    : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                {index + 1}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`font-semibold ${
                                  isWinner
                                    ? "text-blue-800 text-base"
                                    : "text-slate-700 text-sm"
                                }`}
                              >
                                {detail.name}
                              </span>
                            </td>
                            {criteria.map((c) => {
                              const normalized = detail.normalizedValues[c.id];
                              const raw = detail.criteriaValues[c.id];
                              const weighted = detail.weightedValues[c.id];

                              // Format normalized: show integer if whole number, else 3 decimals
                              const normalizedDisplay =
                                normalized === Math.floor(normalized)
                                  ? normalized.toString()
                                  : normalized.toFixed(3);

                              // Format weighted: show integer if whole number, else 4 decimals
                              const weightedDisplay =
                                weighted === Math.floor(weighted)
                                  ? weighted.toString()
                                  : weighted.toFixed(4);

                              return (
                                <td
                                  key={c.id}
                                  className="px-4 py-3 text-center"
                                >
                                  <div className="flex flex-col gap-1">
                                    <span className="font-mono text-sm font-semibold text-blue-700">
                                      {normalizedDisplay}
                                    </span>
                                    <span className="font-mono text-[10px] text-slate-400">
                                      ({raw})
                                    </span>
                                    <span className="font-mono text-[9px] text-green-600 bg-green-50 px-1 py-0.5 rounded">
                                      ×{Math.round(c.weight * 100)}% ={" "}
                                      {weightedDisplay}
                                    </span>
                                  </div>
                                </td>
                              );
                            })}
                            <td className="px-4 py-3 text-center border-l-2 border-slate-200 bg-blue-50/30">
                              <span
                                className={`font-mono font-bold text-base ${
                                  isWinner ? "text-blue-700" : "text-slate-700"
                                }`}
                              >
                                {detail.score.toFixed(4)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
                <div className="flex items-start gap-3">
                  <Calculator size={16} className="text-blue-600 mt-0.5" />
                  <div className="flex-1 text-xs text-slate-600 leading-relaxed">
                    <p className="mb-2">
                      <strong>Cara Baca Tabel:</strong>
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-[11px]">
                      <li>
                        <strong className="text-blue-700">
                          Nilai Biru (0.xxx):
                        </strong>{" "}
                        Nilai ternormalisasi (0-1) hasil dari rumus normalisasi
                      </li>
                      <li>
                        <strong className="text-slate-500">
                          Nilai Abu (dalam kurung):
                        </strong>{" "}
                        Nilai mentah asli yang diinputkan
                      </li>
                      <li>
                        <strong className="text-green-700">
                          Nilai Hijau (×%):
                        </strong>{" "}
                        Hasil perkalian nilai normalisasi dengan bobot kriteria
                      </li>
                      <li>
                        <strong>Bobot (W):</strong> Persentase prioritas dari
                        perhitungan AHP
                      </li>
                      <li>
                        <strong>Total Skor:</strong> Hasil penjumlahan semua
                        nilai hijau (weighted values)
                      </li>
                      <li>
                        <strong className="text-orange-600">MIN/MAX:</strong>{" "}
                        Nilai minimum (untuk COST) atau maksimum (untuk BENEFIT)
                        yang digunakan dalam normalisasi
                      </li>
                      <li>
                        Alternatif dengan <strong>Total Skor tertinggi</strong>{" "}
                        adalah yang terbaik
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD: TABEL PERANKINGAN SEDERHANA */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="text-slate-400" size={20} />
                    <h2 className="font-bold text-slate-800 text-lg">
                      Rangkuman Peringkat
                    </h2>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-6 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider w-24">
                        Rank
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Nama Software
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider w-32">
                        Nilai Akhir
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider w-40">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rankings.map((rank, index) => {
                      const altName = alternatives.find(
                        (a) => a.id === rank.alternativeId
                      )?.name;
                      const isWinner = index === 0;
                      const isTop3 = index < 3;

                      return (
                        <tr
                          key={rank.alternativeId}
                          className={`transition-colors ${
                            isWinner ? "bg-blue-50/60" : "hover:bg-slate-50"
                          }`}
                        >
                          <td className="px-6 py-4 text-center">
                            <div
                              className={`w-10 h-10 mx-auto flex items-center justify-center rounded-xl font-bold text-base ${
                                isWinner
                                  ? "bg-gradient-to-br from-yellow-400 to-yellow-500 text-yellow-900 shadow-lg"
                                  : index === 1
                                  ? "bg-gradient-to-br from-slate-300 to-slate-400 text-slate-700 shadow-md"
                                  : index === 2
                                  ? "bg-gradient-to-br from-orange-300 to-orange-400 text-orange-800 shadow-md"
                                  : "text-slate-500 bg-slate-100"
                              }`}
                            >
                              {index + 1}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`font-semibold ${
                                isWinner
                                  ? "text-blue-800 text-base"
                                  : "text-slate-700"
                              }`}
                            >
                              {altName}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`font-mono font-bold text-base ${
                                isWinner ? "text-blue-700" : "text-slate-600"
                              }`}
                            >
                              {rank.score.toFixed(4)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {isWinner ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-green-100 text-green-700 border-2 border-green-200">
                                <CheckCircle2 size={14} />
                                Sangat Direkomendasikan
                              </span>
                            ) : isTop3 ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200">
                                <TrendingUp size={14} />
                                Alternatif Baik
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs font-medium">
                                -
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CARD: PEMENANG */}
            {rankings.length > 0 && (
              <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-10 -mt-10 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-48 h-48 bg-white opacity-5 rounded-full blur-2xl"></div>

                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm border border-white/30">
                      <Award size={32} className="text-yellow-300" />
                    </div>
                    <div>
                      <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1">
                        🏆 Rekomendasi Terbaik
                      </p>
                      <h2 className="text-3xl font-bold text-white">
                        {winnerName}
                      </h2>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 mt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm font-medium mb-1">
                          Skor Akhir (SAW)
                        </p>
                        <p className="text-3xl font-bold text-white">
                          {rankings[0].score.toFixed(4)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-blue-100 text-sm font-medium mb-1">
                          Peringkat
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-3xl font-bold text-yellow-300">
                            #1
                          </span>
                          <Target size={24} className="text-yellow-300" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* --- KOLOM KANAN (1/3) --- */}
          <div className="xl:col-span-1 space-y-6">
            {/* CARD: BOBOT KRITERIA */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden sticky top-6">
              <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-white border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <BarChart3 className="text-blue-600" size={20} />
                  <h3 className="text-lg font-bold text-slate-800">
                    Bobot Kriteria Aktif
                  </h3>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {criteria.map((c) => {
                  const percentage = c.weight * 100;
                  return (
                    <div
                      key={c.id}
                      className="bg-slate-50 rounded-xl p-4 border border-slate-200 hover:border-blue-300 transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded-md font-mono text-xs font-bold">
                            {c.code}
                          </span>
                          <span className="text-sm font-semibold text-slate-700">
                            {c.name}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-500">
                          {c.type === "BENEFIT" ? "↑ Benefit" : "↓ Cost"}
                        </span>
                        <div className="flex items-end gap-1">
                          <span className="text-2xl font-bold text-blue-600">
                            {Math.round(percentage)}
                          </span>
                          <span className="text-sm text-blue-400 mb-1">%</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-700"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="px-6 pb-6">
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-xs text-blue-800 leading-relaxed">
                    <strong>Informasi:</strong> Bobot kriteria ini dihasilkan
                    dari perhitungan AHP dan digunakan dalam metode SAW untuk
                    menentukan peringkat software terbaik.
                  </p>
                </div>
              </div>
            </div>

            {/* CARD: INFO TOP 3 */}
            {rankings.length >= 3 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <Trophy className="text-yellow-600" size={20} />
                    <h3 className="font-bold text-slate-800">Top 3 Software</h3>
                  </div>
                </div>

                <div className="p-6 space-y-3">
                  {rankings.slice(0, 3).map((rank, index) => {
                    const altName = alternatives.find(
                      (a) => a.id === rank.alternativeId
                    )?.name;
                    return (
                      <div
                        key={rank.alternativeId}
                        className={`p-4 rounded-xl border-2 ${
                          index === 0
                            ? "bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-300"
                            : index === 1
                            ? "bg-gradient-to-br from-slate-50 to-slate-100 border-slate-300"
                            : "bg-gradient-to-br from-orange-50 to-orange-100 border-orange-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold text-sm ${
                              index === 0
                                ? "bg-yellow-400 text-yellow-900"
                                : index === 1
                                ? "bg-slate-400 text-slate-700"
                                : "bg-orange-400 text-orange-800"
                            }`}
                          >
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-slate-800 text-sm">
                              {altName}
                            </p>
                            <p className="text-xs font-mono text-slate-600 mt-0.5">
                              Score: {rank.score.toFixed(4)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
