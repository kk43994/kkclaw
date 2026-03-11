【整改计划 v1｜给 Claude Code 的任务单】

项目目录：C:\Users\zhouk\Desktop\02_开发项目\desktop-pet
目标：同时修复 3 类问题
1. 仓库中的明文 key / token 暴露
2. 仓库中的硬编码本机绝对路径
3. 小白用户 clone 后因路径不匹配而无法运行的问题（改成自动适配当前用户环境）

执行原则：
- 不要提交或打印任何真实 secret
- 只把真实 key/token 替换为占位符、环境变量或本地配置读取
- 优先做“当前 HEAD 可见内容”的修复，不重写 git 历史
- 修改尽量小而稳，不做无关重构
- 需要兼顾 Windows 新手体验

一、优先修复的文件（高优先级）
1. docs-dev/FEATURE-GUIDE.md
   - 搜索疑似真实 apiKey
   - 替换为安全占位符，例如 sk-xxxxxxxx 或 <YOUR_API_KEY>
   - 如果是示例配置，明确标注“示例，勿提交真实 key”

2. scripts/manual-verify.js
   - 删除硬编码 Bearer token
   - 改成从环境变量读取，例如 process.env.MOLTBOOK_API_KEY
   - 如果缺失环境变量，给出清晰报错
   - 不要把真实 token 写回文件

3. scripts/quick-engage.js
   - 同 manual-verify.js
   - 抽一个小 helper 也可以，但不要过度重构

4. scripts/create-shortcut.ps1
   - 去掉硬编码 C:\Users\zhouk\Desktop\02_开发项目\desktop-pet
   - 用 $PSScriptRoot 推导项目根目录
   - 用 Join-Path 生成路径
   - 保证在任意 clone 目录都能创建快捷方式

5. scripts/screenshot.ps1
   - 去掉硬编码输出路径
   - 用脚本当前目录推导项目根目录
   - 输出到 <projectRoot>\docs\images\desktop-view.png
   - 如果目录不存在，自动创建

6. scripts/take_screenshots.py
   - 去掉硬编码输出目录
   - 用 pathlib.Path(__file__).resolve() 推导项目根目录
   - 输出到 project_root / 'docs' / 'images'
   - 自动 mkdir(parents=True, exist_ok=True)

7. docs-dev/AUTO-RESTART.md
   - 把写死的本机路径改成通用描述，例如
     - <workspace>/desktop-pet-state.json
     - 或使用相对示例路径
   - 不要暴露我的本地真实目录

二、中优先级
8. 检查 docs/CONFIGURATION-GUIDE.md
   - 保留示例值，但确认没有真实 key
   - 如有必要，把示例统一成更清晰的占位符格式

9. 全仓补充轻量防呆
   - 新增或补充 .env.example（如果项目里合适）
   - 至少把 MOLTBOOK_API_KEY 这种变量名说明清楚
   - 如果已有配置方案，补文档说明即可，不强行引入新体系

三、交付要求
1. 先分析后修改
2. 修改完成后，输出：
   - 改了哪些文件
   - 每个文件解决了什么问题
   - 是否还有残留风险点
3. 不要自动 git push
4. 可以本地 commit，但先不要 push，等我审查
5. 如果遇到不确定的设计点，优先选择“最小改动可运行”的方案

四、完成后自检
- 搜索以下内容是否还残留在已修改文件中：
  - 真实 sk- 开头 key
  - Bearer + 真实 token
  - C:\Users\zhouk
- 检查脚本在路径自动推导逻辑上是否合理
- 确保缺少环境变量时给出明确提示

请开始执行：先分析，再修改，再总结。
