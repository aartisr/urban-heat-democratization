# Feature Development Guide

## Standard Feature Structure

Every feature module should follow this directory structure:

```
features/my-feature/
├── README.md                    # Feature documentation (THIS FILE)
├── index.ts                     # Barrel export (re-exports all public APIs)
├── components/                  # React components
│   ├── index.ts                 # Barrel export
│   ├── MyFeature.tsx            # Main component
│   └── MyFeatureItem.tsx         # Sub-component
├── domain/                      # Business logic and domain models
│   ├── index.ts                 # Barrel export
│   ├── MyFeatureService.ts       # Domain service
│   └── types.ts                 # Domain-specific types
├── engine/                      # Algorithms and computations
│   ├── index.ts                 # Barrel export
│   ├── calculate.ts             # Calculation logic
│   └── transform.ts             # Data transformation
├── hooks/                       # Feature-specific React hooks
│   ├── index.ts                 # Barrel export
│   ├── useMyFeature.ts          # Custom hook
│   └── useMyFeatureData.ts       # Data hook
└── types.ts                     # Feature-scoped types (optional)
```

## README.md Template

```markdown
# Feature Name

One-sentence description of what this feature does.

## Purpose

Explain the user problem this feature solves and the business value it provides.

## Components

- **MyFeature**: Main component that...
- **MyFeatureItem**: Sub-component that...

## Services/Domain Logic

- **MyFeatureService**: Handles validation, calculations, and operations for...

## Hooks

- **useMyFeature**: Custom hook for managing state related to...
- **useMyFeatureData**: Custom hook for fetching and processing data for...

## Usage

### Basic Usage

```typescript
import { MyFeature } from 'features/my-feature';

export function App() {
  return <MyFeature data={data} onSelect={handleSelect} />;
}
```

### With Custom Configuration

```typescript
import { MyFeatureService } from 'features/my-feature/domain';

const service = MyFeatureService.create({ /* config */ });
const result = service.calculate(input);
```

## State Management

This feature manages state using:
- Local React component state for UI state
- Custom hooks for derived/computed state
- LocalStorage for persistence (if applicable)

## Performance Considerations

- Components are memoized to prevent unnecessary re-renders
- Calculations are run in Web Workers (if applicable)
- Lists use virtualization for large datasets (if applicable)

## Testing

Run feature-specific tests:

```bash
npm test -- features/my-feature
```

Test files are colocated with their source code and follow the pattern `*.test.ts(x)`.

## Dependencies

- External libraries: list them
- Internal features: list feature dependencies
- Shared utilities: reference lib/

## Future Improvements

- [ ] TODO item 1
- [ ] TODO item 2

## Related Features

- Feature A - does something related
- Feature B - provides supporting functionality
```

## Naming Conventions

### Components
- Use PascalCase for component names
- Prefix with feature name if reusable: `MyFeatureCard`, `MyFeatureButton`
- Suffix with component type: `...Panel`, `...Modal`, `...List`

### Services
- Suffix with `Service`: `MyFeatureService`
- Use static methods for stateless operations
- Use class-based approach for consistency

### Hooks
- Prefix with `use`: `useMyFeature`, `useMyFeatureData`
- Descriptive naming: `useMyFeatureSelection`, `useMyFeatureFiltering`

### Types
- Suffix with type descriptor: `MyFeatureProps`, `MyFeatureState`, `MyFeatureConfig`
- Domain types in `domain/types.ts`
- Component-specific types in component files

### Constants
- Use UPPER_SNAKE_CASE: `MY_FEATURE_TIMEOUT`, `MY_FEATURE_MAX_SIZE`
- Keep in `lib/constants.ts` or feature-specific constant file

## Best Practices

### 1. Separation of Concerns
- Components should be UI-focused
- Logic belongs in services/hooks
- Data transformations in `engine/`

### 2. Type Safety
- Always define explicit types
- Use `type` for type aliases
- Use `interface` for objects with methods
- Avoid `any` - use `unknown` with guards

### 3. Error Handling
- Use `ValidationService` for data validation
- Provide meaningful error messages
- Gracefully handle missing/invalid data

### 4. Reusability
- Extract common logic into services
- Create generic components when possible
- Use shared components from `components/shared/`
- Leverage formatters from `lib/formatting.ts`

### 5. Performance
- Memoize expensive calculations
- Use `useMemo` and `useCallback` appropriately
- Lazy load components if large
- Profile and optimize if needed

### 6. Documentation
- Add JSDoc comments to public APIs
- Include usage examples in README
- Document complex algorithms
- Keep README up to date

## Migration from Old Pattern

If refactoring existing features:

1. Create new directory structure
2. Move files incrementently
3. Update imports in barrel exports
4. Update consuming code
5. Run tests
6. Remove old code

## Review Checklist

Before submitting a feature for review:

- [ ] README.md is complete and up to date
- [ ] All public APIs are documented
- [ ] TypeScript types are defined
- [ ] Components are properly exported via index.ts
- [ ] Services are properly exported via index.ts
- [ ] No hardcoded magic numbers (use lib/constants.ts)
- [ ] Uses formatters from lib/formatting.ts
- [ ] Error handling implemented
- [ ] Tests are passing
- [ ] No console errors or warnings
- [ ] Accessibility standards met (WCAG)
- [ ] Responsive design verified

## Questions?

Refer to:
- Main MODULARITY.md for architecture overview
- Shared components in components/shared/
- Domain services in lib/services/
- Formatting utilities in lib/formatting.ts
- Constants in lib/constants.ts
