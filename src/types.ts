export interface Metric {
  id: string;
  name: string;
  score: number;
  weight: number;
  description: string;
  details: string[];
}

export interface GlossaryItem {
  term: string;
  definition: string;
  context: string;
}
