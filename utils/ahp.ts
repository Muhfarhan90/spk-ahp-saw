// utils/ahp.ts
import { create, all } from 'mathjs';

const math = create(all);

export interface AhpResult {
  weights: number[];
  consistencyRatio: number;
  isConsistent: boolean;
}

export function calculateAHP(matrix: number[][]): AhpResult {
  const size = matrix.length;
  
  // 1. Normalisasi Matriks (Bagi setiap sel dengan total kolom)
  const colSums = matrix[0].map((_, colIndex) => 
    matrix.reduce((sum, row) => sum + row[colIndex], 0)
  );

  const normalizedMatrix = matrix.map(row => 
    row.map((val, colIndex) => val / colSums[colIndex])
  );

  // 2. Hitung Bobot Prioritas (Rata-rata baris)
  const weights = normalizedMatrix.map(row => 
    row.reduce((sum, val) => sum + val, 0) / size
  );

  // 3. Uji Konsistensi (Lambda Max, CI, CR)
  const weightedSumVector = matrix.map((row) => 
    row.reduce((sum, val, idx) => sum + (val * weights[idx]), 0)
  );

  const consistencyVector = weightedSumVector.map((val, idx) => val / weights[idx]);
  const lambdaMax = consistencyVector.reduce((a, b) => a + b, 0) / size;
  
  const CI = (lambdaMax - size) / (size - 1);
  
  // Index Random (RI) standar Saaty n=1 s/d n=10
  const RI_TABLE = [0, 0, 0.58, 0.90, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49];
  const RI = RI_TABLE[size - 1] || 1.49;
  
  const CR = CI / RI;

  return {
    weights,
    consistencyRatio: CR,
    isConsistent: CR <= 0.1
  };
}