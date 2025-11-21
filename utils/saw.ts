// utils/saw.ts

type CriteriaInfo = { id: string; type: 'BENEFIT' | 'COST'; weight: number };
type DataPoint = { alternativeId: string; criteriaId: string; value: number };

export function calculateSAW(
  alternatives: string[], // List ID Alternatif
  criteria: CriteriaInfo[],
  assessments: DataPoint[]
) {
  // 1. Mencari Nilai Max/Min tiap kriteria untuk Normalisasi
  const normalizationFactors: Record<string, number> = {};
  
  criteria.forEach(c => {
    const values = assessments
      .filter(a => a.criteriaId === c.id)
      .map(a => a.value);
      
    if (c.type === 'BENEFIT') {
      normalizationFactors[c.id] = Math.max(...values); // Max untuk Benefit
    } else {
      normalizationFactors[c.id] = Math.min(...values); // Min untuk Cost
    }
  });

  // 2. Hitung Nilai Akhir (V)
  const results = alternatives.map(altId => {
    let totalScore = 0;
    const details: any = {};

    criteria.forEach(crit => {
      const assessment = assessments.find(
        a => a.alternativeId === altId && a.criteriaId === crit.id
      );
      const rawValue = assessment ? assessment.value : 0;
      
      // Rumus Normalisasi SAW
      let normalized = 0;
      if (crit.type === 'BENEFIT') {
        normalized = rawValue / normalizationFactors[crit.id];
      } else {
        // Hati-hati: Pembagian dengan nol
        normalized = rawValue === 0 ? 0 : normalizationFactors[crit.id] / rawValue;
      }

      // Kalikan dengan Bobot AHP
      const weightedScore = normalized * crit.weight;
      totalScore += weightedScore;

      details[crit.id] = { raw: rawValue, norm: normalized, weighted: weightedScore };
    });

    return {
      alternativeId: altId,
      score: totalScore,
      details
    };
  });

  // 3. Urutkan dari nilai tertinggi
  return results.sort((a, b) => b.score - a.score);
}