# KKClaw GitHub Pages 升级计划

## 📊 当前状态分析

### 现有页面结构 (`docs/index.html`, 1912行)
| Section | 内容 | 状态 |
|---------|------|------|
| Navigation | 固定导航 + EN/中文切换 + 版本徽章 | ⚠️ 版本停留在 v3.1.2 |
| Hero | 交互球体 + 7种情绪球 + 标题 + 下载按钮 | ⚠️ 只有7种情绪，实际已14种 |
| Screenshots | 3张截图画廊 | ✅ OK |
| Stats Bar | 7 Moods / 15+ Expressions / 3 TTS / 7×24 | ⚠️ 数据过时 |
| What's New | v3.1.2 更新卡片（6个） | ❌ 缺少 v3.5.x 内容 |
| Wizard Demo | iframe 嵌入 demo.html | ✅ OK |
| Features | 6个特性卡片 | ⚠️ 信息过时（还写CosyVoice） |
| KKClaw Switch | 3步切换流程 + 对比表 | ✅ OK |
| Architecture | 系统架构图 | ⚠️ 还有 CosyVoice |
| Voice Demo | 3个语音试听卡 | ✅ OK |
| Mood System | 7个情绪球互动 | ⚠️ 只有7种 |
| Install | 下载按钮(v2.2.0!!) + ClawHub + Git Clone | ❌ 版本严重过时 |
| Community | 微信群/Discord/赞赏 | ✅ OK |
| Footer | 版权 | ✅ OK |

---

## 🎯 升级目标

将 v3.5.0 ~ v3.5.2 的**全部核心升级**以动态、可交互的方式展示在 Pages 页面上，让访客能**直接看到、体验到**这些功能。

---

## 📋 升级任务清单

### Phase 1: 基础数据更新（必做）

#### 1.1 版本号全面更新
- [ ] 导航 `nav-version`: v3.1.2 → v3.5.2
- [ ] Hero `badge`: v3.1.2 → v3.5.2
- [ ] Meta description: 移除 CosyVoice，加入 Gateway 智能守护
- [ ] Install 下载链接: v2.2.0 → v3.5.2 (所有3个按钮)

#### 1.2 Stats Bar 数据更新
```
7 Mood Color Themes  →  14 Emotion States
15+ Eye Expressions  →  38 Micro-Expressions
3 TTS Engines        →  2 TTS Engines (MiniMax + Edge TTS)
7×24 Stable          →  7×24 Stable (保留)
```

#### 1.3 Architecture 架构图更新
- [ ] 移除 CosyVoice，保留 MiniMax TTS + Edge TTS
- [ ] 新增 Gateway Guardian 层
- [ ] 新增 Setup Wizard 层

#### 1.4 Features 卡片内容更新
- [ ] 修正 TTS 描述：移除 CosyVoice，改为 MiniMax → Edge TTS 双级降级
- [ ] 14种 → 替代 7种
- [ ] 38种微表情 → 替代 15+

---

### Phase 2: 新增动态展示窗口（核心亮点）

#### 2.1 🎨 「Gateway 智能守护」动态演示
**位置**：What's New section 之后，新增独立 section
**交互设计**：
- 左侧：动画状态机流程图
  - Gateway 正常 🟢 → 检测失败 🟡 → 连续3次 🔴 → 自动拉起 ⚡ → 恢复 🟢
  - 每个状态有动画过渡（脉冲、闪烁、弹出）
- 右侧：模拟控制台日志（彩色终端效果）
  ```
  [14:32:05] 🟢 Gateway health check passed (score: 98)
  [14:32:10] 🟡 Gateway not responding...
  [14:32:15] 🟡 Retry 2/3...
  [14:32:20] 🔴 Guardian auto-starting Gateway...
  [14:32:23] ✅ Gateway started successfully!
  [14:32:23] 🔊 "Gateway 启动成功"
  ```
- 按钮：「▶ 模拟 Gateway 崩溃」点击后播放完整动画序列

#### 2.2 🌈 「14种情绪系统」完整展示
**位置**：替换现有的 7 情绪 Mood System section
**交互设计**：
- 14个情绪球排列成两行（7+7）
- 每个球旁标注中英文情绪名
- 点击任一球 → Hero区的主球体实时变色 + 表情切换
- 新增的7种：sad(天蓝)、angry(火红)、fearful(暗紫)、calm(薄荷绿)、excited(亮金)、love(玫瑰粉)、focused(深蓝)

