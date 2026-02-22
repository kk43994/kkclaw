#!/usr/bin/env node
// 桌面龙虾消息桥接 - 让 OpenClaw 消息自动推送到桌面
// 使用方法: 在 AGENTS.md 里调用这个脚本

const http = require('http');

const DESKTOP_PORT = 18788;
const MAX_PORT_RETRIES = 5; // 桌面宠物可能在 18788-18792 之间

/**
 * 清理文本用于TTS播报
 * 移除emoji、颜文字、markdown格式等
 */
/**
 * 清理文本用于TTS播报
 * 只移除emoji、颜文字、markdown，保留中文标点让MiniMax自然处理
 */
function cleanForTTS(text) {
    return text
        // 移除emoji
        .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
        .replace(/[\u{2600}-\u{27BF}]/gu, '')
        .replace(/[\u{1F000}-\u{1F02F}]/gu, '')
        .replace(/[\u{1F0A0}-\u{1F0FF}]/gu, '')
        .replace(/[✨❤️💕🎀🔍📚📊💬🎯✅❌⚠️💡🌟🚀📝🎉🤖👀📋🔧💝🌸⚡🎨🎓💼🧠♡♥❤💕💖💗💙💚💛💜🧡]/gu, '')
        
        // 移除颜文字
        .replace(/[ヮωっﾟ･ᵜᵕóòôöōǒǑōｏＯ✧*ﾟ:：]+/g, '')
        .replace(/\([^)]{0,20}?[ノ∀◕ω♡✧๑•̀́∀๑][^)]{0,20}?\)/g, '')
        .replace(/[ᵤᵦノﾉノ]+/g, '')
        
        // 移除markdown格式
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/^[-*+]\s+/gm, '')
        .replace(/^\d+\.\s+/gm, '')
        
        // 移除链接
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/https?:\/\/[^\s]+/g, '')
        
        // 换行转空格（不转标点）
        .replace(/\n{2,}/g, '。')
        .replace(/\n/g, '，')
        
        // 清理多余空格
        .replace(/\s{2,}/g, ' ')
        .replace(/^\s+/, '')
        .replace(/\s+$/, '')
        .trim();
}

/**
 * 🎭 根据文本自动检测情绪（精细版）
 * 按优先级排列：先匹配特殊情绪，最后才是 happy/calm
 */
function detectEmotion(text) {
    // 1. 思考/分析（优先级最高 — agent经常在分析）
    if (text.match(/让我.*看看|分析|检查|研究|查一下|想想|思考|emmm|hmm|让我康康|先看看|排查|诊断|对比|梳理/)) return 'thinking';
    // 2. 惊讶/意外
    if (text.match(/天哪|居然|不敢相信|竟然|没想到|什么[?？!！]|真的吗|哇塞|我靠|amazing|wow|omg|发现了|原来是/i)) return 'surprised';
    // 3. 担忧/紧急
    if (text.match(/错误|崩溃|警告|紧急|危险|注意.*安全|小心|完蛋|糟了|坏了|出事|不妙|严重|卡死|挂了/)) return 'fearful';
    // 4. 难过/抱歉
    if (text.match(/抱歉|对不起|失败|不好意思|遗憾|可惜|糟糕|出错|报错|bug|没找到|找不到|搞砸/i)) return 'sad';
    // 5. 生气/烦躁
    if (text.match(/生气|愤怒|气死|可恶|烦死|讨厌|受不了|太过分|无语|离谱/)) return 'angry';
    // 6. 平静/安慰/晚安
    if (text.match(/休息|晚安|睡觉|早安|注意身体|注意休息|保重|辛苦|别急|没事|放心|陪你|在的|慢慢/)) return 'calm';
    // 7. 超级兴奋（多个感叹号或强烈词）
    if (text.match(/[!！]{3,}|太棒了|哇啊|超级|amazing|incredible|牛逼|绝了|爆|炸/i)) return 'excited';
    // 8. 开心/成功
    if (text.match(/[!！]{2,}|太棒|成功|完成|耶|恭喜|开心|搞定|好哒|漂亮|厉害|优秀|给力|赞|爽|哈哈|嘻嘻|干得好|通过|完美|发布|上线/)) return 'happy';
    // 9. 确认/收到
    if (text.match(/收到|好的|明白|了解|没问题|可以|马上|开始|好哒/)) return 'calm';
    // 10. 默认 calm
    return 'calm';
}

