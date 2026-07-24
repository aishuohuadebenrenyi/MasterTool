# Verification

Choose the smallest verification set that proves the change.

## Documentation Or Rule Changes

Run from the repository root:

```bash
git diff --check
```

## Mini Program Code Changes

Run from `tooling/verification/`:

```bash
npm run lint
npm test
npm run syntax-check
```

For a narrow change, use the relevant subset and explain why it is enough.

## Release Or Cross-Module Changes

Run from `tooling/verification/`:

```bash
npm run verify:all
```

Run from `tooling/verification/` when release contracts are affected:

```bash
node tests/verify-release-contract.js
```

## When Verification Cannot Run

Do not imply success. Record:

- the command that could not run,
- the reason,
- the risk that remains,
- the next manual or automated check needed.
