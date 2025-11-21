import { PrismaClient } from "@prisma/client";
import {
  Database,
  Calculator,
  Trophy,
  ArrowRight,
  LayoutDashboard,
  Target,
  Info,
  CheckCircle2,
  TrendingUp,
  Scale,
} from "lucide-react";
import Link from "next/link";

const prisma = new PrismaClient();

export default async function Home() {
  // Hitung jumlah data untuk ditampilkan di dashboard
  const totalAlt = await prisma.alternative.count();
  const totalCrit = await prisma.criteria.count();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* === HEADER === */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <LayoutDashboard className="text-white" size={28} />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
                Dashboard Overview
              </h1>
              <p className="text-slate-500 mt-1">
                Sistem Pendukung Keputusan Pemilihan Software Project Management
                Terbaik
              </p>
            </div>
          </div>
        </div>

        {/* === CONTENT GRID === */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* --- KOLOM KIRI (2/3) --- */}
          <div className="xl:col-span-2 space-y-6">
            {/* CARD: TENTANG APLIKASI */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-white border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <Info className="text-blue-600" size={20} />
                  <div>
                    <h2 className="font-bold text-slate-800 text-lg">
                      Tentang Aplikasi
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Sistem pendukung keputusan berbasis web
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-5 border-2 border-blue-200">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-600 rounded-lg mt-0.5">
                      <Target size={20} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-blue-900 mb-2 text-base">
                        Tujuan Aplikasi
                      </h3>
                      <p className="text-sm text-blue-800 leading-relaxed">
                        Aplikasi ini dirancang untuk membantu pengambil
                        keputusan dalam{" "}
                        <strong>
                          memilih software project management terbaik
                        </strong>{" "}
                        yang sesuai dengan kebutuhan organisasi. Sistem
                        menggunakan pendekatan multi-kriteria untuk menganalisis
                        berbagai alternatif software berdasarkan kriteria
                        seperti kemudahan penggunaan, fitur kolaborasi, biaya,
                        bug management, dan integrasi sistem.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 size={18} className="text-green-600" />
                      <h4 className="font-bold text-green-900 text-sm">
                        Metode AHP
                      </h4>
                    </div>
                    <p className="text-xs text-green-800">
                      Analytical Hierarchy Process untuk menentukan bobot
                      prioritas setiap kriteria
                    </p>
                  </div>

                  <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp size={18} className="text-purple-600" />
                      <h4 className="font-bold text-purple-900 text-sm">
                        Metode SAW
                      </h4>
                    </div>
                    <p className="text-xs text-purple-800">
                      Simple Additive Weighting untuk menghitung skor akhir dan
                      perangkingan
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD: APA ITU SAW? */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-white border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <Scale className="text-purple-600" size={20} />
                  <div>
                    <h2 className="font-bold text-slate-800 text-lg">
                      Apa itu Metode SAW?
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Simple Additive Weighting Method
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-5">
                  <h3 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                    <Info size={18} />
                    Definisi
                  </h3>
                  <p className="text-sm text-purple-800 leading-relaxed">
                    <strong>SAW (Simple Additive Weighting)</strong> adalah
                    metode penjumlahan terbobot dari rating kinerja pada setiap
                    alternatif terhadap semua kriteria. Metode ini merupakan
                    salah satu metode penyelesaian masalah{" "}
                    <strong>MADM (Multi-Attribute Decision Making)</strong> yang
                    paling sederhana dan paling banyak digunakan.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-slate-800 text-base">
                    Cara Kerja Metode SAW:
                  </h3>

                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                        1
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-blue-900 text-sm mb-1">
                          Normalisasi Matriks
                        </h4>
                        <p className="text-xs text-blue-800">
                          Setiap nilai kriteria dinormalisasi berdasarkan
                          jenisnya (Benefit atau Cost)
                        </p>
                        <div className="mt-2 bg-white rounded-lg p-2 border border-blue-200">
                          <p className="text-xs font-mono text-slate-700">
                            <strong>Benefit:</strong> r[i,j] = x[i,j] /
                            max(x[j])
                          </p>
                          <p className="text-xs font-mono text-slate-700 mt-1">
                            <strong>Cost:</strong> r[i,j] = min(x[j]) / x[i,j]
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                        2
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-green-900 text-sm mb-1">
                          Perkalian dengan Bobot
                        </h4>
                        <p className="text-xs text-green-800">
                          Nilai normalisasi dikalikan dengan bobot kriteria dari
                          AHP
                        </p>
                        <div className="mt-2 bg-white rounded-lg p-2 border border-green-200">
                          <p className="text-xs font-mono text-slate-700">
                            V[i] = Σ (w[j] × r[i,j])
                          </p>
                          <p className="text-xs text-slate-600 mt-1">
                            w[j] = bobot kriteria ke-j
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-yellow-600 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                        3
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-yellow-900 text-sm mb-1">
                          Perangkingan
                        </h4>
                        <p className="text-xs text-yellow-800">
                          Alternatif dengan nilai V[i] tertinggi adalah
                          alternatif terbaik
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <h4 className="font-bold text-slate-800 text-sm mb-2">
                    Kelebihan Metode SAW:
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle2
                        size={14}
                        className="text-green-600 mt-0.5 flex-shrink-0"
                      />
                      <span>Mudah dipahami dan diimplementasikan</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2
                        size={14}
                        className="text-green-600 mt-0.5 flex-shrink-0"
                      />
                      <span>
                        Dapat menangani kriteria yang bersifat benefit maupun
                        cost
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2
                        size={14}
                        className="text-green-600 mt-0.5 flex-shrink-0"
                      />
                      <span>Proses perhitungan cepat dan efisien</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2
                        size={14}
                        className="text-green-600 mt-0.5 flex-shrink-0"
                      />
                      <span>Hasil ranking yang jelas dan transparan</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* CARD: QUICK ACTIONS */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <ArrowRight className="text-slate-400" size={20} />
                  <h2 className="font-bold text-slate-800 text-lg">
                    Menu Cepat
                  </h2>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                  href="/criteria"
                  className="group block bg-gradient-to-br from-purple-500 to-purple-600 p-5 rounded-xl text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
                >
                  <div className="flex items-center justify-between mb-3">
                    <Calculator size={28} />
                    <ArrowRight
                      size={20}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </div>
                  <h3 className="text-base font-bold mb-1">Kelola Kriteria</h3>
                  <p className="text-purple-100 text-xs">
                    Atur kriteria penilaian dan hitung bobot menggunakan AHP
                  </p>
                </Link>

                <Link
                  href="/alternative"
                  className="group block bg-gradient-to-br from-blue-500 to-blue-600 p-5 rounded-xl text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
                >
                  <div className="flex items-center justify-between mb-3">
                    <Database size={28} />
                    <ArrowRight
                      size={20}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </div>
                  <h3 className="text-base font-bold mb-1">
                    Kelola Alternatif
                  </h3>
                  <p className="text-blue-100 text-xs">
                    Tambah dan kelola data software yang akan dianalisis
                  </p>
                </Link>

                <Link
                  href="/calculation"
                  className="group block bg-gradient-to-br from-green-500 to-green-600 p-5 rounded-xl text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] md:col-span-2"
                >
                  <div className="flex items-center justify-between mb-3">
                    <Trophy size={28} />
                    <ArrowRight
                      size={20}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </div>
                  <h3 className="text-base font-bold mb-1">
                    Lihat Hasil Rekomendasi
                  </h3>
                  <p className="text-green-100 text-xs">
                    Lihat ranking software terbaik berdasarkan perhitungan SAW
                  </p>
                </Link>
              </div>
            </div>
          </div>

          {/* --- KOLOM KANAN (1/3) --- */}
          <div className="xl:col-span-1 space-y-6">
            {/* CARD: STATISTIK */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden sticky top-6">
              <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <Database className="text-slate-400" size={20} />
                  <h3 className="text-lg font-bold text-slate-800">
                    Statistik Data
                  </h3>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-blue-50 rounded-xl p-5 border-2 border-blue-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-600 rounded-lg">
                      <Database size={20} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">
                        Total Alternatif
                      </p>
                    </div>
                  </div>
                  <p className="text-4xl font-bold text-blue-700">{totalAlt}</p>
                  <p className="text-xs text-blue-600 mt-1">Software</p>
                </div>

                <div className="bg-purple-50 rounded-xl p-5 border-2 border-purple-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-purple-600 rounded-lg">
                      <Calculator size={20} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-purple-600 font-bold uppercase tracking-wider">
                        Total Kriteria
                      </p>
                    </div>
                  </div>
                  <p className="text-4xl font-bold text-purple-700">
                    {totalCrit}
                  </p>
                  <p className="text-xs text-purple-600 mt-1">
                    Kriteria Penilaian
                  </p>
                </div>

                <div className="bg-green-50 rounded-xl p-5 border-2 border-green-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-green-600 rounded-lg">
                      <Trophy size={20} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-green-600 font-bold uppercase tracking-wider">
                        Metode Analisis
                      </p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-green-700">AHP + SAW</p>
                  <p className="text-xs text-green-600 mt-1">Hybrid Method</p>
                </div>
              </div>

              <div className="px-6 pb-6">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <strong>Catatan:</strong> Pastikan semua data kriteria dan
                    alternatif sudah lengkap sebelum melihat hasil rekomendasi.
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
