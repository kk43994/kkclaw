# KKClaw Smart Setup 改造方案 v1

## 目标

把 KKClaw 的新手引导从“静态教程 + 手动修配置”升级成“自动探测环境 + 自动适配路径 + 自动补基础依赖 + 自动健康检查”的智能安装向导。

核心体验目标：
1. 用户 clone 项目后即可启动引导器
2. 引导器自动识别当前电脑上的 OpenClaw 相关路径
3. 自动检查 Node / npm / OpenClaw / 项目依赖状态
4. 自动创建缺失目录并修复基础路径问题
5. 最终给出清晰的可用性报告

---

## 设计原则

### 1. 单一真相源
所有路径解析、环境状态、依赖状态都集中管理，不能分散在各个脚本里各自实现。

### 2. 先检测，后修复
先告诉用户“检测到了什么、缺了什么、哪些可以自动修”，再执行修复动作。

### 3. 区分硬依赖与软依赖
- **硬依赖**：没有就跑不起来（Node、npm、OpenClaw CLI、项目 npm 依赖）
- **软依赖**：没有也能跑，但功能不完整（edge-tts、sqlite3、Python截图依赖等）

### 4. Secret 只落本地
API Key / token 只能写入本地配置、环境变量或安全存储，不得出现在仓库示例、文档或日志中。

### 5. 路径统一走 resolver
任何脚本都不允许再硬编码 `C:\Users\...` 这类本机路径。

---

## 模块设计

## 模块 A：路径解析中心
### 文件
- `utils/path-resolver.js`

### 职责
统一解析项目运行涉及的所有关键路径。

### 建议接口
- `getProjectRoot()`
- `getUserHome()`
- `getDesktopDir()`
- `getTempDir()`
- `getOpenClawConfigDir()`
- `getOpenClawDataDir()`
- `getOpenClawConfigPath()`
- `getDocsImageDir()`
- `getVoiceTempDir()`
- `getStateFilePath()`

### 解析优先级
1. 用户显式指定（环境变量 / Setup Wizard 输入 / 本地配置）
2. 自动探测（`os.homedir()`、平台默认目录、已存在配置）
3. 安全 fallback（项目内临时目录、`os.tmpdir()`）

### 验收标准
- 核心路径逻辑不再硬编码
- 所有后续新增脚本统一调用 resolver

---

## 模块 B：OpenClaw 环境探测器
### 文件
- `utils/openclaw-detector.js`

### 职责
结构化探测 OpenClaw 是否已安装、属于哪种安装模式、配置文件和工作目录在哪，并支持用户手动指定主目录后重新验证。

### 官方安装模式兼容要求
根据 OpenClaw 官方文档，至少要兼容以下安装来源：
1. **npm 全局安装**
   - 典型入口：`npm install -g openclaw`
   - 常见特征：`openclaw` 在 PATH 中，可通过 `npm prefix -g` / `npm root -g` 反查安装位置
2. **git checkout 安装**
   - 官方安装脚本支持 `--install-method git`
   - Windows PowerShell 安装器支持 `-InstallMethod git -GitDir <path>`
   - 常见特征：存在源码目录 / wrapper 指向 checkout
3. **local prefix 安装**
   - 官方 `install-cli.sh` 默认安装到 `~/.openclaw`
   - 常见特征：`<prefix>/bin/openclaw`、`<prefix>` 下包含本地 runtime / npm 安装内容
4. **用户手动指定目录**
   - 当自动识别不可靠或存在多候选路径时，允许用户手动输入 OpenClaw 主目录 / CLI 路径 / 配置目录

### 检测策略（按优先级）
1. 检测命令路径：`where openclaw` / `which openclaw`
2. 检测 CLI 可用性：`openclaw --version`
3. 检测状态命令：`openclaw status`
4. 检测标准目录：`~/.openclaw`、`openclaw.json`、`data/`
5. 检测包管理器路径：`npm prefix -g`、`npm root -g`
6. 检测常见 git 安装目录 / wrapper 特征
7. 如仍不确定，再进入“候选路径展示 + 用户手动确认”

### 检测项
- `openclaw` 命令是否存在
- 安装模式（npm global / git / local prefix / manual / unknown）
- `~/.openclaw` 是否存在
- `openclaw.json` 是否存在
- `openclaw-data` / data 目录是否存在
- `gateway.cmd` / `gateway.sh` / wrapper 是否存在
- `openclaw status` 是否可运行
- 是否存在多个候选安装位置

