import React, { useState } from 'react';
import UpgradeToTen from '../components/UpgradeToTen';

export function SolutionSuitePage() {
  const [isTenActive, setIsTenActive] = useState(true);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <UpgradeToTen
        onActivateTen={() => setIsTenActive(true)}
        isTenActive={isTenActive}
      />
    </div>
  );
}
