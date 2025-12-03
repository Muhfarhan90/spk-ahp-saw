"use client";

import { useState } from "react";
import { Edit2, X, Save } from "lucide-react";
import { updateAlternative } from "../actions";

type Criterion = {
  id: string;
  code: string;
  name: string;
  type: "BENEFIT" | "COST";
};

type Assessment = {
  criteriaId: string;
  value: number;
};

type Alternative = {
  id: string;
  name: string;
  assessments: Assessment[];
};

export default function EditAlternativeButton({
  alternative,
  criteria,
}: {
  alternative: Alternative;
  criteria: Criterion[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(alternative.name);
  const [values, setValues] = useState<{ [key: string]: number }>(() => {
    const initial: { [key: string]: number } = {};
    alternative.assessments.forEach((a) => {
      initial[a.criteriaId] = a.value;
    });
    return initial;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("id", alternative.id);
    formData.append("name", name);

    criteria.forEach((crit) => {
      formData.append(crit.code, String(values[crit.id] || 3));
    });

    await updateAlternative(formData);
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
        title="Edit"
        suppressHydrationWarning
      >
        <Edit2 size={18} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-white px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Edit2 className="text-blue-600" size={22} />
                <h3 className="text-lg font-bold text-slate-800">
                  Edit Software
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                suppressHydrationWarning
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Nama Software
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                          type="number"
                          min="0"
                          step="1000"
                          value={values[crit.id] || 100000}
                          onChange={(e) =>
                            setValues({
                              ...values,
                              [crit.id]: Number(e.target.value),
                            })
                          }
                          placeholder="Contoh: 150000"
                          className="w-full border-2 border-slate-300 bg-white text-slate-900 px-4 py-2.5 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                          suppressHydrationWarning
                        />
                      ) : (
                        // Select 1-5 untuk kriteria BENEFIT
                        <select
                          value={values[crit.id] || 3}
                          onChange={(e) =>
                            setValues({
                              ...values,
                              [crit.id]: Number(e.target.value),
                            })
                          }
                          className="w-full border-2 border-slate-300 bg-white text-slate-900 px-4 py-2.5 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none cursor-pointer transition-all"
                          suppressHydrationWarning
                        >
                          <option value="1">1 - Sangat Buruk</option>
                          <option value="2">2 - Buruk</option>
                          <option value="3">3 - Cukup</option>
                          <option value="4">4 - Baik</option>
                          <option value="5">5 - Sangat Baik</option>
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 bg-slate-100 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-200 transition-all"
                  suppressHydrationWarning
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl flex justify-center items-center gap-2"
                  suppressHydrationWarning
                >
                  <Save size={18} />
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
