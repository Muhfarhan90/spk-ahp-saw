import { PrismaClient } from "@prisma/client";
import { createAlternative, deleteAlternative } from "../actions";
import {
  Trash2,
  PlusCircle,
  Database,
  Package,
  ListFilter,
} from "lucide-react";
import EditAlternativeButton from "./EditAlternativeButton";
import ImportExcelButton from "./ImportExcelButton";

const prisma = new PrismaClient();

export default async function AlternativesPage() {
  // Ambil data kriteria untuk header tabel
  const criteria = await prisma.criteria.findMany({
    orderBy: { code: "asc" },
  });

  // Ambil data alternatif
  const alternatives = await prisma.alternative.findMany({
    include: { assessments: { include: { criteria: true } } },
    orderBy: { id: "desc" },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* === HEADER === */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <Package className="text-white" size={28} />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
                Manajemen Alternatif
              </h1>
              <p className="text-slate-500 mt-1">
                Kelola data software yang akan dianalisis dan dinilai
              </p>
            </div>
            <div className="hidden lg:flex items-center gap-3">
              <ImportExcelButton criteria={criteria} />
              <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-bold border-2 border-blue-200">
                {alternatives.length} Software
              </span>
            </div>
          </div>
        </div>

        {/* === CONTENT GRID === */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* --- KOLOM KIRI (2/3) --- */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Database className="text-slate-400" size={20} />
                    <h2 className="font-bold text-slate-800 text-lg">
                      Daftar Software
                    </h2>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                    {alternatives.length} Data
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider w-16">
                        No
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Nama Software
                      </th>
                      {/* Header Kriteria Dinamis */}
                      {criteria.map((crit) => (
                        <th
                          key={crit.id}
                          className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider w-20"
                          title={crit.name}
                        >
                          {crit.code}
                        </th>
                      ))}
                      <th className="px-6 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider w-24">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {alternatives.length === 0 ? (
                      <tr>
                        <td
                          colSpan={criteria.length + 3}
                          className="px-6 py-12 text-center"
                        >
                          <div className="flex flex-col items-center gap-3">
                            <div className="p-4 bg-slate-100 rounded-full">
                              <ListFilter
                                size={32}
                                className="text-slate-400"
                              />
                            </div>
                            <p className="text-slate-500 font-medium">
                              Belum ada data software
                            </p>
                            <p className="text-sm text-slate-400">
                              Tambahkan software untuk memulai penilaian
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      alternatives.map((alt, idx) => (
                        <tr
                          key={alt.id}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-6 py-4 text-slate-500 font-mono text-sm">
                            {idx + 1}
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-slate-800">
                              {alt.name}
                            </span>
                          </td>
                          {/* Mapping Nilai Kriteria Dinamis */}
                          {criteria.map((crit) => {
                            const assessment = alt.assessments.find(
                              (a) => a.criteriaId === crit.id
                            );
                            const value = assessment?.value || 0;

                            // Format nilai untuk ditampilkan
                            const displayValue =
                              crit.type === "COST"
                                ? new Intl.NumberFormat("id-ID").format(value) // Format ribuan
                                : value.toString();

                            return (
                              <td
                                key={crit.id}
                                className="px-4 py-4 text-center"
                              >
                                {crit.type === "COST" ? (
                                  // Tampilan untuk kriteria COST (Biaya)
                                  <span className="text-xs font-mono font-bold text-slate-700">
                                    {displayValue}
                                  </span>
                                ) : (
                                  // Tampilan untuk kriteria BENEFIT (1-5)
                                  <span
                                    className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold ${
                                      value >= 4
                                        ? "bg-green-100 text-green-700"
                                        : value <= 2
                                        ? "bg-red-100 text-red-700"
                                        : value === 3
                                        ? "bg-yellow-100 text-yellow-700"
                                        : "bg-slate-100 text-slate-400"
                                    }`}
                                  >
                                    {value || "-"}
                                  </span>
                                )}
                              </td>
                            );
                          })}
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <EditAlternativeButton
                                alternative={{
                                  id: alt.id,
                                  name: alt.name,
                                  assessments: alt.assessments.map((a) => ({
                                    criteriaId: a.criteriaId,
                                    value: a.value,
                                  })),
                                }}
                                criteria={criteria}
                              />
                              <form
                                action={deleteAlternative.bind(null, alt.id)}
                              >
                                <button
                                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                  suppressHydrationWarning
                                >
                                  <Trash2 size={18} />
                                </button>
                              </form>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* --- KOLOM KANAN (1/3) --- */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden sticky top-6">
              <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-white border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <PlusCircle className="text-blue-600" size={22} />
                  <h3 className="text-lg font-bold text-slate-800">
                    Tambah Software
                  </h3>
                </div>
              </div>

              <form action={createAlternative} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Nama Software
                  </label>
                  <input
                    name="name"
                    type="text"
                    required
                    placeholder="Contoh: Jira, Trello..."
                    className="w-full border-2 border-slate-300 px-4 py-3 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    suppressHydrationWarning
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3">
                    Penilaian Kriteria
                  </label>
                  <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    {/* Form Kriteria Dinamis */}
                    {criteria.map((crit) => (
                      <div key={crit.id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-semibold text-slate-700">
                            {crit.name}
                          </label>
                          <span
                            className={`text-xs font-bold px-2 py-1 rounded ${
                              crit.type === "COST"
                                ? "bg-red-100 text-red-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {crit.type}
                          </span>
                        </div>
                        {crit.type === "COST" ? (
                          // Input angka untuk kriteria COST (Biaya)
                          <input
                            name={crit.code}
                            type="number"
                            min="0"
                            step="1000"
                            defaultValue="100000"
                            placeholder="Contoh: 150000"
                            className="w-full border-2 border-slate-300 bg-white text-slate-900 px-4 py-2.5 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            suppressHydrationWarning
                          />
                        ) : (
                          // Select 1-5 untuk kriteria BENEFIT
                          <select
                            name={crit.code}
                            className="w-full border-2 border-slate-300 bg-white text-slate-900 px-4 py-2.5 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none cursor-pointer transition-all"
                            suppressHydrationWarning
                          >
                            <option value="1">1 - Sangat Buruk</option>
                            <option value="2">2 - Buruk</option>
                            <option value="3" defaultValue="3">
                              3 - Cukup
                            </option>
                            <option value="4">4 - Baik</option>
                            <option value="5">5 - Sangat Baik</option>
                          </select>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 active:scale-[0.98] transition-all shadow-lg hover:shadow-xl flex justify-center items-center gap-2"
                    suppressHydrationWarning
                  >
                    <PlusCircle size={18} />
                    Tambah Software
                  </button>
                </div>
              </form>

              <div className="px-6 pb-6">
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-xs text-blue-800 leading-relaxed">
                    <strong>Informasi:</strong> Nilai kriteria menggunakan skala
                    1-5, dimana semakin tinggi nilai semakin baik (kecuali untuk
                    kriteria Cost).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
