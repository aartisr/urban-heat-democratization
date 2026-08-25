import type { LabBaseline } from "../domain/types";
import type { MitigationLabBaseline } from "../../../lib/types";

export function createSyntheticBaseline(width = 64, height = 64): LabBaseline {
  const priority = new Float32Array(width * height);
  for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) {
    const corridor = Math.exp(-Math.pow((y - height * 0.53) / (height * 0.14), 2));
    const hotspot = Math.exp(-(((x - width * 0.72) ** 2 + (y - height * 0.3) ** 2) / (width * width * 0.06)));
    const edge = Math.min(x, y, width - 1 - x, height - 1 - y) < 2 ? 0.15 : 0;
    priority[y * width + x] = Math.min(1, 0.2 + corridor * 0.42 + hotspot * 0.3 + edge);
  }
  return { id: "synthetic-irregular-neighborhood", version: "1.0.0", name: "Fictional neighborhood learning grid", width, height, priority, limitations: ["This is a fictional, synthetic neighborhood.", "Results are modeled priority shifts, not temperature or health predictions."] };
}

export function adaptBostonStudyBaseline(source: MitigationLabBaseline): LabBaseline {
  return { id: source.id, version: source.version, name: source.name, width: source.width, height: source.height, priority: new Float32Array(source.priority), limitations: [...source.limitations, ...source.provenance.map((item) => `Provenance: ${item}`)] };
}
