# Contributing

## Development Setup

```bash
npm install
npx playwright install chromium
```

## Core Commands

```bash
npm run lint
npm run test
npm run build
```

## Coding Standards

- Use strict TypeScript and explicit interfaces for public module boundaries.
- Keep modules focused and composable.
- Add meaningful comments for non-trivial logic paths.
- Keep behavior deterministic and testable.

## Commenting Requirement

Code must be properly commented:
- Add concise comments for intent, assumptions, and tricky logic.
- Avoid redundant comments that restate obvious syntax.
- Ensure exported functions/classes have intent-level comments.

## Testing Expectations

- Add/maintain unit tests for logic-heavy modules.
- Add integration tests for cross-module behavior.
- Keep browser integration tests opt-in unless CI has browsers available.

## Pull Request Guidance

- Keep changes scoped.
- Include rationale for behavioral changes.
- Include docs updates for interface or output changes.
- Ensure lint/test/build pass before review.
