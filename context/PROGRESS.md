# V3 Progress

## 2026-05-07 — Clean-Room Comparison Lab Foundation

Implemented the first V3 foundation according to the user requirement:

- V3 is built from zero, not by copying the old project.
- Old experience is not blindly inherited.
- New designs are not blindly trusted.
- Every key module must compare old/new/hybrid and choose the best result.

Created:

- `docs/comparison/FEATURE_BENCHMARK_MATRIX.md`
- `docs/comparison/OLD_VS_NEW_DECISIONS.md`
- `docs/comparison/HYBRID_DESIGN_RECORDS.md`
- `docs/comparison/REJECTED_DESIGNS.md`
- `docs/comparison/GOLDEN_CASES.json`
- `docs/comparison/REGRESSION_CASES.json`
- `src/comparison/rules.ts`
- `src/quality/quality-gate.ts`
- `src/safety/safety-classifier.ts`
- `src/prompt-engines/*`
- `tests/*`

Validation:

- `npm run typecheck` passed.
- `npm test` passed: 10/10.
- `npm run comparison:validate` passed.
- `npm run quality:golden` passed.

Current golden quality results:

- image strict case: total 90.2, intent 10, hallucination 9.
- reasoning/code case: total 90.2, intent 10, hallucination 9.
- red-team defensive case: total 88.1, intent 10, hallucination 9.
- feedback blend case: total 82.7, intent 10, hallucination 9.

Next phase:

- Build V3 Next.js app shell and service/repository skeleton.
- Convert more legacy session failures into regression tests.
- Add module-level comparison records for model registry, provider adapters, feedback loop, local panel, and dataset export.

## 2026-05-07 — V3 Core Loop Completed And Verified

Completed the V3 clean-room core implementation while preserving the new-vs-old evidence rule.

Implemented:

- Next.js 16 app shell and V3 route handlers.
- Local JSON repository fallback for prompts, prompt versions, feedback, test runs, model preferences, uploaded test images, and dataset exports.
- Model preference persistence with manual lock and automatic image-intent routing to `gpt-image-2`.
- Prompt orchestration through modality-specific engines and deterministic quality gate.
- Feedback loop that records low scores, hallucination/intent-failure notes, and creates one idempotent synthetic optimization candidate.
- A/B/C compare and decision APIs.
- Test-site SDK with offline queue and idempotent `eventId` sync.
- Test-run image upload endpoint with MIME allow-list, 15 MB limit, SHA256, local refs, and no binary image export.
- Dataset JSONL export with privacy masking for keys, cookies, bearer tokens, private keys, and emails.
- Machine-readable `docs/comparison/DECISION_RECORDS.json` covering all required modules.
- HTTP smoke and Playwright E2E scripts that self-start and self-stop the Next production server.
- Schema validation script and CI updates.

Important fix:

- `tsconfig.tests.json` inherited `noEmit: true`, so old compiled tests were being reused.
- Fixed by setting `noEmit: false` and `incremental: false` in the test config.
- Future AI must treat stale `dist-tests` output as suspicious if test counts do not change after adding tests.

Final validation:

- `npm run typecheck` passed.
- `npm test` passed: 16/16.
- `npm run comparison:validate` passed: 4 golden cases, 5 regression cases, 23 module decisions.
- `npm run quality:golden` passed.
- `npm run schema:validate` passed: 8 tables, 7 guards.
- `npm run build` passed.
- `npm run smoke:http` passed and confirmed auto-selected `gpt-image-2`.
- `npm run e2e:playwright` passed.
- `npm audit --audit-level=moderate` reported 0 vulnerabilities.
- `docker compose config` passed.

Current status:

- V3 is usable as the clean-room prompt generator core.
- Old project remains read-only benchmark/reference.
- V3 is uploaded to GitHub and enabled through the AI Workbench command layer.

## 2026-05-07 — GitHub Upload And Workbench Enablement

Uploaded and enabled V3.

GitHub:

- Repository: `https://github.com/00qq6868-del/ai-prompt-generator-v3`
- Visibility: public.
- Default branch: `main`.
- Initial commit: `7bd9a038d9ebdba59aad80ae4fd69d6c0f9eb08b`
- GitHub Actions run: `https://github.com/00qq6868-del/ai-prompt-generator-v3/actions/runs/25474916085`
- CI conclusion: success.

Workbench enablement:

- Added root launcher: `E:\AI工作台\AI-PROMPT-GENERATOR-V3.cmd`
- Added AI Chain commands:
  - `AI-CHAIN.cmd prompt-v3`
  - `AI-CHAIN.cmd prompt-v3-dev`
  - `AI-CHAIN.cmd prompt-v3-start`
  - `AI-CHAIN.cmd prompt-v3-verify`
  - `AI-CHAIN.cmd prompt-v3-smoke`
  - `AI-CHAIN.cmd prompt-v3-e2e`
  - `AI-CHAIN.cmd prompt-v3-open`
- Updated workbench manifest and AI upload/start docs so future AI sees V3 as an enabled project.

Validation:

- `AI-CHAIN.cmd prompt-v3-verify` passed before upload.
- GitHub CI passed after upload.
- `AI-CHAIN.cmd prompt-v3` shows the GitHub remote and clean tracking state.

## 2026-05-07 — Unified Evaluation Gap Closure

User asked what defects remained and required everything feasible to be completed before stopping.

Defects found:

- Feedback was stored, but not yet structured enough as a complete `feedback_memory` decision delta.
- Red/yellow/green/gray icon rules were not a standalone service.
- The strict rule "every evaluation triggers GitHub ledger payload and automatic optimization" needed a single engineering entry point.
- Yellow-first and green-below-9 continuation rules needed tests.
- GitHub upload of evaluation records still requires a production GitHub App worker; V3 can now emit the required ledger payload.

Implemented:

- `src/quality/icon-rules.ts`
  - Red/yellow/green/gray scoring rules.
  - Yellow priority.
  - Green-below-9 partitioning.
  - Hallucination and user-intent green-below-9 priority ordering.
- `src/server/services/unified-evaluation-service.ts`
  - `evaluateAndOptimizeUnified()`.
  - Merges AI scores and human feedback with human priority.
  - Builds `feedbackMemoryDelta`.
  - Builds `githubLedgerPayload`.
  - Creates an automatic synthetic optimization candidate after evaluation.
- `src/app/api/v3/evaluations/unified/route.ts`
  - `POST /api/v3/evaluations/unified`.
- `docs/IMPLEMENTATION_GAP_AUDIT_2026-05-07.md`
  - Documents defects, fixes, and remaining production hardening items.
- Updated `src/domain/types.ts`.
- Added service test for:
  - human feedback priority,
  - yellow findings,
  - green hallucination below 9,
  - green user intent below 9,
  - GitHub ledger payload,
  - automatic optimization candidate.

Validation:

- `npm run typecheck` passed.
- `npm run test:compiled` passed: 17/17.
- `npm run quality:golden` passed.
- `npm run schema:validate` passed.
- `npm run build` passed and includes `/api/v3/evaluations/unified`.

Remaining production hardening, not blockers for local V3 completion:

- Real GitHub App worker to consume `githubLedgerPayload` and push/PR every evaluation record.
- UI integration for the new unified findings panel.
- Full Python worker integration with all 9 hallucination detector repositories.
- PostgreSQL/pgvector or Qdrant production migration.
- Provider registry validation for the `gpt-image-2` alias.
