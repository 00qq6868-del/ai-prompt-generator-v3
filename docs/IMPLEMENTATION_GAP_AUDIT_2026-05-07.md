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
| GitHub 上传原先只安全落盘，缺远程 worker | 评价不能自动进入远程审查流 | 新增 `scripts/github-ledger-worker.mjs`，可创建 ledger 分支、commit、push；GitHub CLI 可用时自动 PR/issue，不可用时输出分支和 payload |
| GPT Image 2 模型名依赖 provider registry | 官方模型可用性需要上线时确认 | 新增 provider registry validation，可读取配置列表或调用 OpenAI `/models`；无凭据时明确 `needs_provider_check`，生产可用 `--require-live` 阻断 |
| 幻觉 9 仓库原先只在工作台同步，V3 无 live worker | 生产评价深度不足 | 新增 `scripts/hallucination-live-worker.mjs`，异步读取 9 仓库 live commit 状态并调用工作台 `hallucination_firewall.py`，结果落 `.local-data/hallucination-live/last-run.json` |
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

## 截图 4 项收尾状态

| 项目 | 状态 | 工件 | 验收方式 |
|---|---|---|---|
| Remote GitHub App / ledger worker | 已完成可运行 worker | `scripts/github-ledger-worker.mjs`, `scripts/validate-github-ledger-worker.mjs` | `npm run github-ledger:validate`; 真实远程同步用 `npm run github-ledger:sync` |
| 9 hallucination detector live worker | 已完成异步 live worker | `scripts/hallucination-live-worker.mjs` | `npm run hallucination:live -- "text"`，输出 9 个 detector 的 repo/source/firewall 状态 |
| Production database migration | 已完成 PostgreSQL 迁移入口与 vector-ready schema | `database/schema.sql`, `src/server/repositories/database.ts`, `scripts/migrate-production-db.mjs` | `npm run migration:validate`; `npm run db:migrate:dry`; 有 `DATABASE_URL` 时运行 `npm run db:migrate` |
| `gpt-image-2` provider registry validation | 已完成 provider 校验闸门 | `src/server/services/provider-registry-service.ts`, `scripts/validate-provider-registry.mjs` | `npm run provider:validate`; 生产强校验用 `node scripts/validate-provider-registry.mjs --require-live` |

## 剩余外部条件

这些不是代码未完成，而是上线凭据或外部服务条件：

1. GitHub CLI 当前本机授权失效时，worker 仍可用普通 `git push` 推送 ledger 分支；PR/issue 自动创建需要重新授权 `gh` 或配置 GitHub App token。
2. `OPENAI_API_KEY` 未配置时，provider worker 不能真实调用 OpenAI `/models`；生产调用前应配置 key 并使用 `--require-live`。
3. `DATABASE_URL` 未配置时，系统保持 `.local-data/v3-store.json` 本地 fallback；生产多用户部署必须配置 PostgreSQL 后运行 `npm run db:migrate`。
4. 9 个幻觉工具的深度模型调用依赖各工具自己的 Python 环境和模型凭据；当前 worker 已完成 9 仓库 live 状态、异步适配层和工作台 firewall 调用，外部模型型检测器按凭据可用性逐步启用。

## 验收命令

```cmd
npm run typecheck
npm run test:compiled
npm run quality:golden
npm run schema:validate
npm run migration:validate
npm run db:migrate:dry
npm run provider:validate
npm run hallucination:live -- "This is a test claim with no evidence"
npm run github-ledger:validate
npm run build
```
