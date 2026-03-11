# KKClaw Smart Setup Phase 1 MVP Task

项目目录：C:\Users\zhouk\Desktop\02_开发项目\desktop-pet
参考方案：`docs-dev/SMART-SETUP-IMPLEMENTATION-PLAN.md`

## 任务目标
实现 `KKClaw Smart Setup` 的 Phase 1 MVP：
1. 新增统一路径解析器 `utils/path-resolver.js`
2. 新增 OpenClaw 环境探测器 `utils/openclaw-detector.js`
3. 新增依赖检测器 `utils/dependency-checker.js`
4. 把 Setup Wizard 增加“环境检测”能力（至少能展示结构化检测结果）
5. 不要 git push

## 详细要求

### 一、路径解析器 `utils/path-resolver.js`
需要集中提供这些能力：
- `getProjectRoot()`
- `getUserHome()`
- `getDesktopDir()`
- `getTempDir()`
- `getOpenClawConfigDir()`
- `getOpenClawDataDir()`
- `getOpenClawConfigPath()`
- `getDocsImageDir()`
- `ensureDir(dir)`

要求：
- 跨平台优先，但至少 Windows 逻辑必须稳定
- 不要硬编码 `C:\Users\zhouk\...`
- 可优先用 `os.homedir()`、`path.join()`、`process.cwd()`、`__dirname`
- 对缺失目录提供可创建能力

### 二、OpenClaw 环境探测器 `utils/openclaw-detector.js`
要探测：
- `openclaw` 命令是否存在
- 安装模式（至少区分：npm global / git / local prefix / unknown）
- `~/.openclaw` 是否存在
- `openclaw.json` 是否存在
- `openclaw-data` / data 目录是否存在
- `openclaw status` 是否可调用（可做轻量检测，失败也要优雅返回）
- 是否存在多个候选安装位置

要求：
- 不要只假设一种安装模式，需参考 OpenClaw 官方文档兼容多种安装来源
- 优先按以下顺序探测：
  1. `where openclaw` / `which openclaw`
  2. `openclaw --version`
  3. `openclaw status`
  4. `~/.openclaw`、配置目录、data 目录
  5. `npm prefix -g` / `npm root -g`
  6. git checkout 特征
- 如果存在多个候选路径，要输出结构化候选结果，方便 UI 展示
- 不要默认做全盘暴力扫描；如后续要扫，也应是限定范围扫描并留给后续阶段
- 预留“用户手动指定 OpenClaw 主目录 / CLI 路径后再验证”的接口能力

输出应是结构化对象，方便 UI 直接显示。

### 三、依赖检测器 `utils/dependency-checker.js`
要检查：
- Node
- npm
- OpenClaw
- git
- Python
- pip
- edge-tts（可选）
- sqlite3（可选）
- 项目 node_modules / Electron 是否存在

要求输出：
- `ok`
- `version`
- `required`
- `installHint`（如适合）
- `source`（可选）

### 四、Setup Wizard 接入
重点修改：
- `setup-wizard.js`
- `setup-wizard.html`
- 如需要：`main.js`、`preload.js`

目标：
- 至少增加一个“环境检测 / 系统检查”区域
- 能显示：Node、npm、OpenClaw、项目依赖、关键路径
- 新增 OpenClaw 安装模式与 CLI 路径展示
- 当检测结果不唯一时，支持展示候选路径并让用户确认
- 预留“手动指定 OpenClaw 主目录 / CLI 路径 / 配置目录”的入口
- UI 不必一步做到完美，但必须能跑、能展示真实检测结果
- 尽量保持和现有风格一致

### 五、实现范围控制
本次只做 Phase 1 MVP，不要扩散到 Phase 2/3：
- 不做自动安装系统级依赖
- 不做完整健康检查闭环
- 不做 git push
- 不做大规模无关重构

### 六、验收标准
完成后请汇报：
1. 新增了哪些文件
2. 修改了哪些文件
3. Setup Wizard 新增了什么可见能力
4. 还有哪些暂未做（留给 Phase 2/3）
5. 如果有风险或不确定点，明确写出来

### 七、额外要求
- 不要打印或写入任何真实 secret
- 尽量用最小改动达成 MVP
- 保持代码风格一致
- 完成后不要 push，只输出总结
