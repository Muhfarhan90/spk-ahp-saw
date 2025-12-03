"use client";

import { useState } from "react";
import { FileUp, Download, X, Upload, AlertCircle } from "lucide-react";
import * as XLSX from "xlsx";
import { importAlternativesFromExcel } from "../actions";

type Criterion = {
  id: string;
  code: string;
  name: string;
  type: "BENEFIT" | "COST";
};

export default function ImportExcelButton({
  criteria,
}: {
  criteria: Criterion[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError("");

    // Read and preview Excel file
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Validate data
        if (jsonData.length === 0) {
          setError("File Excel kosong!");
          setPreview([]);
          return;
        }

        // Check if all required columns exist
        const firstRow: any = jsonData[0];
        const requiredColumns = [
          "Nama Software",
          ...criteria.map((c) => c.code),
        ];
        const missingColumns = requiredColumns.filter(
          (col) => !(col in firstRow)
        );

        if (missingColumns.length > 0) {
          setError(
            `Kolom tidak lengkap: ${missingColumns.join(
              ", "
            )}. Pastikan file Excel memiliki kolom yang sesuai.`
          );
          setPreview([]);
          return;
        }

        setPreview(jsonData.slice(0, 5)); // Show first 5 rows
      } catch (err) {
        setError("Gagal membaca file Excel. Pastikan format file benar.");
        setPreview([]);
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    setError("");

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          // Send to server
          await importAlternativesFromExcel(JSON.stringify(jsonData));

          alert(`✅ Berhasil import ${jsonData.length} data!`);
          setIsOpen(false);
          setFile(null);
          setPreview([]);
        } catch (err: any) {
          setError(err.message || "Gagal import data");
        } finally {
          setLoading(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err: any) {
      setError(err.message || "Gagal import data");
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    // Create template Excel
    const headers = ["Nama Software", ...criteria.map((c) => c.code)];
    const sampleData = [
      [
        "Contoh Software 1",
        ...criteria.map((c) => (c.type === "COST" ? 150000 : 3)),
      ],
      [
        "Contoh Software 2",
        ...criteria.map((c) => (c.type === "COST" ? 200000 : 4)),
      ],
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");

    // Add column info
    const info = [
      [""],
      ["INFORMASI:"],
      ["1. Kolom 'Nama Software' wajib diisi"],
      ["2. Kriteria yang tersedia:"],
      ...criteria.map((c) => [
        `   - ${c.code}: ${c.name} (${c.type})${
          c.type === "COST"
            ? " → Isi dengan harga asli (contoh: 150000)"
            : " → Isi dengan skala 1-5 (1=Sangat Buruk, 5=Sangat Baik)"
        }`,
      ]),
    ];
    const wsInfo = XLSX.utils.aoa_to_sheet(info);
    XLSX.utils.book_append_sheet(wb, wsInfo, "Info");

    XLSX.writeFile(wb, "template_import_software.xlsx");
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
        suppressHydrationWarning
      >
        <FileUp size={18} />
        Import Excel
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-green-50 to-white px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <FileUp className="text-green-600" size={22} />
                <h3 className="text-lg font-bold text-slate-800">
                  Import Data dari Excel
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setFile(null);
                  setPreview([]);
                  setError("");
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                suppressHydrationWarning
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Download Template Button */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3 mb-3">
                  <AlertCircle className="text-blue-600 mt-0.5" size={20} />
                  <div className="flex-1">
                    <h4 className="font-bold text-blue-900 mb-1">
                      Langkah 1: Download Template
                    </h4>
                    <p className="text-sm text-blue-800 mb-3">
                      Download template Excel terlebih dahulu, lalu isi dengan
                      data software Anda
                    </p>
                    <button
                      onClick={downloadTemplate}
                      className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2"
                      suppressHydrationWarning
                    >
                      <Download size={16} />
                      Download Template Excel
                    </button>
                  </div>
                </div>
              </div>

              {/* Upload File */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Langkah 2: Upload File Excel
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-green-500 transition-all">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                    id="excel-upload"
                  />
                  <label
                    htmlFor="excel-upload"
                    className="cursor-pointer flex flex-col items-center gap-3"
                  >
                    <Upload className="text-slate-400" size={40} />
                    <div>
                      <p className="font-bold text-slate-700">
                        {file ? file.name : "Klik untuk upload file Excel"}
                      </p>
                      <p className="text-sm text-slate-500 mt-1">
                        Format: .xlsx atau .xls
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="text-red-600 mt-0.5" size={20} />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              )}

              {/* Preview Data */}
              {preview.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-700 mb-3">
                    Preview Data (5 baris pertama):
                  </h4>
                  <div className="overflow-x-auto border-2 border-slate-200 rounded-xl">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200">
                          <th className="px-4 py-2 text-left font-bold text-slate-700">
                            Nama Software
                          </th>
                          {criteria.map((crit) => (
                            <th
                              key={crit.id}
                              className="px-4 py-2 text-center font-bold text-slate-700"
                            >
                              {crit.code}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.map((row: any, idx) => (
                          <tr key={idx} className="border-b border-slate-100">
                            <td className="px-4 py-2 font-semibold">
                              {row["Nama Software"]}
                            </td>
                            {criteria.map((crit) => (
                              <td
                                key={crit.id}
                                className="px-4 py-2 text-center"
                              >
                                <span
                                  className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold ${
                                    row[crit.code] >= 4
                                      ? "bg-green-100 text-green-700"
                                      : row[crit.code] <= 2
                                      ? "bg-red-100 text-red-700"
                                      : "bg-yellow-100 text-yellow-700"
                                  }`}
                                >
                                  {row[crit.code] || "-"}
                                </span>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setFile(null);
                    setPreview([]);
                    setError("");
                  }}
                  className="flex-1 bg-slate-100 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-200 transition-all"
                  suppressHydrationWarning
                >
                  Batal
                </button>
                <button
                  onClick={handleImport}
                  disabled={!file || preview.length === 0 || loading}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold py-3 rounded-xl hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  suppressHydrationWarning
                >
                  <Upload size={18} />
                  {loading ? "Mengimport..." : "Import Data"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
