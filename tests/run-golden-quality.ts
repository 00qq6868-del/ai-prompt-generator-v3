import goldenCases from "../docs/comparison/GOLDEN_CASES.json" with { type: "json" };
import type { GoldenCase } from "../src/domain/types.js";
import { buildPromptEngine } from "../src/prompt-engines/router.js";
import { estimatePromptScores, weightedScore } from "../src/quality/quality-gate.js";

let failed = 0;

for (const item of goldenCases as GoldenCase[]) {
  const output = buildPromptEngine({
    userIdea: item.userIdea,
    targetModelId: item.targetModelId,
    language: "zh",
    failedDimensions: item.failedDimensions,
  });
  const scores = estimatePromptScores(output.systemPrompt, item.userIdea, item.failedDimensions);
  const result = weightedScore(scores);
  const ok = result.intentFidelity >= 8.5 && result.hallucinationResistance >= 9;
  console.log(`${ok ? "PASS" : "FAIL"} ${item.id}: total=${result.totalScore}, intent=${result.intentFidelity}, hallucination=${result.hallucinationResistance}, modality=${output.modality}`);
  if (!ok) failed += 1;
}

if (failed > 0) process.exit(1);
