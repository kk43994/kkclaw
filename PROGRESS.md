# 进度汇报系统

## 功能
在执行长时间任务时,实时向桌面龙虾发送进度通知,让用户知道当前状态。

## 使用方法

### 1. 引入模块
```javascript
const ProgressReporter = require('./progress-reporter');
const reporter = new ProgressReporter();
```

### 2. 手动汇报进度
```javascript
// 开始任务
reporter.startTask('文件处理', ['读取', '分析', '转换', '保存']);

// 汇报进度
reporter.progress('正在读取文件...');
reporter.progress('正在分析内容...', 50); // 带百分比
reporter.progress('正在转换格式...', 75);

// 完成
reporter.complete('处理完成!');

// 或者失败
reporter.error('处理失败: 文件不存在');
```

### 3. 自动步骤执行
```javascript
await reporter.runSteps('代码优化', [
    {
        name: '扫描代码',
        action: async () => {
            // 你的代码
            await scanCode();
        }
    },
    {
        name: '应用修改',
        action: async () => {
            await applyChanges();
        },
        delay: 500  // 可选: 步骤间延迟
    }
]);
```

## 在 Claw 中使用

我在执行任务时会自动调用这个系统:

**场景1: 代码重构**
```
🚀 开始: 代码重构
⚙️ [25%] 正在分析代码结构...
⚙️ [50%] 正在生成重构方案...
⚙️ [75%] 正在应用修改...
✅ 重构完成!
```

**场景2: GitHub 操作**
```
🚀 开始: 推送到GitHub
⚙️ 正在创建仓库...
⚙️ [33%] 正在添加文件...
⚙️ [66%] 正在提交...
⚙️ [100%] 正在推送...
✅ 成功推送到 GitHub!
```

**场景3: 文件批处理**
```
🚀 开始: 批量处理图片
⚙️ [1/10] 正在处理 image1.jpg...
⚙️ [5/10] 正在处理 image5.jpg...
⚙️ [10/10] 正在处理 image10.jpg...
✅ 批量处理完成!
```

## 优势
- ✅ 实时反馈 - 不用等到最后才知道结果
- ✅ 进度可见 - 知道还要等多久
- ✅ 桌面通知 - 不用盯着终端
- ✅ 语音播报 - 自动朗读进度(如果开启)

## 测试
```bash
node test-progress.js
```

观察桌面龙虾的通知!
