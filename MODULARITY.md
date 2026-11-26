# Urban Heat Democratization - Modularity & Extensibility Guide

## Architecture Overview

### Directory Structure

```
web/src/
├── lib/                          # Shared utilities and business logic
│   ├── formatting.ts            # Defensive number formatting utilities
│   ├── constants.ts             # Centralized configuration and magic numbers
│   ├── types.ts                 # Shared TypeScript types
│   ├── services/                # Domain services
│   │   ├── ThermalSourceService.ts
│   │   ├── OverlayService.ts
│   │   └── index.ts
│   └── api.ts                   # API client
├── components/
│   ├── shared/                  # Reusable UI components
│   │   ├── Badges.tsx           # Badge, ScoreBadge, MetricBadge
│   │   └── index.ts
│   ├── city-heat-map.tsx        # Main map (being refactored)
│   └── [other components]
├── features/                    # Feature modules
│   ├── mitigation-lab/          # Mitigation lab feature
│   │   ├── components/
│   │   ├── domain/
│   │   ├── engine/
│   │   ├── hooks/
│   │   └── README.md
│   └── scenario-map-comparison/
├── routes/                      # Route definitions
└── styles/                      # Global styles
```

## Key Principles

### 1. Formatting & Display (CENTRALIZED)
All number formatting goes through `lib/formatting.ts`:
- `safeToFixed()` - Safe decimal formatting
- `formatTemperature()` - Temperature values
- `formatScore()` - Score display
- `formatPercentage()` - Percentage values
- `formatCurrency()` - Currency values

**Benefits:**
- Single source of truth for formatting
- Consistent null/undefined handling
- Easy to update display logic globally
- Type-safe API

### 2. Constants (CENTRALIZED)
All magic numbers and configuration in `lib/constants.ts`:
- Layer IDs and configuration
- Score ranges and thresholds
- Temperature ranges
- Intervention costs and effects
- UI sizing and spacing

**Benefits:**
- Easy to adjust configuration
- Consistency across app
- Performance optimization opportunities
- Configuration can be externalized

### 3. Domain Services (BUSINESS LOGIC)
Services in `lib/services/` encapsulate business logic:

#### ThermalSourceService
- Validation and querying thermal data
- Opacity management
- Data freshness checks
- Summary formatting

#### OverlayService
- Score classification
- Filtering and sorting
- Ranking status checks
- Statistics computation

**Benefits:**
- Logic reusable across components
- Easier to test
- Separation from UI concerns
- Clear domain boundaries

### 4. Reusable Components (UI LIBRARY)
Shared components in `components/shared/`:

- `Badge` - Generic badge component
- `ScoreBadge` - Score with safe formatting
- `MetricBadge` - Metrics with units
- `PropertyRow` - Key-value pairs
- `PropertyList` - Lists of properties
- `CollapsiblePanel` - Expandable sections

**Benefits:**
- Consistent UI across app
- Reduced code duplication
- Easier theme changes
- Accessible by default

### 5. Feature Architecture
Each feature in `features/` follows a standard structure:

```
feature-name/
├── README.md                    # Feature documentation
├── components/                  # Feature-specific UI components
│   └── index.ts                 # Barrel export
├── domain/                      # Feature-specific business logic
│   └── index.ts
├── engine/                      # Algorithms and computations
│   └── index.ts
├── hooks/                       # Feature-specific React hooks
│   └── index.ts
└── index.ts                     # Feature barrel export
```

## Extension Patterns

### Adding a New Overlay Type

1. Update `lib/constants.ts`:
```typescript
export const OVERLAY_TYPES = {
  HEAT: "heat" as const,
  COOLING: "cooling" as const,
  NEW_TYPE: "new-type" as const,  // Add here
} as const;
```

2. Create service if needed:
```typescript
// lib/services/NewOverlayService.ts
export class NewOverlayService {
  static validate() { /* ... */ }
  static format() { /* ... */ }
}
```

3. Update component:
```typescript
import { OVERLAY_TYPES } from "lib/constants";
// Use type-safe overlay type
```

### Adding a New Metric Display

1. Create formatter in `lib/formatting.ts`:
```typescript
export function formatMyMetric(value: unknown): string {
  // Safe formatting
}
```

2. Create component in `components/shared/Badges.tsx`:
```typescript
export function MyMetricBadge({ /* props */ }) {
  // Uses formatMyMetric
}
```

3. Use across app:
```typescript
import { MyMetricBadge } from "components/shared";
```

### Adding a New Feature

1. Create feature directory:
```bash
mkdir -p web/src/features/my-feature/{components,domain,engine,hooks}
```

2. Add README.md documenting the feature

3. Create barrel exports in each subdirectory

4. Import using feature path:
```typescript
import { Component } from "features/my-feature/components";
```

## Refactoring Checklist

- [x] Create `lib/formatting.ts` with 20+ formatters
- [x] Create `lib/constants.ts` with all magic numbers
- [x] Create `components/shared/Badges.tsx` with reusable components
- [x] Create `lib/services/ThermalSourceService.ts`
- [x] Create `lib/services/OverlayService.ts`
- [ ] Split `city-heat-map.tsx` into modules
- [ ] Add feature READMEs
- [ ] Migrate all components to use formatters
- [ ] Add plugin system for overlay types
- [ ] Add validation layer

## Testing Strategy

Each service should have corresponding tests:
- `ThermalSourceService.test.ts`
- `OverlayService.test.ts`
- Component integration tests

Formatters should test:
- Null/undefined handling
- Invalid number handling
- NaN handling
- Decimal precision

## Performance Optimization

1. **Memoization**: Services are static, can be optimized with memoization decorators
2. **Lazy Loading**: Features can be code-split and lazy-loaded
3. **Caching**: Service results can be cached where appropriate
4. **Constants**: TypeScript const types enable tree-shaking

## Maintenance

1. When adding new feature, create feature directory with standard structure
2. When adding new metric, add formatter first
3. When adding magic number, add to constants.ts
4. Run tests after refactoring components
5. Document complex business logic in service files

## Next Steps

1. Create feature-specific services for map overlays
2. Split city-heat-map into sub-components
3. Add plugin system for new overlay types
4. Create comprehensive test suite
5. Document all public APIs
