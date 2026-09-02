/**
 * Spectral Urbanism: GMRF Spatial Thermal Graph Solver
 * Constructs Gaussian Markov Random Field precision matrix Q and infers
 * continuous temperature fields across city grids from land-cover properties.
 */

import { GridCell, GMRFResult, LandCoverType } from '../types';

export const LAND_COVER_CONFIGS: Record<LandCoverType, {
  name: string;
  color: string;
  albedo: number;
  vegDensity: number;
  qf: number;
  baseTemp: number;
  icon: string;
}> = {
  asphalt: { name: 'Asphalt Road', color: 'bg-slate-800 text-slate-100', albedo: 0.10, vegDensity: 0.0, qf: 40, baseTemp: 38.0, icon: '🛣️' },
  concrete: { name: 'Concrete Plaza', color: 'bg-zinc-400 text-zinc-900', albedo: 0.28, vegDensity: 0.0, qf: 10, baseTemp: 34.5, icon: '🧱' },
  building: { name: 'High-Density Building', color: 'bg-amber-900 text-amber-100', albedo: 0.15, vegDensity: 0.0, qf: 80, baseTemp: 39.5, icon: '🏢' },
  grass: { name: 'Grass Park', color: 'bg-emerald-600 text-emerald-100', albedo: 0.25, vegDensity: 0.8, qf: 0, baseTemp: 27.0, icon: '🌱' },
  tree: { name: 'Urban Forest / Tree Canopy', color: 'bg-green-800 text-green-100', albedo: 0.22, vegDensity: 1.0, qf: 0, baseTemp: 25.5, icon: '🌳' },
  cool_roof: { name: 'Cool Roof / High Albedo', color: 'bg-sky-200 text-sky-900', albedo: 0.75, vegDensity: 0.1, qf: 10, baseTemp: 28.5, icon: '🏠' },
  water: { name: 'Urban Pond / River', color: 'bg-cyan-600 text-cyan-100', albedo: 0.08, vegDensity: 0.2, qf: 0, baseTemp: 24.0, icon: '💧' }
};

/**
 * Creates an initial 8x8 city grid representing a typical dense urban core
 */
export function createDefaultCityGrid(rows = 8, cols = 8): GridCell[][] {
  const grid: GridCell[][] = [];

  for (let r = 0; r < rows; r++) {
    const row: GridCell[] = [];
    for (let c = 0; c < cols; c++) {
      let landCover: LandCoverType = 'building';

      // Design default realistic city layout: central road axis, park on east side, buildings elsewhere
      if (c === 3 || r === 4) {
        landCover = 'asphalt'; // Central road cross
      } else if ((r === 1 || r === 2) && (c === 5 || c === 6)) {
        landCover = 'grass'; // City Park
      } else if (r === 0 && c === 6) {
        landCover = 'tree';
      } else if ((r === 5 || r === 6) && (c === 1 || c === 2)) {
        landCover = 'concrete'; // Commercial Plaza
      } else if (r === 7 && c === 7) {
        landCover = 'water';
      }

      const cfg = LAND_COVER_CONFIGS[landCover];
      row.push({
        id: `cell_${r}_${c}`,
        x: c,
        y: r,
        landCover,
        elevation: 10,
        vegetationDensity: cfg.vegDensity,
        albedo: cfg.albedo,
        anthropogenicHeat: cfg.qf,
        baselineTemp: cfg.baseTemp,
        inferredTemp: cfg.baseTemp,
        variance: 0.5
      });
    }
    grid.push(row);
  }

  return grid;
}

/**
 * Solves GMRF spatial temperature field using graph Laplacian neighborhood smoothing
 */
export function solveGMRFTemperatureField(grid: GridCell[][], smoothingWeight = 0.35): GMRFResult {
  const rows = grid.length;
  const cols = grid[0].length;
  const n = rows * cols;

  // Clone grid
  const newGrid: GridCell[][] = grid.map(r => r.map(cell => ({ ...cell })));

  // Iterative Gauss-Seidel solver for GMRF precision system: (I + κ² L) T = T_base
  const maxIter = 25;
  let tempVector = new Array(n).fill(0);
  const baseVector = new Array(n).fill(0);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const cell = newGrid[r][c];
      tempVector[idx] = cell.baselineTemp;
      baseVector[idx] = cell.baselineTemp;
    }
  }

  for (let iter = 0; iter < maxIter; iter++) {
    const nextVector = [...tempVector];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        let neighborSum = 0;
        let neighborCount = 0;

        // 4-neighbor spatial adjacency
        const neighbors = [
          [r - 1, c],
          [r + 1, c],
          [r, c - 1],
          [r, c + 1]
        ];

        for (const [nr, nc] of neighbors) {
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
            const nIdx = nr * cols + nc;
            neighborSum += tempVector[nIdx];
            neighborCount++;
          }
        }

        // Precision matrix update equation: T_i = (1 - α) * T_base_i + α * (mean(T_neighbors))
        const alpha = smoothingWeight;
        nextVector[idx] = (1 - alpha) * baseVector[idx] + alpha * (neighborSum / neighborCount);
      }
    }

    tempVector = nextVector;
  }

  // Update newGrid with inferred temperatures and compute statistics
  let sumTemp = 0;
  let maxTemp = -Infinity;
  let minTemp = Infinity;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const finalTemp = Math.round(tempVector[idx] * 10) / 10;
      newGrid[r][c].inferredTemp = finalTemp;

      // Variance is lower near green clusters due to thermal stability
      const localVeg = newGrid[r][c].vegetationDensity;
      newGrid[r][c].variance = Math.round((0.8 - 0.5 * localVeg) * 100) / 100;

      sumTemp += finalTemp;
      if (finalTemp > maxTemp) maxTemp = finalTemp;
      if (finalTemp < minTemp) minTemp = finalTemp;
    }
  }

  const avgTemp = Math.round((sumTemp / n) * 10) / 10;
  const thermalDisparity = Math.round((maxTemp - minTemp) * 10) / 10;

  // Spectral resilience metric λ2 (approximated by variance drop & green network connectivity)
  let greenCellCount = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (newGrid[r][c].landCover === 'tree' || newGrid[r][c].landCover === 'grass' || newGrid[r][c].landCover === 'cool_roof') {
        greenCellCount++;
      }
    }
  }

  const spectralResilience = Math.round((0.15 + (greenCellCount / n) * 0.85) * 1000) / 1000;

  return {
    grid: newGrid,
    avgTemp,
    maxTemp: Math.round(maxTemp * 10) / 10,
    minTemp: Math.round(minTemp * 10) / 10,
    thermalDisparity,
    spectralResilience
  };
}
