# Phase 6 package — apply and verify

This ZIP is the complete project source snapshot with Phase 6 changes. It intentionally excludes `.git`, `node_modules`, `.angular`, `dist` and `coverage` so extraction does not replace Git history or your local dependencies/build cache.

## Apply it to the existing repository

1. Make sure your repository is on `chore/phase-6-final-verification-backend-preparation`.
2. Keep a backup or commit any unrelated local work before extracting.
3. Extract the ZIP into `D:\jewelry` (not into `D:\jewelry\jewelry-stock-frontend` because the ZIP already contains that folder).

Cmder / PowerShell command:

```powershell
Expand-Archive -LiteralPath (Join-Path $env:USERPROFILE 'Downloads\jewelry-phase6-backend-ready-project.zip') -DestinationPath 'D:\jewelry' -Force
```

The existing `.git` directory and existing `node_modules` directory are not included in this archive and will remain untouched.

## Verify on Windows

From the project root:

```bash
cd /d D:\jewelry\jewelry-stock-frontend
```

Confirm the demo mode is selected in `src/app/core/config/app-mode.ts`:

```ts
export const APP_DATA_MODE: AppDataMode = 'mock';
```

Then run:

```bash
npm test -- --watch=false
npm run build
```

The package adds no npm dependencies and does not change `package.json` or `package-lock.json`.

## Verification performed while preparing this package

- TypeScript application compilation: passed.
- TypeScript compilation of all spec files: passed.
- Angular compiler/AOT template and strict-template check: passed.
- The full Angular CLI build/test runner could not be executed in the preparation container because the uploaded `node_modules` contains the Windows-native esbuild binary while the preparation container runs Linux. The Linux package install attempt did not complete. Run the two commands above on the Windows development machine before committing; this package does not claim that the full test suite or production bundle passed here.

## Expected mode behavior

- `mock`: existing mock data sources remain active for testing and client demos.
- `api`: only HTTP data sources are active. There is no fallback to mock data if the server is unavailable.
- Change `API_BASE_URL` in `src/app/app.config.ts` when the Spring Boot server host/path is known.

No Spring Boot code or MySQL database is included. The future backend must implement `BACKEND-INTEGRATION-GUIDE.md`.

## Git checkpoint after local verification

```bash
git status --short --branch
git diff --check
git add README.md BACKEND-INTEGRATION-GUIDE.md MOCK-TO-API-CHECKLIST.md PHASE-6-IMPLEMENTATION-GUIDE.md PHASE-6-APPLY-INSTRUCTIONS.md src/app

git diff --cached --check
git diff --cached --stat
git commit -m "feat: prepare frontend for mock and api data sources"
```

Do not merge into `main` until the completed Phase 6 branch has passed the local Windows test/build and manual UI checks.