/**
 * 🎵 根据情绪和文本插入 MiniMax TTS 停顿标记
 * <#0.3#> = 短停顿, <#0.5#> = 中停顿, <#0.8#> = 长停顿
 */
function addTTSPauseMarkers(text, emotion) {
    let marked = text;
    // MiniMax 本身会在标点处自然停顿，不需要每个逗号都加标记
    // 只在破折号处加停顿（替代原文）
    marked = marked.replace(/(——|--)\s*/g, '<#0.4#>');
    
    // 根据情绪微调
    if (emotion === 'thinking') {
        marked = '<#0.2#>' + marked;
    } else if (emotion === 'surprised') {
        marked = marked.replace(/([!！])/, '$1<#0.3#>');
    }
    // 其他情绪不加额外标记，让MiniMax自然处理
    
    return marked;
}

async function notifyDesktop(type, payload) {
    // 如果是语音响应,清理文本 + 加停顿标记
    if (type === 'agent-response' && payload.content) {
        const originalContent = payload.content;
        payload.content = cleanForTTS(payload.content);

        // 加 TTS 停顿标记
        if (payload.emotion) {
            payload.content = addTTSPauseMarkers(payload.content, payload.emotion);
        }

        // 调试输出
        console.log('🧹 文本清理:');
        console.log('   原文:', originalContent.substring(0, 80) + '...');
        console.log('   清理后:', payload.content.substring(0, 80) + '...');
        console.log('   🎭 情绪:', payload.emotion || 'auto');
    }

    const data = JSON.stringify({ type, payload });

    // 自动尝试多个端口（桌面宠物启动时端口可能被占用而顺延）
    for (let i = 0; i < MAX_PORT_RETRIES; i++) {
        const port = DESKTOP_PORT + i;
        const success = await _trySend(data, port);
        if (success) return true;
    }
    console.log('⚠️ 桌面应用未运行（端口 18788-18792 均不可达）');
    return false;
}

function _trySend(data, port) {
    return new Promise((resolve) => {
        const options = {
            hostname: '127.0.0.1',
            port,
            path: '/notify',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            },
            timeout: 2000
        };

        const req = http.request(options, (res) => {
            if (res.statusCode === 200) {
                console.log(`✅ 桌面通知已发送 (端口 ${port})`);
                resolve(true);
            } else {
                resolve(false);
            }
        });

        req.on('error', () => resolve(false));
        req.on('timeout', () => { req.destroy(); resolve(false); });
        req.write(data);
        req.end();
    });
}

// CLI 使用
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
        console.log('用法: node desktop-bridge.js <type> <content>');
        console.log('示例: node desktop-bridge.js user-message "你好"');
        console.log('示例: node desktop-bridge.js agent-response "我收到了"');
        process.exit(1);
    }
    
    const type = args[0];
    // 提取 --emotion 参数
    const emotionIdx = args.indexOf('--emotion');
    let explicitEmotion = null;
    let contentArgs = args.slice(1);
    if (emotionIdx > 0) {
        explicitEmotion = args[emotionIdx + 1];
        contentArgs = [...args.slice(1, emotionIdx), ...args.slice(emotionIdx + 2)];
    }
    const content = contentArgs.join(' ');
    
    let payload;
    if (type === 'user-message') {
        payload = { 
            sender: '用户', 
            content: content,
            channel: 'lark'
        };
    } else if (type === 'agent-response') {
        const emotion = explicitEmotion || detectEmotion(content);
        payload = { 
            content: content,
            emotion: emotion
        };
    } else {
        payload = { 
            message: content
        };
    }
    
    notifyDesktop(type, payload).then(() => {
        process.exit(0);
    });
}

module.exports = { notifyDesktop, cleanForTTS, detectEmotion, addTTSPauseMarkers };
