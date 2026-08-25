export function explainShift(changedCells: number, averageShift: number, interventionCount: number) {
  if (!interventionCount) return "Start with one intervention. The grid shows the synthetic baseline priority pattern.";
  return `${interventionCount} intervention${interventionCount === 1 ? "" : "s"} changed ${changedCells} modeled cells. Average priority moved ${Math.round(averageShift * 100)}% from the synthetic baseline in the affected area.`;
}
