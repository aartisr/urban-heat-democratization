import { useState } from "react";

import UpgradeToTen from "../components/UpgradeToTen";

export function SolutionSuitePage() {
  const [activeTool, setActiveTool] = useState("city-input");
  return <main className="page-stack solution-suite-page"><UpgradeToTen activeTool={activeTool} onChooseTool={setActiveTool} /></main>;
}