#### 2.3 🎙️ 「彩色终端日志」实时模拟
**位置**：Features section 内或新增独立 section
**交互设计**：
- 一个模拟终端窗口（黑底，带 macOS 三色按钮装饰）
- 自动逐行打印彩色日志：
  ```
  [Gateway] 模型: claude-3.5-sonnet (cyan)
  [Gateway] URL: https://api.anthropic.com (green)
  [Gateway] 渠道: #general @KKBot (magenta)
  [Voice]   TTS生成完成 ✅ (green)
  [Error]   Connection timeout (red)
  [Monitor] CPU: 12% | Memory: 156MB (yellow)
  ```
- 打字机效果，每行有不同颜色高亮
- 底部统计：「12+ 模块统一着色 · 自动去重 · 7天轮转」

#### 2.4 🧙 「Setup Wizard」增强展示
**位置**：现有 Wizard Demo section
**升级内容**：
- 在 iframe 旁新增功能亮点：
  - ⚡ 一键安装缺失依赖（新！）
  - 🐛 出错不白屏（新！）
  - 🔍 智能环境检测
- 小动画展示安装进度条效果

#### 2.5 🔐 「安全」互动展示
**位置**：Features section 内
**交互设计**：
- 模拟 API Key 加密过程：
  ```
  明文: sk-ant-api03-xxxx...  →  🔐  →  密文: ████████████
  ```
- 动画展示 IPC 白名单校验流程
- hover 时展开详情

#### 2.6 🔄 「模型热切换」增强
**位置**：现有 KKClaw Switch section
**升级内容**：
- 新增：失败回滚动画演示
- 新增：延迟测速动态柱状图
  - Claude: 320ms ████████
  - GPT-4:  180ms ████
  - Gemini: 250ms ██████
- 新增：切换历史时间线

---

### Phase 3: What's New v3.5.x 区块

#### 3.1 替换 v3.1.2 → v3.5.2 更新卡片
**6张新卡片**：
1. **Gateway 智能守护** (primary) — 自动拉起 + 健康评分 + 语音播报
2. **彩色终端日志** (green) — 12+ 模块统一着色 + 日志去重
3. **一键安装依赖** (blue) — Setup Wizard 缺失依赖一键安装
4. **38种微表情** (purple) — 三维触发（心情×时间×语气）
5. **安全加固** (yellow) — 命令注入防护 + 日志脱敏
6. **DashScope 下线** (pink) — 降级链简化为 MiniMax → Edge TTS

---

### Phase 4: 视觉风格统一

#### 4.1 新增 CSS 组件
- `.terminal-window` — 终端模拟窗口样式
- `.status-flow` — 状态流程动画
- `.progress-bar-demo` — 进度条演示
- `.latency-bar` — 延迟测速柱状图
- `.timeline` — 切换历史时间线

#### 4.2 新增 CSS 动画
- `@keyframes typewriter` — 逐字打印
- `@keyframes statusPulse` — 状态脉冲
- `@keyframes progressFill` — 进度填充
- `@keyframes fadeInLine` — 日志行淡入

---

## 🚀 实施顺序

```
Phase 1 (基础更新)     → 30分钟
  ├─ 1.1 版本号更新
  ├─ 1.2 Stats更新
  ├─ 1.3 架构图更新
  └─ 1.4 Features更新

Phase 2 (动态展示)     → 主要工作量
  ├─ 2.1 Gateway守护演示
  ├─ 2.2 14种情绪完整展示
  ├─ 2.3 彩色终端日志模拟
  ├─ 2.4 Wizard增强
  ├─ 2.5 安全展示
  └─ 2.6 模型切换增强

Phase 3 (更新卡片)     → 复用已有card样式
Phase 4 (视觉统一)     → 贯穿全过程
```

## 📏 技术约束
- 纯静态 HTML/CSS/JS，无构建工具
- 所有 CSS/JS 内嵌（与现有风格一致）
- 支持中英文切换（`.en` / `.zh` / `.en-inline` / `.zh-inline`）
- 响应式设计（768px / 480px 断点）
- 深色主题，沿用现有色彩变量
