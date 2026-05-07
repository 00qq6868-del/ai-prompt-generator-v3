# V3 Session Log

## 2026-05-07

User clarified that V3 should start from zero if that gives the best effect, but must not lose useful old experience. The exact rule is:

- If new is better, use new.
- If old is better, use old.
- If both are close, take the best parts of both.
- If both are bad, redesign.
- Always compare first.

Implemented Phase 0/1 foundation:

- Created V3 workspace at `E:\AI工作台\项目 Projects\ai-prompt-generator-v3`.
- Added Comparison Lab docs and machine-readable golden/regression cases.
- Added executable comparison decision rules.
- Added deterministic quality gate.
- Added initial Image, Reasoning/Code, Defensive Red-Team, and General prompt engines.
- Added safety classifier for defensive red-team boundaries.
- Added tests proving comparison rules, engine routing, safety classification, and quality floors.

Important correction caught by tests:

- Initial red-team routing missed Chinese weaponization terms such as `攻击` and `窃取`.
- Initial image/red-team prompts did not explicitly include enough anti-hallucination language.
- Tests failed, then the router and prompts were tightened.
- Final tests pass.

Commands run:

```powershell
npm install
npm run typecheck
npm run build:test
npm test
npm run comparison:validate
npm run quality:golden
```

Results:

- TypeScript passed.
- Node tests passed 10/10.
- Comparison Lab validation passed.
- Golden quality passed all 4 cases.

## 2026-05-07 Continued Completion Pass

User instructed: continue until all requirements are complete.

Completed additional V3 implementation:

- Added repository-backed model preferences.
- Added automatic model selection:
  - image/reference intent -> `gpt-image-2`
  - reasoning/code/security/general -> `gpt-5.5`
  - explicit user choice locks model preference.
- Added low-score feedback auto-optimization:
  - score below 70, low stars, blend/both_bad, hallucination notes, or intent-failure notes create a synthetic candidate.
  - duplicate `eventId` feedback is idempotent and does not create duplicate synthetic versions.
- Added test-run image upload:
  - endpoint: `POST /api/v3/test-runs/[testRunId]/images`
  - only jpeg/png/webp
  - max 15 MB
  - stores SHA256 and local file refs
  - binary images never enter dataset export.
- Added dataset export:
  - endpoint: `POST /api/v3/dataset/export`
  - writes local JSONL under `.local-data/exports`
  - masks API keys, cookies, bearer tokens, private keys, and emails.
- Added machine-readable module decisions:
  - `docs/comparison/DECISION_RECORDS.json`
  - `npm run comparison:validate` now enforces all required modules and the fixed selection rule.
- Added HTTP smoke and Playwright E2E:
  - smoke covers generate, feedback, test run, image upload, scoring, decision, compare, export.
  - E2E covers UI generate, feedback submit, test sync, offline queue button.
- Added schema validator:
  - `npm run schema:validate`
  - CI now runs schema validation, build, smoke, and E2E.

Real issues found and fixed:

- Windows Node `spawn('npm.cmd')` failed with `EINVAL`.
  - Smoke/E2E now spawn `node node_modules/next/dist/bin/next` directly.
- A stale V3 `next start` process on port 3201 caused a false 404 `Server action not found`.
  - Smoke/E2E now choose an available port and stop their own server.
  - Stale V3 process PID 44760 was stopped.
- `tsconfig.tests.json` inherited `noEmit: true`, causing tests to run stale compiled output.
  - Fixed with `noEmit: false` and `incremental: false`.

Final commands and results:

```powershell
npm run typecheck
npm test
npm run comparison:validate
npm run quality:golden
npm run schema:validate
npm run build
npm run smoke:http
npm run e2e:playwright
npm audit --audit-level=moderate
docker compose config
```

All passed.

Final test counts:

- Node tests: 16/16.
- Comparison Lab: 23 required module decisions.
- Golden quality:
  - image: total 90.2, intent 10, hallucination 9.
  - reasoning/code: total 90.2, intent 10, hallucination 9.
  - red-team defensive: total 88.1, intent 10, hallucination 9.
  - feedback blend: total 82.7, intent 10, hallucination 9.

No V3 test server was left running.

## 2026-05-07 Upload And Enablement

User asked to continue any unfinished work, then upload to GitHub and enable.

Actions:

- Added AI Workbench command integration:
  - `prompt-v3`
  - `prompt-v3-dev`
  - `prompt-v3-start`
  - `prompt-v3-verify`
  - `prompt-v3-smoke`
  - `prompt-v3-e2e`
  - `prompt-v3-open`
- Added root entry:
  - `E:\AI工作台\AI-PROMPT-GENERATOR-V3.cmd`
- Updated:
  - `E:\AI工作台\00_AI_WORKBENCH_MANIFEST.json`
  - `E:\AI工作台\00_AI_WORKBENCH_UPLOAD_ME.md`
  - `E:\AI工作台\AI_AGENT_START_HERE.md`
- Ran workbench-level verification:
  - `AI-CHAIN.cmd prompt-v3-verify`
  - passed typecheck, tests, comparison validate, golden quality, schema validate, build, HTTP smoke, Playwright E2E, and npm audit.
- Initialized Git repository in the V3 folder.
- Committed initial implementation:
  - `7bd9a03 Initial AI Prompt Generator V3 clean-room rebuild`
- Created and pushed public GitHub repo:
  - `https://github.com/00qq6868-del/ai-prompt-generator-v3`
- Watched GitHub Actions:
  - run `25474916085`
  - result: success

Important note:

- `.local-data`, `.next`, `dist`, `dist-tests`, and `node_modules` remain ignored and were not uploaded.
- Secret scan before commit only found sanitizer regex code and non-secret test text.

## 2026-05-07 Unified Evaluation Gap Closure

User asked to identify defects, bad parts, and unfinished work, then finish everything feasible before stopping.

Inspected current V3 implementation and found:

- V3 already had prompt generation, feedback, image upload, dataset export, deterministic quality gate, comparison lab, GitHub repo, and CI.
- It lacked a single unified evaluation service that always combines AI evaluation, human feedback priority, icon priority, feedback_memory delta, GitHub ledger payload, and automatic optimization.

Implemented:

- `src/quality/icon-rules.ts`
- `src/server/services/unified-evaluation-service.ts`
- `src/app/api/v3/evaluations/unified/route.ts`
- `docs/IMPLEMENTATION_GAP_AUDIT_2026-05-07.md`
- Updated `src/domain/types.ts`.
- Updated `tests/services.test.ts`.

Behavior added:

- Human feedback is highest priority and sets `humanOverridesAi`.
- Red/yellow/green/gray findings are generated from scores and human feedback.
- Yellow findings are prioritized before green issues.
- Green hallucination below 9.0 and green user-intent below 9.0 continue into optimization after yellow.
- Every unified evaluation returns `githubLedgerPayload`.
- Every unified evaluation with red/yellow/green-below-9 findings creates a synthetic optimization candidate.

Validation:

- `npm run typecheck`: passed.
- `npm run test:compiled`: passed, 17/17.
- `npm run quality:golden`: passed.
- `npm run schema:validate`: passed.
- `npm run build`: passed.

Still production-hardening only:

- Add a GitHub App worker that consumes `githubLedgerPayload` and pushes evaluation ledgers/PRs.
- Add UI panels for unified red/yellow/green/gray findings.
- Wire all 9 hallucination detectors through an async worker.
- Move local JSON fallback to PostgreSQL/vector storage for production.
