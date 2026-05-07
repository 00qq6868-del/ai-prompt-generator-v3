# AI Prompt Generator V3 Agent Rules

This is the V3 clean-room rebuild workspace:

```text
E:\AI工作台\项目 Projects\ai-prompt-generator-v3
```

The old project is read-only benchmark/source material:

```text
E:\AI工作台\项目 Projects\ai-prompt-generator-codex
```

## Non-Negotiable Rule

Do not blindly copy old behavior and do not blindly prefer new behavior. Every key module must be selected through the Comparison Lab:

1. Extract old behavior, strengths, failures, and test cases.
2. Compete old, new, and hybrid candidates on the same cases.
3. Select `new`, `old`, `hybrid`, or `redesign` using `src/comparison/rules.ts`.

No module is production-ready without a comparison record and tests.

## Commands

```powershell
npm run typecheck
npm test
npm run comparison:validate
npm run quality:golden
```

## Safety Boundary

The defensive red-team engine is for authorized education, owned systems, labs, CTF, and enterprise audit. It must not produce executable malicious code, phishing tools, credential theft, stealth persistence, detection bypass, or unauthorized exploitation.

## Current Phase

Phase 0/1 foundation is implemented:

- Comparison Lab artifacts exist under `docs/comparison`.
- Golden and regression cases are machine-readable.
- Comparison decision rules are executable.
- Image, reasoning/code, defensive red-team, and general prompt engines exist.
- Deterministic quality gate exists.
- Tests currently pass.
