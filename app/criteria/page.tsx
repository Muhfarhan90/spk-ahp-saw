"use client";

import { useState, useEffect } from "react";
import {
  saveAhpWeights,
  getCriteriaData,
  createCriterion,
  deleteCriterion,
} from "../actions";
import {
  Calculator,
  Save,
  CheckCircle,
  AlertTriangle,
  Activity,
  Scale,
  Trash2,
  PlusCircle,
  ListFilter,
  ArrowRight,
  Table2,
  Database,
  BookOpen,
  Info,
} from "lucide-react";

// --- TIPE DATA ---
type Criterion = {
  id: string;
  code: string;
  name: string;
  type: "BENEFIT" | "COST";
  weight: number;
  comparisonRow?: string | null;
};

const RI_TABLE = [
  0, 0, 0.58, 0.9, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49, 1.51, 1.48, 1.56, 1.57,
  1.59,
];

export default function CriteriaPage() {
  // --- STATE ---
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [matrix, setMatrix] = useState<number[][]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValues, setInputValues] = useState<{ [key: string]: string }>({});
  const [activeCell, setActiveCell] = useState<{ row: number; col: number } | null>(null);
  const [savedWeights, setSavedWeights] = useState<{ [key: string]: number }>(
    {}
  );
  const [hasSavedData, setHasSavedData] = useState(false);
  const [savedMatrix, setSavedMatrix] = useState<number[][]>([]);
  const [savedStats, setSavedStats] = useState({
    colSums: [] as number[],
    normalizedMatrix: [] as number[][],
    weights: [] as number[],
    lambdaMax: 0,
    ci: 0,
    ri: 0,
    cr: 0,
    isConsistent: true,
  });

  const [stats, setStats] = useState({
    colSums: [] as number[],
    normalizedMatrix: [] as number[][],
    weights: [] as number[],
    lambdaMax: 0,
    ci: 0,
    ri: 0,
    cr: 0,
    isConsistent: true,
  });

  // --- FETCH DATA ---
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = await getCriteriaData();
      setCriteria(data as Criterion[]);

      const n = data.length;
      
      // Cek apakah ada bobot yang tersimpan
      const hasWeights = data.some((c: Criterion) => c.weight > 0);
      setHasSavedData(hasWeights);
      
      // Simpan bobot yang ada di database
      const weights: { [key: string]: number } = {};
      data.forEach((c: Criterion) => {
        weights[c.id] = c.weight;
      });
      setSavedWeights(weights);

      // Jika ada bobot tersimpan, load matriks dari database
      if (hasWeights) {
        const savedWeightsArray = data.map((c: Criterion) => c.weight);
        
        // Cek apakah ada matriks perbandingan yang tersimpan
        const hasComparisonData = data.some((c: Criterion) => c.comparisonRow);
        
        if (hasComparisonData) {
          // Load matriks dari database (data asli yang disimpan)
          const loadedMatrix = data.map((c: Criterion) => {
            if (c.comparisonRow) {
              try {
                return JSON.parse(c.comparisonRow);
              } catch {
                return Array(n).fill(1);
              }
            }
            return Array(n).fill(1);
          });
          setMatrix(loadedMatrix);
        } else {
          // Fallback: buat matriks identitas jika data lama
          const newMatrix = Array(n)
            .fill(0)
            .map(() => Array(n).fill(1));
          setMatrix(newMatrix);
        }
        
        // Set savedStats dengan bobot yang sudah tersimpan
        setSavedStats({
          colSums: [],
          normalizedMatrix: [],
          weights: savedWeightsArray,
          lambdaMax: 0,
          ci: 0,
          ri: 0,
          cr: 0,
          isConsistent: true, // Asumsikan konsisten karena sudah tersimpan
        });
      } else {
        // Jika belum ada bobot tersimpan, buat matriks identitas
        const newMatrix = Array(n)
          .fill(0)
          .map(() => Array(n).fill(1));
        setMatrix(newMatrix);
      }
    } catch (error) {
      console.error("Gagal load data:", error);
    }
  };



  // --- LOGIC AHP ---
  useEffect(() => {
    if (matrix.length === 0) return;

    const size = matrix.length;
    const colSums = matrix[0].map((_, colIndex) =>
      matrix.reduce((sum, row) => sum + row[colIndex], 0)
    );
    const normalizedMatrix = matrix.map((row) =>
      row.map((val, colIndex) => val / colSums[colIndex])
    );
    const weights = normalizedMatrix.map((row) => {
      const rowSum = row.reduce((a, b) => a + b, 0);
      return rowSum / size;
    });
    const lambdaMax = colSums.reduce(
      (sum, colTotal, idx) => sum + colTotal * weights[idx],
      0
    );
    const CI = (lambdaMax - size) / (size - 1);
    const RI = RI_TABLE[size - 1] || 1.12;
    const CR = size > 2 ? CI / RI : 0;

    setStats({
      colSums,
      normalizedMatrix,
      weights,
      lambdaMax,
      ci: CI,
      ri: RI,
      cr: CR,
      isConsistent: CR <= 0.1,
    });
  }, [matrix]);

  const handleMatrixChange = (row: number, col: number, value: number) => {
    const newMatrix = [...matrix];
    newMatrix[row][col] = value;
    newMatrix[col][row] = 1 / value;
    setMatrix(newMatrix);
  };

  const evaluateFraction = (input: string): number | null => {
    // Cek apakah input adalah pecahan (contoh: 3/8, 1/5)
    if (input.includes('/')) {
      const parts = input.split('/');
      if (parts.length === 2) {
        const numerator = parseFloat(parts[0].trim());
        const denominator = parseFloat(parts[1].trim());
        if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
          return numerator / denominator;
        }
      }
      return null;
    }
    // Jika bukan pecahan, parse sebagai angka biasa
    const val = parseFloat(input);
    return isNaN(val) ? null : val;
  };

  const handleKeyDown = (e: React.KeyboardEvent, row: number, col: number) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      
      // Ambil nilai input saat ini
      const input = e.currentTarget as HTMLInputElement;
      const inputValue = input.value;
      
      // Evaluasi pecahan atau angka
      const calculatedValue = evaluateFraction(inputValue);
      
      if (calculatedValue !== null) {
        // Validasi nilai (0.1 - 9)
        let finalValue = calculatedValue;
        if (finalValue < 0.1) finalValue = 0.1;
        if (finalValue > 9) finalValue = 9;
        
        // Update matrix dengan nilai yang dihitung
        handleMatrixChange(row, col, finalValue);
        
        // Hapus nilai input sementara
        setInputValues((prev) => {
          const newValues = { ...prev };
          delete newValues[`${row}-${col}`];
          return newValues;
        });
      }
      
      moveToNextCell(row, col, e.shiftKey);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      moveToNextCell(row, col, false);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      moveToNextCell(row, col, true);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextRow = row + 1;
      if (nextRow < criteria.length) {
        focusCell(nextRow, col);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevRow = row - 1;
      if (prevRow >= 0) {
        focusCell(prevRow, col);
      }
    }
  };

  const moveToNextCell = (currentRow: number, currentCol: number, backward: boolean = false) => {
    let nextRow = currentRow;
    let nextCol = currentCol;

    if (backward) {
      // Move backward
      nextCol--;
      while (nextRow >= 0) {
        while (nextCol >= 0) {
          if (nextRow !== nextCol && nextRow < nextCol) {
            focusCell(nextRow, nextCol);
            return;
          }
          nextCol--;
        }
        nextRow--;
        nextCol = criteria.length - 1;
      }
    } else {
      // Move forward
      nextCol++;
      while (nextRow < criteria.length) {
        while (nextCol < criteria.length) {
          if (nextRow !== nextCol && nextRow < nextCol) {
            focusCell(nextRow, nextCol);
            return;
          }
          nextCol++;
        }
        nextRow++
;
        nextCol = 0;
      }
    }
  };

  const focusCell = (row: number, col: number) => {
    const input = document.getElementById(`matrix-${row}-${col}`) as HTMLInputElement;
    if (input) {
      input.focus();
      input.select();
      setActiveCell({ row, col });
    }
  };

  const handleSaveWeights = async () => {
    if (!stats.isConsistent && criteria.length > 2) {
      if (!confirm("Data TIDAK KONSISTEN (CR > 0.1). Tetap simpan?")) return;
    }
    setLoading(true);
    try {
      await saveAhpWeights(matrix);
      alert("✅ Bobot berhasil diperbarui!");
      
      // Reload data tanpa reset matriks
      const data = await getCriteriaData();
      setCriteria(data as Criterion[]);
      
      // Update savedWeights
      const weights: { [key: string]: number } = {};
      data.forEach((c: Criterion) => {
        weights[c.id] = c.weight;
      });
      setSavedWeights(weights);
      setHasSavedData(true);
      
      // Update savedStats
      const savedWeightsArray = data.map((c: Criterion) => c.weight);
      setSavedStats({
        colSums: [],
        normalizedMatrix: [],
        weights: savedWeightsArray,
        lambdaMax: 0,
        ci: 0,
        ri: 0,
        cr: 0,
        isConsistent: true,
      });
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Yakin hapus kriteria ini?")) {
      await deleteCriterion(id);
      fetchData();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* === HEADER === */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <Calculator className="text-white" size={28} />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
                Manajemen Kriteria
              </h1>
              <p className="text-slate-500 mt-1">
                Kelola kriteria dan hitung pembobotan menggunakan metode AHP
              </p>
            </div>
            {criteria.length >= 2 && (
              <div
                className={`hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${
                  stats.isConsistent
                    ? "bg-green-50 text-green-700 border-2 border-green-200"
                    : "bg-red-50 text-red-700 border-2 border-red-200"
                }`}
              >
                {stats.isConsistent ? (
                  <CheckCircle size={18} />
                ) : (
                  <AlertTriangle size={18} />
                )}
                <span>
                  {stats.isConsistent ? "Konsisten" : "Tidak Konsisten"}
                </span>
                <span className="opacity-60">|</span>
                <span>CR: {stats.cr.toFixed(4)}</span>
              </div>
            )}
          </div>
        </div>

        {/* === CONTENT GRID === */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* --- KOLOM KIRI (2/3) --- */}
          <div className="xl:col-span-2 space-y-6">
            {/* CARD: DAFTAR KRITERIA */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Database className="text-slate-400" size={20} />
                    <h2 className="font-bold text-slate-800 text-lg">
                      Daftar Kriteria
                    </h2>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                    {criteria.length} Data
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
                        Nama Kriteria
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider w-24">
                        Kode
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider w-32">
                        Tipe
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider w-24">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {criteria.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="p-4 bg-slate-100 rounded-full">
                              <ListFilter
                                size={32}
                                className="text-slate-400"
                              />
                            </div>
                            <p className="text-slate-500 font-medium">
                              Belum ada kriteria
                            </p>
                            <p className="text-sm text-slate-400">
                              Tambahkan kriteria untuk memulai
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      criteria.map((c, idx) => (
                        <tr
                          key={c.id}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-6 py-4 text-slate-500 font-mono text-sm">
                            {idx + 1}
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-slate-800">
                              {c.name}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-lg font-mono text-sm font-bold">
                              {c.code}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold uppercase ${
                                c.type === "COST"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {c.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => handleDelete(c.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Hapus"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CARD: MATRIKS PERBANDINGAN */}
            {criteria.length >= 2 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-white border-b border-slate-200">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-center gap-3">
                      <Scale className="text-blue-600" size={20} />
                      <div>
                        <h2 className="font-bold text-slate-800 text-lg">
                          Matriks Perbandingan Berpasangan
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Skala 1-9 atau pecahan (contoh: 3/8, 1/5) • Enter/Tab untuk pindah cell
                        </p>
                      </div>
                    </div>
                    <div
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold ${
                        stats.isConsistent
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {stats.isConsistent ? (
                        <CheckCircle size={16} />
                      ) : (
                        <AlertTriangle size={16} />
                      )}
                      CR: {stats.cr.toFixed(4)}
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse min-w-[600px]">
                    <thead>
                      <tr>
                        <th className="p-3 bg-slate-50 border-b-2 border-r-2 border-slate-200 sticky left-0 z-20 w-36"></th>
                        {criteria.map((c) => (
                          <th
                            key={c.id}
                            className="p-3 bg-slate-50 border-b-2 border-r border-slate-200 text-xs font-bold text-slate-600 uppercase min-w-[80px] text-center"
                          >
                            {c.code}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {criteria.map((row, rIdx) => (
                        <tr key={row.id}>
                          <th className="p-3 bg-white border-b border-r-2 border-slate-200 text-xs text-left font-bold text-slate-700 sticky left-0 z-10">
                            {row.name}
                          </th>
                          {criteria.map((col, cIdx) => (
                            <td
                              key={col.id}
                              className={`border-b border-r border-slate-100 p-2 ${
                                rIdx === cIdx
                                  ? "bg-slate-100"
                                  : rIdx > cIdx
                                  ? "bg-slate-50"
                                  : "bg-white"
                              }`}
                            >
                              {rIdx === cIdx ? (
                                <div className="text-center font-bold text-slate-500">
                                  1
                                </div>
                              ) : rIdx > cIdx ? (
                                <div className="text-center text-sm font-mono text-slate-500">
                                  {matrix[rIdx][cIdx].toFixed(4)}
                                </div>
                              ) : (
                                <input
                                  id={`matrix-${rIdx}-${cIdx}`}
                                  type="text"
                                  value={
                                    inputValues[`${rIdx}-${cIdx}`] ??
                                    matrix[rIdx][cIdx]
                                  }
                                  onChange={(e) => {
                                    const inputValue = e.target.value;
                                    const key = `${rIdx}-${cIdx}`;

                                    // Simpan nilai input sementara (termasuk pecahan)
                                    setInputValues((prev) => ({
                                      ...prev,
                                      [key]: inputValue,
                                    }));

                                    // Update matrix hanya jika nilai valid (angka atau pecahan)
                                    const val = evaluateFraction(inputValue);
                                    if (val !== null && val > 0 && val <= 9) {
                                      handleMatrixChange(rIdx, cIdx, val);
                                    }
                                  }}
                                  onBlur={(e) => {
                                    const key = `${rIdx}-${cIdx}`;
                                    const calculatedValue = evaluateFraction(e.target.value);
                                    
                                    let val = calculatedValue !== null ? calculatedValue : 1;

                                    // Validasi dan koreksi nilai
                                    if (val <= 0) {
                                      val = 1;
                                    } else if (val > 9) {
                                      val = 9;
                                    } else if (val < 0.1) {
                                      val = 0.1;
                                    }

                                    handleMatrixChange(rIdx, cIdx, val);

                                    // Hapus nilai input sementara
                                    setInputValues((prev) => {
                                      const newValues = { ...prev };
                                      delete newValues[key];
                                      return newValues;
                                    });
                                    setActiveCell(null);
                                  }}
                                  onFocus={(e) => {
                                    e.target.select();
                                    setActiveCell({ row: rIdx, col: cIdx });
                                  }}
                                  onKeyDown={(e) => handleKeyDown(e, rIdx, cIdx)}
                                  placeholder="1-9 atau 1/5"
                                  className={`w-full text-center font-bold text-slate-900 bg-white border-2 rounded-lg py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                                    activeCell?.row === rIdx && activeCell?.col === cIdx
                                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                                      : 'border-slate-300'
                                  }`}
                                />
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                      <tr className="bg-blue-50">
                        <th className="p-3 border-r-2 border-blue-100 text-xs text-left font-bold text-blue-800 sticky left-0 bg-blue-50 z-10">
                          JUMLAH (Σ)
                        </th>
                        {stats.colSums.map((sum, idx) => (
                          <td
                            key={idx}
                            className="p-3 text-center text-sm border-r border-blue-100 font-mono font-bold text-blue-700"
                          >
                            {sum.toFixed(3)}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="p-5 bg-slate-50 border-t border-slate-200">
                  <button
                    onClick={handleSaveWeights}
                    disabled={loading}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Save size={18} />
                    {loading ? "Menyimpan..." : "Simpan Bobot AHP"}
                  </button>
                </div>
              </div>
            )}

            {/* CARD: MATRIKS NORMALISASI */}
            {criteria.length >= 2 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <Table2 className="text-slate-500" size={20} />
                    <div>
                      <h2 className="font-bold text-slate-800 text-lg">
                        Matriks Normalisasi & Eigen Vector
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Hasil perhitungan bobot prioritas (AHP)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse min-w-[600px]">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="p-3 text-slate-600 text-xs font-bold uppercase border-b-2 border-slate-200 w-36 text-left">
                          Kriteria
                        </th>
                        {criteria.map((c) => (
                          <th
                            key={c.id}
                            className="p-3 border-b-2 border-slate-200 text-xs font-bold text-slate-600 uppercase text-center"
                          >
                            {c.code}
                          </th>
                        ))}
                        <th className="p-3 bg-yellow-50 border-b-2 border-l-2 border-yellow-200 text-xs font-bold text-yellow-700 uppercase text-center">
                          Σ Baris
                        </th>
                        <th className="p-3 bg-blue-50 border-b-2 border-l-2 border-blue-200 text-xs font-bold text-blue-700 uppercase text-center">
                          Bobot (V)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {criteria.map((row, rIdx) => {
                        const rowSum =
                          stats.normalizedMatrix[rIdx]?.reduce(
                            (a, b) => a + b,
                            0
                          ) || 0;
                        return (
                          <tr
                            key={row.id}
                            className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                          >
                            <td className="p-3 text-sm font-bold text-slate-700">
                              {row.name}
                            </td>
                            {criteria.map((col, cIdx) => (
                              <td
                                key={col.id}
                                className="p-3 text-center text-xs text-slate-600 font-mono"
                              >
                                {stats.normalizedMatrix[rIdx]
                                  ? stats.normalizedMatrix[rIdx][cIdx].toFixed(
                                      4
                                    )
                                  : "0.0000"}
                              </td>
                            ))}
                            <td className="p-3 text-center text-sm font-mono font-bold text-yellow-700 bg-yellow-50/50 border-l-2 border-yellow-100">
                              {rowSum.toFixed(4)}
                            </td>
                            <td className="p-3 text-center text-sm font-mono font-bold text-blue-700 bg-blue-50/50 border-l-2 border-blue-100">
                              {(stats.weights[rIdx] || 0).toFixed(4)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* CARD: BOBOT AHP TERSIMPAN */}
            {criteria.length >= 2 && hasSavedData && (
              <div className="bg-white rounded-2xl shadow-sm border-2 border-green-300 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-white border-b border-green-200">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="text-green-600" size={20} />
                      <div>
                        <h2 className="font-bold text-slate-800 text-lg">
                          Bobot AHP Tersimpan di Database
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Hasil perhitungan bobot prioritas yang sudah disimpan
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">
                      ✓ Tersimpan
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-green-50 border-b-2 border-green-200">
                        <th className="px-6 py-3 text-left text-xs font-bold text-green-700 uppercase tracking-wider w-16">
                          No
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-bold text-green-700 uppercase tracking-wider w-24">
                          Kode
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-green-700 uppercase tracking-wider">
                          Nama Kriteria
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-bold text-green-700 uppercase tracking-wider w-32">
                          Bobot (V)
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-bold text-green-700 uppercase tracking-wider w-32">
                          Persentase
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-bold text-green-700 uppercase tracking-wider">
                          Visualisasi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-green-100">
                      {criteria.map((c, idx) => {
                        const weight = savedStats.weights[idx] || 0;
                        const percentage = weight * 100;
                        return (
                          <tr key={c.id} className="hover:bg-green-50/30 transition-colors">
                            <td className="px-6 py-4 text-slate-500 font-mono text-sm">
                              {idx + 1}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-lg font-mono text-sm font-bold">
                                {c.code}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-semibold text-slate-800">
                                {c.name}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="font-mono text-base font-bold text-slate-700">
                                {weight.toFixed(4)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="font-mono text-base font-bold text-green-700">
                                {percentage.toFixed(2)}%
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex-1 bg-slate-200 rounded-full h-3 overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-700"
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs font-bold text-slate-600 w-12 text-right">
                                  {percentage.toFixed(1)}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-green-100 border-t-2 border-green-300">
                        <td colSpan={3} className="px-6 py-4 text-right font-bold text-green-800 uppercase text-sm">
                          Total:
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-mono text-base font-bold text-green-800">
                            {savedStats.weights.reduce((a, b) => a + b, 0).toFixed(4)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-mono text-base font-bold text-green-800">
                            {(savedStats.weights.reduce((a, b) => a + b, 0) * 100).toFixed(2)}%
                          </span>
                        </td>
                        <td className="px-6 py-4"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="px-6 py-4 bg-green-50 border-t border-green-200">
                  <div className="flex items-start gap-3">
                    <Info size={16} className="text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-green-800 leading-relaxed">
                        <strong>Informasi:</strong> Bobot di atas adalah hasil perhitungan AHP yang tersimpan di database dan digunakan untuk perhitungan SAW di halaman hasil. 
                        Jika Anda ingin mengubah bobot, silakan ubah nilai perbandingan di matriks di atas dan klik tombol &quot;Simpan Bobot AHP&quot;.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PERINGATAN JIKA BELUM ADA DATA TERSIMPAN */}
            {criteria.length >= 2 && !hasSavedData && (
              <div className="bg-white rounded-2xl shadow-sm border-2 border-orange-200 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-orange-50 to-white">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <AlertTriangle className="text-orange-600" size={20} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-orange-900 text-base mb-1">
                        Bobot Belum Tersimpan
                      </h3>
                      <p className="text-sm text-orange-800 leading-relaxed">
                        Anda belum menyimpan bobot AHP ke database. Silakan isi matriks perbandingan di atas, 
                        pastikan nilai CR ≤ 0.1 (konsisten), lalu klik tombol <strong>"Simpan Bobot AHP"</strong> 
                        untuk menyimpan hasil perhitungan.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CARD: KETERANGAN RUMUS */}
            {criteria.length >= 2 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-white border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <BookOpen className="text-purple-600" size={20} />
                    <div>
                      <h2 className="font-bold text-slate-800 text-lg">
                        Keterangan Rumus & Perhitungan AHP
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Penjelasan lengkap metode Analytical Hierarchy Process
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Rumus 1: Normalisasi */}
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-2 bg-blue-600 rounded-lg">
                        <Info className="text-white" size={16} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-blue-900 text-base mb-1">
                          1. Normalisasi Matriks
                        </h3>
                        <p className="text-sm text-blue-800">
                          Setiap elemen matriks dibagi dengan total kolomnya
                        </p>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                      <p className="text-sm font-mono text-slate-700 mb-2">
                        <strong>Rumus:</strong>
                      </p>
                      <p className="text-base font-mono bg-slate-50 p-3 rounded border border-slate-200 text-center text-slate-900">
                        N[i,j] = A[i,j] / Σ A[k,j]
                      </p>
                      <div className="mt-3 text-xs text-slate-600 space-y-1">
                        <p>
                          <strong>Dimana:</strong>
                        </p>
                        <p>• N[i,j] = Nilai normalisasi baris i kolom j</p>
                        <p>
                          • A[i,j] = Nilai matriks perbandingan baris i kolom j
                        </p>
                        <p>• Σ A[k,j] = Jumlah kolom j</p>
                      </div>
                    </div>
                  </div>

                  {/* Rumus 2: Eigen Vector */}
                  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-2 bg-green-600 rounded-lg">
                        <Info className="text-white" size={16} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-green-900 text-base mb-1">
                          2. Eigen Vector (Bobot Prioritas)
                        </h3>
                        <p className="text-sm text-green-800">
                          Rata-rata dari setiap baris matriks normalisasi
                        </p>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <p className="text-sm font-mono text-slate-700 mb-2">
                        <strong>Rumus:</strong>
                      </p>
                      <p className="text-base font-mono bg-slate-50 p-3 rounded border border-slate-200 text-center text-slate-900">
                        W[i] = (Σ N[i,j]) / n
                      </p>
                      <div className="mt-3 text-xs text-slate-600 space-y-1">
                        <p>
                          <strong>Dimana:</strong>
                        </p>
                        <p>• W[i] = Bobot kriteria ke-i</p>
                        <p>• Σ N[i,j] = Jumlah nilai normalisasi baris i</p>
                        <p>• n = Jumlah kriteria</p>
                      </div>
                    </div>
                  </div>

                  {/* Rumus 3: Lambda Max */}
                  <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-2 bg-yellow-600 rounded-lg">
                        <Info className="text-white" size={16} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-yellow-900 text-base mb-1">
                          3. Lambda Max (λ-max)
                        </h3>
                        <p className="text-sm text-yellow-800">
                          Nilai eigen maksimum untuk uji konsistensi
                        </p>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-yellow-200">
                      <p className="text-sm font-mono text-slate-700 mb-2">
                        <strong>Rumus:</strong>
                      </p>
                      <p className="text-base font-mono bg-slate-50 p-3 rounded border border-slate-200 text-center text-slate-900">
                        λ-max = Σ (Jumlah Kolom[j] × W[j])
                      </p>
                      <div className="mt-3 text-xs text-slate-600 space-y-1">
                        <p>
                          <strong>Hasil saat ini:</strong>
                        </p>
                        <p className="font-bold text-yellow-800">
                          λ-max = {stats.lambdaMax.toFixed(4)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Rumus 4: Consistency Index */}
                  <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-2 bg-orange-600 rounded-lg">
                        <Info className="text-white" size={16} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-orange-900 text-base mb-1">
                          4. Consistency Index (CI)
                        </h3>
                        <p className="text-sm text-orange-800">
                          Indeks konsistensi dari matriks perbandingan
                        </p>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-orange-200">
                      <p className="text-sm font-mono text-slate-700 mb-2">
                        <strong>Rumus:</strong>
                      </p>
                      <p className="text-base font-mono bg-slate-50 p-3 rounded border border-slate-200 text-center text-slate-900">
                        CI = (λ-max - n) / (n - 1)
                      </p>
                      <div className="mt-3 text-xs text-slate-600 space-y-1">
                        <p>
                          <strong>Dimana:</strong>
                        </p>
                        <p>• λ-max = Lambda maksimum</p>
                        <p>• n = Jumlah kriteria</p>
                        <p className="font-bold text-orange-800 mt-2">
                          CI = {stats.ci.toFixed(4)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Rumus 5: Consistency Ratio */}
                  <div
                    className={`${
                      stats.isConsistent
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    } border-2 rounded-xl p-5`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className={`p-2 rounded-lg ${
                          stats.isConsistent ? "bg-green-600" : "bg-red-600"
                        }`}
                      >
                        {stats.isConsistent ? (
                          <CheckCircle className="text-white" size={16} />
                        ) : (
                          <AlertTriangle className="text-white" size={16} />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3
                          className={`font-bold text-base mb-1 ${
                            stats.isConsistent
                              ? "text-green-900"
                              : "text-red-900"
                          }`}
                        >
                          5. Consistency Ratio (CR)
                        </h3>
                        <p
                          className={`text-sm ${
                            stats.isConsistent
                              ? "text-green-800"
                              : "text-red-800"
                          }`}
                        >
                          Rasio konsistensi - Harus ≤ 0.1 (10%)
                        </p>
                      </div>
                    </div>
                    <div
                      className={`bg-white rounded-lg p-4 border ${
                        stats.isConsistent
                          ? "border-green-200"
                          : "border-red-200"
                      }`}
                    >
                      <p className="text-sm font-mono text-slate-700 mb-2">
                        <strong>Rumus:</strong>
                      </p>
                      <p className="text-base font-mono bg-slate-50 p-3 rounded border border-slate-200 text-center text-slate-900">
                        CR = CI / RI
                      </p>
                      <div className="mt-3 text-xs text-slate-600 space-y-1">
                        <p>
                          <strong>Dimana:</strong>
                        </p>
                        <p>• CI = Consistency Index</p>
                        <p>
                          • RI = Random Index (tabel Saaty) ={" "}
                          {stats.ri.toFixed(2)}
                        </p>
                        <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <p className="font-bold text-slate-700 mb-2">
                            Hasil Perhitungan:
                          </p>
                          <p className="font-mono">
                            CR = {stats.ci.toFixed(4)} / {stats.ri.toFixed(2)} ={" "}
                            <span
                              className={`font-bold ${
                                stats.isConsistent
                                  ? "text-green-700"
                                  : "text-red-700"
                              }`}
                            >
                              {stats.cr.toFixed(4)}
                            </span>
                          </p>
                          <p
                            className={`mt-2 font-bold text-sm ${
                              stats.isConsistent
                                ? "text-green-700"
                                : "text-red-700"
                            }`}
                          >
                            {stats.isConsistent
                              ? "✅ KONSISTEN (CR ≤ 0.1)"
                              : "❌ TIDAK KONSISTEN (CR > 0.1)"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tabel Random Index */}
                  <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-5">
                    <h3 className="font-bold text-slate-800 text-base mb-3 flex items-center gap-2">
                      <Database size={18} className="text-slate-600" />
                      Tabel Random Index (RI) - Saaty
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-200">
                            <th className="px-3 py-2 text-left font-bold text-slate-700 border border-slate-300">
                              n (Jumlah Kriteria)
                            </th>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                              <th
                                key={n}
                                className="px-3 py-2 text-center font-bold text-slate-700 border border-slate-300"
                              >
                                {n}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="px-3 py-2 font-bold text-slate-700 bg-slate-100 border border-slate-300">
                              RI
                            </td>
                            {RI_TABLE.slice(0, 10).map((ri, idx) => (
                              <td
                                key={idx}
                                className={`px-3 py-2 text-center font-mono border border-slate-300 ${
                                  idx === criteria.length - 1
                                    ? "bg-blue-100 font-bold text-blue-800"
                                    : "bg-white text-slate-600"
                                }`}
                              >
                                {ri.toFixed(2)}
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-slate-600 mt-3">
                      <strong>Keterangan:</strong> Nilai RI yang digunakan untuk
                      n = {criteria.length} adalah{" "}
                      <span className="font-bold text-blue-700">
                        {stats.ri.toFixed(2)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* --- KOLOM KANAN (1/3) --- */}
          <div className="xl:col-span-1 space-y-6">
            {/* FORM TAMBAH KRITERIA */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-white border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <PlusCircle className="text-blue-600" size={22} />
                  <h3 className="text-lg font-bold text-slate-800">
                    Tambah Kriteria
                  </h3>
                </div>
              </div>

              <form
                action={async (fd) => {
                  await createCriterion(fd);
                  fetchData();
                }}
                className="p-6 space-y-5"
              >
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Nama Kriteria
                  </label>
                  <input
                    name="name"
                    required
                    placeholder="Contoh: Keamanan Lokasi"
                    className="w-full border-2 border-slate-300 px-4 py-3 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    suppressHydrationWarning
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Tipe Atribut
                  </label>
                  <select
                    name="type"
                    className="w-full border-2 border-slate-300 bg-white px-4 py-3 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none cursor-pointer font-medium"
                    suppressHydrationWarning
                  >
                    <option value="BENEFIT">
                      Benefit (Semakin tinggi semakin baik)
                    </option>
                    <option value="COST">
                      Cost (Semakin rendah semakin baik)
                    </option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 active:scale-[0.98] transition-all shadow-lg hover:shadow-xl flex justify-center items-center gap-2"
                  suppressHydrationWarning
                >
                  <PlusCircle size={18} />
                  Tambah Kriteria
                </button>
              </form>
            </div>

            {/* PREVIEW BOBOT */}
            {criteria.length >= 2 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <Activity className="text-blue-600" size={20} />
                    <h3 className="font-bold text-slate-800">
                      Visualisasi Bobot
                    </h3>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  {criteria.map((c, idx) => {
                    const percentage = stats.weights[idx] * 100 || 0;
                    return (
                      <div key={c.id}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold text-slate-700 text-sm">
                            {c.name}
                          </span>
                          <span className="font-bold text-slate-900 text-sm">
                            {percentage.toFixed(2)}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              stats.isConsistent
                                ? "bg-gradient-to-r from-blue-500 to-blue-600"
                                : "bg-gradient-to-r from-red-500 to-red-600"
                            }`}
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
                      <strong>Informasi:</strong> Bobot kriteria ini akan
                      digunakan dalam perhitungan metode SAW untuk perangkingan
                      alternatif.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
