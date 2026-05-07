# AI Prompt Generator V3

V3 is a clean-room rebuild that does not blindly inherit the old system and does not blindly prefer new code.

Every important module must pass the comparison rule:

- Use the new design if it is clearly better than the old behavior.
- Use the old behavior if it is clearly better than the new design.
- Use a hybrid if both are close.
- Redesign if both fail core thresholds.

The old project is a read-only benchmark source:

```text
E:\AI工作台\项目 Projects\ai-prompt-generator-codex
```

This project is the V3 implementation target:

```text
E:\AI工作台\项目 Projects\ai-prompt-generator-v3
```

Start here:

```powershell
npm run comparison:validate
npm run quality:golden
```

Full local verification:

```powershell
npm run typecheck
npm test
npm run comparison:validate
npm run quality:golden
npm run schema:validate
npm run build
npm run smoke:http
npm run e2e:playwright
```

Optional browser E2E:

```powershell
npm run build
npm run start -- -p 3201 -H 127.0.0.1
$env:V3_E2E_BASE_URL='http://127.0.0.1:3201'
npm run e2e:playwright
```

Implemented V3 acceptance surface:

- New/old/hybrid/redesign decisions are machine-readable in `docs/comparison/DECISION_RECORDS.json`.
- `npm run comparison:validate` fails if any required module lacks a decision or violates the fixed selection rule.
- New image users are auto-routed to `gpt-image-2`; explicit user choice locks the target model preference.
- Model preferences persist through the local repository fallback and are ready for PostgreSQL repository replacement.
- Test-site feedback and test-runs are idempotent by `eventId`.
- Low scores or hallucination/intent-failure notes automatically create one synthetic optimization candidate and do not duplicate it on retry.
- Test-run image uploads accept only `image/jpeg`, `image/png`, and `image/webp`, max 15 MB, and store SHA256 plus local file refs.
- Dataset export writes local JSONL with privacy masking and never exports binary images.