### 输出结构建议
```js
{
  installed: true,
  installMode: 'npm-global',
  cliPath: '...',
  installRoot: '...',
  configDir: '...',
  configFile: '...',
  dataDir: '...',
  gatewayScript: '...',
  source: 'where-openclaw',
  candidates: [
    {
      installMode: 'git',
      cliPath: '...',
      installRoot: '...',
      confidence: 0.72
    }
  ],
  statusCheck: {
    ok: true,
    message: 'Gateway available'
  }
}
```

### 验收标准
- OpenClaw 装了/没装都能清晰返回
- 能区分至少 `npm-global / git / local-prefix / unknown`
- 当探测结果不唯一时，能给出候选路径供 UI 展示
- 支持用户手动指定目录后进行二次验证
- 检测结果适合直接给 UI 展示

---

## 模块 C：依赖检测器
### 文件
- `utils/dependency-checker.js`

### 职责
统一检查环境依赖是否满足运行条件。

### 首批检查对象
#### 核心
- Node
- npm
- OpenClaw
- git

#### 增强
- Python
- pip
- edge-tts
- sqlite3

#### 项目依赖
- `node_modules` 是否存在
- Electron 是否存在

### 输出结构建议
```js
{
  node: { ok: true, version: 'v22.x', required: true },
  npm: { ok: true, version: '10.x', required: true },
  openclaw: { ok: false, required: true, installHint: 'npm install -g openclaw' },
  edgeTts: { ok: false, required: false },
  sqlite3: { ok: true, required: false, source: 'PATH' }
}
```

### 验收标准
- 可区分已安装 / 未安装 / 可选组件
- 能生成用户可读的修复建议

---

## 模块 D：依赖安装器
### 文件
- `utils/dependency-installer.js`

### 职责
执行风险可控的自动修复动作。

### 第一阶段建议支持
#### 自动执行
- `npm install`
- 创建缺失目录
- 生成模板配置
- 修复项目内基础依赖

#### 暂不强行自动执行
- 自动安装 Python
- 自动安装 OpenClaw 全局 CLI
- 静默安装系统级软件
- 无提示提权安装

### 动作分级
#### Level 1：低风险本地动作
- mkdir
- npm install
- 复制模板文件

#### Level 2：需确认
- 安装全局 CLI
- 写用户目录配置
- 修改开机启动项

#### Level 3：系统级动作
- `winget`
- `brew`
- `apt`
- 需要管理员权限的操作

### 验收标准
- 每个自动修复动作都可审计
- 失败时有明确提示和 fallback 建议

---

## 模块 E：健康检查器
### 文件
- `utils/setup-healthcheck.js`

### 职责
在 Setup 完成后进行最终验收，告诉用户“现在能不能跑”。

### 检查内容
- 项目依赖是否完整
- OpenClaw 配置是否存在
- Gateway 能否探测/启动
- 关键路径是否可写
- TTS 是否可用
- 截图输出路径是否可写
- 桌面宠物核心初始化是否正常

### 输出结构建议
```js
{
  overall: 'warning',
  checks: [
    { name: 'OpenClaw CLI', status: 'ok' },
    { name: 'Project dependencies', status: 'ok' },
    { name: 'edge-tts', status: 'warning' },
    { name: 'Gateway', status: 'ok' }
  ],
  nextActions: [
    'Install edge-tts for local TTS fallback'
  ]
}
```

### 验收标准
- 最终状态明确：`ok / warning / error`
- 不仅报错，还要告诉用户下一步该做什么

---

## UI 改造方案

### 重点文件
- `setup-wizard.html`
- `setup-wizard.js`
- 必要时补 `setup-wizard.css`
- `main.js`
- `preload.js`

### 页面流程建议
#### Step 1：欢迎页
说明将自动检查环境、自动适配路径、不会上传本地 API Key。

#### Step 2：环境检测
展示：
- Node
- npm
- OpenClaw
- git
- Python
- edge-tts
- sqlite3
- 项目依赖

每项显示：
- 状态
- 版本
- 是否必须
- 修复建议/修复按钮

#### Step 3：路径确认
展示自动探测到的：
- 项目根目录
- OpenClaw 配置目录
- openclaw-data 目录
- Desktop 路径
- 临时目录
- OpenClaw CLI 路径
- OpenClaw 推断安装模式（npm global / git / local prefix / unknown）

支持：
- 查看
- 修改
- 重新探测
- 在存在多个候选路径时进行人工确认
- 手动指定 OpenClaw 主目录 / CLI 路径 / 配置目录，并立即触发验证

