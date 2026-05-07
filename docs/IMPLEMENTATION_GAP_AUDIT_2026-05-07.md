# AI Prompt Generator V3 缺点审计与补齐记录

日期：2026-05-07

## 结论

V3 已经不是空壳，已有 clean-room 骨架、提示词引擎、反馈入口、测试站同步、图像上传、质量门、GitHub 仓库和 CI。  
本次补齐后，V3 增加了统一评价闭环的核心缺口：

- 人工评价优先。
- AI 评价低分项统一转成红/黄/绿/灰图标。
- 黄色问题优先优化。
- 绿色但低于 9.0 的幻觉和用户意图继续优化。
- 每次评价返回 GitHub ledger payload。
- 每次评价可以脱敏落盘 GitHub ledger 文件，供 GitHub worker 提交。
- 每次评价触发自动优化候选。
- feedback_memory delta 在统一评价结果中生成。
- 首页 UI 可以展示统一评价队列和 ledger 状态。

## 已发现的缺点

| 缺点 | 风险 | 本次处理 |
|---|---|---|
| 原 feedback 更像“反馈记录”，还不是完整 feedback_memory 决策层 | 历史低分、重复问题、人工覆盖 AI、优化成败不够结构化 | 新增 `FeedbackMemoryDelta` 和 unified evaluation payload |
| 图标规则未独立服务化 | UI 和优化队列容易各自实现一套阈值 | 新增 `src/quality/icon-rules.ts` |
| 每次评价后自动优化缺少统一入口 | 可能只记录不优化 | 新增 `evaluateAndOptimizeUnified()`，评价后自动生成优化候选 |
| 黄色优先和绿色低于 9.0 的排序没有工程测试 | 容易只修严重问题，忽略长期未达标项 | 新增单元测试覆盖 |
| GitHub 上传目前不是强制真实 push | 生产环境还需 GitHub App 权限、重试和 PR 流程 | 统一评价返回 `githubLedgerPayload`，并脱敏落盘 `.local-data/github-ledger/...` |
| GPT Image 2 模型名依赖 provider registry | 官方模型可用性需要上线时确认 | 继续使用可配置 `targetModelId`，不把模型能力写死 |
| 幻觉 9 仓库目前是架构集成与工作台同步，V3 内部还未直接运行所有 detector | 生产评价深度不足 | 保留为 P1：接 `AI工作台/core/hallucination_firewall.py` 或 Python worker |
| UI 尚未完整展示新 unified findings | 用户暂时看不到完整红/黄/绿/灰队列 | 已接入首页反馈闭环，提交反馈后展示优先队列、黄色和绿色低于 9.0 |

## 本次新增文件

- `src/quality/icon-rules.ts`
- `src/server/services/unified-evaluation-service.ts`
- `src/server/services/github-ledger-service.ts`
- `src/app/api/v3/evaluations/unified/route.ts`
- `src/app/api/v3/github-ledger/sync/route.ts`
- `docs/IMPLEMENTATION_GAP_AUDIT_2026-05-07.md`

## 本次修改文件

- `src/domain/types.ts`
- `src/app/api/v3/feedback/route.ts`
- `src/app/page.tsx`
- `src/app/globals.css`
- `src/test-site-client/v3-client.ts`
- `tests/services.test.ts`

## 已落地能力

1. `evaluateAndOptimizeUnified()` 能接收 prompt 版本、AI 分数和人工反馈。
2. 人工反馈永远进入最高优先级，并设置 `humanOverridesAi`。
3. 评分维度自动生成图标：
   - 红色：阻断或严重失败。
   - 黄色：明显待优化。
   - 绿色：合格但低于 9.0 仍继续优化。
   - 灰色：保留给未评价/信息不足。
4. 优先队列固定：
   - 人工反馈。
   - 红色。
   - 黄色。
   - 绿色但低于 9.0 的幻觉。
   - 绿色但低于 9.0 的用户意图。
   - 其他绿色低于 9.0。
5. 每次评价可生成：
   - `feedbackMemoryDelta`
   - `githubLedgerPayload`
   - `optimizationCandidate`
6. 自动优化候选用 synthetic blend 生成，保留用户原始意图、人工反馈、低分维度和优先队列。
7. `github-ledger-service` 将评价 payload 脱敏写入 `.local-data/github-ledger/<project>/<date>/<version>/`：
   - `evaluation-ledger.json`
   - `quality-report.md`
   - `diff.patch`
8. `POST /api/v3/github-ledger/sync` 可以显式写入 ledger。
9. `POST /api/v3/feedback` 现在会同步返回 `unifiedEvaluation`，不再只返回旧反馈结果。
10. 首页提交反馈后展示统一评价闭环、红/黄/绿低于 9.0 队列、优化候选和 ledger 落盘状态。

## 仍需生产化增强

这些不是本轮本地闭环的阻塞项，但上线前必须完成：

1. GitHub App worker：
   - 消费 `.local-data/github-ledger/...` 或 `githubLedgerPayload`。
   - 自动 commit / PR / issue。
   - 失败重试和审计。
   - 当前已完成本地 ledger 安全落盘；剩余是 GitHub App 生产凭据和远端提交 worker。
2. 9 个幻觉检测工具深度运行：
   - DeepEval / Phoenix / TruLens / UpTrain / WikiChat patterns / UQLM / SelfCheckGPT / LettuceDetect / VCD。
   - V3 中以 worker 方式调用，主响应异步不阻塞。
3. 真正多模型 evaluator：
   - 现在本地测试使用 deterministic scores。
   - 生产需要 provider adapters、模型调用 trace、重试和成本控制。
4. 数据库迁移：
   - 当前本地 fallback 是 `.local-data/v3-store.json`。
   - 生产应迁移 PostgreSQL + pgvector/Qdrant。
5. GPT Image 2 provider 校验：
   - 保留 `gpt-image-2` 别名。
   - 启动时从 provider registry 验证真实模型名和参数。

## 验收命令

```cmd
npm run typecheck
npm run test:compiled
npm run quality:golden
npm run schema:validate
npm run build
```
