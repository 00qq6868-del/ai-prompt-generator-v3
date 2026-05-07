"use client";

import { useMemo, useState } from "react";
import { V3TestClient } from "../test-site-client/v3-client.js";

type GenerateResponse = {
  ok: boolean;
  traceId: string;
  data?: {
    promptId: string;
    versionId: string;
    versionNumber: number;
    modality: string;
    optimizedPrompt: string;
    outputContract: string[];
    inheritedLessons: string[];
  };
  qualityGate?: {
    pass: boolean;
    totalScore: number;
    intentFidelity: number;
    hallucinationResistance: number;
    rewriteAttempted: boolean;
    needsReview: boolean;
    failedDimensions: string[];
  };
  error?: { messageZh: string; messageEn: string };
};

export default function HomePage() {
  const [userIdea, setUserIdea] = useState("用参考照片生成一张商业海报，保留人物身份，手里拿咖啡，标题是“早安计划”。");
  const [targetModelId, setTargetModelId] = useState("gpt-image-2");
  const [failedDimensions, setFailedDimensions] = useState("hand_anatomy,text_rendering,reference_similarity");
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [userScore, setUserScore] = useState(60);
  const [starRating, setStarRating] = useState(3);
  const [preference, setPreference] = useState<"new_better" | "old_better" | "blend_needed" | "both_bad">("blend_needed");
  const [userNotes, setUserNotes] = useState("评分虚高，手部、文字和参考图一致性还要更严格。");
  const [feedbackStatus, setFeedbackStatus] = useState("");
  const [syncStatus, setSyncStatus] = useState("");
  const client = useMemo(() => new V3TestClient(), []);

  async function generate() {
    setLoading(true);
    setFeedbackStatus("");
    try {
      const res = await fetch("/api/v3/prompts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userIdea,
          targetModelId,
          failedDimensions: failedDimensions.split(",").map((item) => item.trim()).filter(Boolean),
          hasReferenceImage: /参考|reference|照片/.test(userIdea),
        }),
      });
      setResult(await res.json());
    } finally {
      setLoading(false);
    }
  }

  async function submitFeedback() {
    if (!result?.data) return;
    const payload = {
      eventId: `${result.data.promptId}:${result.data.versionId}:${Date.now()}`,
      promptId: result.data.promptId,
      promptVersionId: result.data.versionId,
      userScore,
      starRating,
      preference,
      userNotes,
    };
    const response = await client.submitFeedback(payload) as any;
    setFeedbackStatus(response?.ok ? `反馈已保存，需要优化: ${response.data?.needsOptimization ? "是" : "否"}` : "反馈已进入离线队列");
  }

  async function syncTestRun() {
    if (!result?.data) return;
    const response = await client.createTestRun({
      eventId: `test:${result.data.promptId}:${Date.now()}`,
      promptId: result.data.promptId,
      promptVersionId: result.data.versionId,
      originalPrompt: userIdea,
      optimizedPrompt: result.data.optimizedPrompt,
      targetModelId,
      externalScore: userScore,
    }) as any;
    setSyncStatus(response?.ok ? `测试记录已保存，系统分: ${response.qualityGate?.totalScore ?? response.data?.qualityGate?.totalScore ?? "n/a"}` : "测试记录已进入离线队列");
  }

  async function flushQueue() {
    const flushed = await client.flushOfflineQueue();
    setSyncStatus(`离线队列处理: attempted=${flushed.attempted}, remaining=${flushed.remaining}`);
  }

  const quality = result?.qualityGate;

  return (
    <main className="page-shell">
      <div className="workspace">
        <section className="panel">
          <div className="panel-header">
            <h1 className="panel-title">AI提示词生成器 V3</h1>
            <div className="row" style={{ marginTop: 8 }}>
              <span className="pill good">Clean-room</span>
              <span className="pill">Old vs New</span>
              <span className="pill">Hybrid by evidence</span>
            </div>
          </div>
          <div className="panel-body">
            <div className="field">
              <label>用户需求 User idea</label>
              <textarea className="textarea" value={userIdea} onChange={(event) => setUserIdea(event.target.value)} />
            </div>
            <div className="field">
              <label>目标模型 Target model</label>
              <input className="input" value={targetModelId} onChange={(event) => setTargetModelId(event.target.value)} />
            </div>
            <div className="field">
              <label>失败维度 Failed dimensions</label>
              <input className="input" value={failedDimensions} onChange={(event) => setFailedDimensions(event.target.value)} />
            </div>
            <button className="button" onClick={generate} disabled={loading}>
              {loading ? "生成中..." : "生成 V3 提示词"}
            </button>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2 className="panel-title">生成结果与质量门槛</h2>
          </div>
          <div className="panel-body">
            {quality && (
              <div className="metric-grid" style={{ marginBottom: 12 }}>
                <div className="metric"><span>总分 Total</span><strong>{quality.totalScore}</strong></div>
                <div className="metric"><span>通过 Pass</span><strong>{quality.pass ? "是" : "否"}</strong></div>
                <div className="metric"><span>意图保真 Intent</span><strong>{quality.intentFidelity}</strong></div>
                <div className="metric"><span>防幻觉 Anti-hallucination</span><strong>{quality.hallucinationResistance}</strong></div>
              </div>
            )}
            {result?.data ? (
              <>
                <div className="row" style={{ marginBottom: 10 }}>
                  <span className="pill good">{result.data.modality}</span>
                  <span className={quality?.needsReview ? "pill warn" : "pill good"}>{quality?.needsReview ? "needs_review" : "candidate"}</span>
                  <span className="pill">version {result.data.versionNumber}</span>
                </div>
                <pre className="prompt-output">{result.data.optimizedPrompt}</pre>
              </>
            ) : (
              <div className="prompt-output">等待生成。V3 会先路由到对应引擎，再经过质量门槛。</div>
            )}
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2 className="panel-title">反馈闭环与测试站同步</h2>
          </div>
          <div className="panel-body">
            <div className="field">
              <label>0-100 分 User score</label>
              <input className="input" type="number" min="0" max="100" value={userScore} onChange={(event) => setUserScore(Number(event.target.value))} />
            </div>
            <div className="field">
              <label>1-5 星 Star rating</label>
              <select className="select" value={starRating} onChange={(event) => setStarRating(Number(event.target.value))}>
                {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </div>
            <div className="field">
              <label>版本决策 Decision</label>
              <select className="select" value={preference} onChange={(event) => setPreference(event.target.value as any)}>
                <option value="new_better">新版更好</option>
                <option value="old_better">旧版更好</option>
                <option value="blend_needed">折中融合</option>
                <option value="both_bad">两版都不好</option>
              </select>
            </div>
            <div className="field">
              <label>文字反馈 Notes</label>
              <textarea className="textarea" style={{ minHeight: 110 }} value={userNotes} onChange={(event) => setUserNotes(event.target.value)} />
            </div>
            <div className="row">
              <button className="button" onClick={submitFeedback} disabled={!result?.data}>提交反馈</button>
              <button className="button secondary" onClick={syncTestRun} disabled={!result?.data}>同步测试记录</button>
              <button className="button secondary" onClick={flushQueue}>补传离线队列</button>
            </div>
            {feedbackStatus && <p className="pill good">{feedbackStatus}</p>}
            {syncStatus && <p className="pill good">{syncStatus}</p>}
          </div>
        </section>
      </div>
    </main>
  );
}