#### Step 4：自动修复
提供一键执行：
- 安装项目依赖
- 创建缺失目录
- 生成默认模板配置
- 修复路径相关设置

#### Step 5：AI / 组件配置
引导配置：
- Provider
- Model
- 本地配置写入
- TTS 引擎
- 可选增强组件

#### Step 6：健康检查
输出：
- 可直接使用
- 可使用但建议补装
- 仍有阻塞问题

---

## 需要改造的现有文件

### 新增
- `utils/path-resolver.js`
- `utils/openclaw-detector.js`
- `utils/dependency-checker.js`
- `utils/dependency-installer.js`
- `utils/setup-healthcheck.js`
- 可选：`docs-dev/SMART-SETUP-MVP-TASKS.md`

### 重点修改
- `setup-wizard.js`
- `setup-wizard.html`
- `main.js`
- `preload.js`

### 接入 resolver 的现有脚本
- `scripts/create-shortcut.ps1`
- `scripts/screenshot.ps1`
- `scripts/take_screenshots.py`
- `create-shortcut.ps1`
- `utils/cc-switch-sync.js`
- `scripts/batch-install-skills.js`
- `archive/edge-tts-voice.js`

### 文档同步
- `README.md`
- `docs/CONFIGURATION-GUIDE.md`
- `SKILL.md`

---

## 分期实施计划

## Phase 1：路径统一 + 环境探测 MVP
### 目标
先解决路径混乱和新手不知道缺什么的问题。

### 范围
- 上 `path-resolver`
- 上 `openclaw-detector`
- 上 `dependency-checker`
- Setup Wizard 新增环境检测页
- 核心脚本统一改动态路径

### 交付结果
- clone 到任意目录都能跑基础流程
- 新手能一眼看见自己缺什么

### 验收标准
- 关键路径不再硬编码
- Setup Wizard 能展示检测结果
- 至少 Windows 流程稳定可用

---

## Phase 2：自动修复能力
### 目标
从“发现问题”升级成“帮用户补问题”。

### 范围
- `dependency-installer`
- 自动创建缺失目录
- 一键安装项目依赖
- 基础配置修复

### 交付结果
- 新手减少手动跑命令
- Setup Wizard 具备实际修复能力

### 验收标准
- 点击修复后能补齐项目核心依赖
- 修复日志清晰
- 失败时给出明确提示

---

## Phase 3：完整健康检查闭环
### 目标
让用户最终得到确定性的结果。

### 范围
- `setup-healthcheck`
- Gateway 检测
- TTS / 截图 / 路径可写性检查
- 最终可用性报告

### 交付结果
- 用户一眼知道“现在能不能跑”
- Smart Setup 可以作为正式卖点对外宣传

### 验收标准
- 输出 `ok / warning / error`
- 每个状态都有下一步建议

---

## 风险点

### 1. 自动安装不能过猛
不要一上来静默安装系统级依赖或改全局环境，避免损坏用户环境。

### 2. OpenClaw 路径可能不唯一
需要支持：
- 多候选路径
- 用户确认路径
- fallback 逻辑
- 不同官方安装模式（npm global / git / local prefix）
- 自动探测失败后的手动指定主目录

### 3. 不要默认做全盘暴力扫描
因为官方安装方式不止一种，确实需要更强的定位能力；但默认全盘扫描会拖慢首次体验，也容易误命中过期目录或残留文件。

更合理的顺序应该是：
1. 命令路径检测（`where/which openclaw`）
2. CLI 可用性检查（`openclaw --version` / `openclaw status`）
3. 标准目录与配置目录检测（`~/.openclaw` 等）
4. npm / 包管理器全局路径检测
5. git checkout 特征检测
6. 多候选路径展示 + 用户确认
7. 最后才做限定范围扫描（而不是默认全盘扫描）

### 4. Setup Wizard 不要耦合业务逻辑
Wizard 负责检测、修复、配置、验收，不负责承载杂乱业务逻辑。

---

## 建议的 MVP 口径

### KKClaw Smart Setup（MVP）
- 自动识别本机 OpenClaw 环境
- 自动识别工作目录与关键路径
- 自动修复项目依赖与基础目录
- 避免硬编码路径导致的新手安装失败
- 提供最终健康检查结果

---

## 建议的下一步
1. 基于本方案产出 `Phase 1 MVP` 任务清单
2. 交给 Claude Code 实作：
   - `path-resolver.js`
   - `openclaw-detector.js`
   - `dependency-checker.js`
   - Setup Wizard 环境检测页
3. 完成后由人工审查并再进入 Phase 2
