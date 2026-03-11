// 🎙️ 智能语音播报系统 - 增强版（支持 MiniMax Speech / Edge TTS）
const { execFile, spawn } = require('child_process');
const { promisify } = require('util');
const execFileAsync = promisify(execFile);
const path = require('path');
const fs = require('fs').promises;
const MiniMaxTTS = require('./voice/minimax-tts');

class SmartVoiceSystem {
    constructor(petConfig) {
        this.petConfig = petConfig || null;
        this.isSpeaking = false;
        this.tempDir = path.join(__dirname, 'temp');
        this.voice = 'zh-CN-XiaoxiaoNeural';  // Edge TTS 默认晓晓
        this.enabled = true;
        this.queue = [];
        this.maxQueueSize = 10;
        this.lastSpoken = '';
        this.lastSpokenTime = 0;
        
        // 🎭 情境模式
        this.contextMode = 'normal';  // normal, excited, calm, urgent
        
        // 🎙️ TTS 引擎选择: 'minimax' | 'edge'
        this.ttsEngine = 'minimax';  // 默认使用 MiniMax Speech 2.5

        // 🔑 MiniMax 配置
        this.minimax = null;
        this.minimaxVoiceId = 'xiaotuantuan_minimax';  // 🎤 小团团克隆音色 (KK的默认)
        this.minimaxModel = 'speech-2.5-turbo-preview';
        this.minimaxEmotion = 'happy';  // 默认开心
        this.initMiniMax();
        
        // 📊 统计数据
        this.stats = {
            totalSpoken: 0,
            totalSkipped: 0,
            totalQueued: 0,
            avgDuration: 0
        };
        
        this.initTempDir();
        this._currentProcess = null; // 当前播放进程引用，用于 stop() 时杀掉
    }

    async initTempDir() {
        try {
            await fs.mkdir(this.tempDir, { recursive: true });
        } catch (err) {
            console.error('[Voice] ❌ 创建临时目录失败:', err.message);
        }
    }

    /**
     * 🔑 初始化 MiniMax TTS
     */
    initMiniMax() {
        try {
            const config = this.loadConfig();
            const apiKey = process.env.MINIMAX_API_KEY || config.minimax?.apiKey || '';
            if (apiKey) {
                this.minimax = new MiniMaxTTS({
                    apiKey: apiKey,
                    model: config.minimax?.model || this.minimaxModel,
                    voiceId: config.minimax?.voiceId || this.minimaxVoiceId,
                    speed: config.minimax?.speed || 1.1,
                    vol: config.minimax?.vol || 3.0,
                    emotion: config.minimax?.emotion || this.minimaxEmotion,
                    tempDir: this.tempDir
                });
                const { c } = require('./utils/color-log');
                console.log(`[Voice] 🎙️ ${c.bGreen}${c.bold}MiniMax Speech 引擎已初始化${c.reset}`);
                console.log(`[Voice]    模型: ${c.bCyan}${c.bold}${config.minimax?.model || this.minimaxModel}${c.reset}`);
                console.log(`[Voice]    音色: ${c.bMagenta}${c.bold}${config.minimax?.voiceId || this.minimaxVoiceId}${c.reset}`);
                console.log(`[Voice]    情绪: ${c.bWhite}${c.bold}${config.minimax?.emotion || this.minimaxEmotion}${c.reset} | 语速: ${c.bWhite}${c.bold}${config.minimax?.speed || 1.1}x${c.reset} | 音量: ${c.bWhite}${c.bold}${config.minimax?.vol || 3.0}${c.reset}`);
            } else {
                console.log('[Voice] ⚠️ MiniMax API Key 未设置，回退到 Edge TTS');
                if (this.ttsEngine === 'minimax') {
                    this.ttsEngine = 'edge';
                }
            }
        } catch (err) {
            console.error('[Voice] ❌ MiniMax 初始化失败:', err.message);
            if (this.ttsEngine === 'minimax') {
                this.ttsEngine = 'edge';
            }
        }
    }

    /**
     * 🔊 跨平台音频播放
     */
    async _playAudioFile(filePath) {
        if (process.platform === 'darwin') {
            await execFileAsync('afplay', [filePath], { timeout: 120000 });
        } else if (process.platform === 'linux') {
            try {
                await execFileAsync('aplay', [filePath], { timeout: 120000 });
            } catch {
                await execFileAsync('paplay', [filePath], { timeout: 120000 });
            }
        } else {
            // Windows: 用 Electron 的 Chromium 内置 Audio API 播放
            // 完全进程内播放，绝不触发系统文件关联
            try {
                const { BrowserWindow } = require('electron');
                const windows = BrowserWindow.getAllWindows();
                if (windows.length === 0) {
                    console.warn('[Voice] 无可用窗口，跳过音频播放');
                    return;
                }
                const fileUrl = 'file:///' + filePath.replace(/\\/g, '/');
                const safeUrl = JSON.stringify(fileUrl);
                await windows[0].webContents.executeJavaScript(`
                    new Promise((resolve) => {
                        const audio = new Audio(${safeUrl});
                        audio.onended = () => { audio.src = ''; resolve('done'); };
                        audio.onerror = (e) => { audio.src = ''; resolve('error'); };
                        audio.play().catch(() => resolve('blocked'));
                        setTimeout(() => { try { audio.pause(); audio.src = ''; } catch(e) {} resolve('timeout'); }, 60000);
                    })
                `);
            } catch (err) {
                console.error('[Voice] Electron 音频播放失败:', err.message);
            }
        }
    }

    /**
     * 📄 加载配置（优先使用 petConfig 实例获取已解密的值）
     */
    loadConfig() {
        if (this.petConfig) {
            return {
                minimax: this.petConfig.get('minimax') || {},
                ttsEngine: this.petConfig.get('ttsEngine'),
                voiceEnabled: this.petConfig.get('voiceEnabled'),
            };
        }
        // Fallback: 直接读文件（无法解密）
        try {
            const configPath = path.join(__dirname, 'pet-config.json');
            const fsSync = require('fs');
            const SafeConfigLoader = require('./utils/safe-config-loader');
            if (fsSync.existsSync(configPath)) {
                return SafeConfigLoader.load(configPath, {});
            }
        } catch (err) {
            console.warn('[SmartVoice] 读取配置失败:', err?.message || err);
        }
        return {};
    }

    /**
     * 🎯 智能播报入口
     * @param {string} text - 要播报的文本
     * @param {object} options - 选项 { priority, context, emotion }
     */
    async speak(text, options = {}) {
        if (!this.enabled) {
            console.log('🔇 语音已关闭');
            return;
        }

        // 🎯 智能内容分析和优化
        const analysis = this.analyzeContent(text);
        
        // 🎭 如果外部传入了 emotion，优先使用（比自动检测更准）
        if (options.emotion) {
            analysis.emotion = options.emotion;
            console.log(`[Voice] 🎭 使用外部情绪: ${options.emotion}`);
        }
        
        if (analysis.skip) {
            this.stats.totalSkipped++;
            console.log(`⏭️ ${analysis.reason}`);
            return;
        }
        
        // 🎭 根据内容调整语音特性
        const voiceConfig = this.selectVoice(analysis);
        
        // 🔊 队列管理
        if (this.isSpeaking) {
            if (options.priority === 'high' || analysis.priority === 'high') {
                // 高优先级插队
                this.queue.unshift({ text, voiceConfig, analysis });
                console.log(`🚨 优先级插队 (排队: ${this.queue.length})`);
            } else if (this.queue.length < this.maxQueueSize) {
                this.queue.push({ text, voiceConfig, analysis });
                this.stats.totalQueued++;
                console.log(`📝 加入队列 (排队: ${this.queue.length})`);
            } else {
                console.log('⚠️ 队列已满');
            }
            return;
        }

        await this.speakNow(text, voiceConfig, analysis);
        await this.processQueue();
    }

    /**
     * 📊 智能内容分析
     */
    analyzeContent(text) {
        const analysis = {
            skip: false,
            reason: '',
            priority: 'normal',
            emotion: 'neutral',
            category: 'general',
            processedText: text
        };
        
        // 1. 基础过滤
        if (text.length < 2) {
            analysis.skip = true;
            analysis.reason = '内容过短';
            return analysis;
        }
        
        if (/^[\s.,;!?。，；！？]+$/.test(text)) {
            analysis.skip = true;
            analysis.reason = '纯标点';
            return analysis;
        }
        
        // 2. 去重检测
        if (this.lastSpoken === text && Date.now() - this.lastSpokenTime < 5000) {
            analysis.skip = true;
            analysis.reason = '重复内容';
            return analysis;
        }
        
        // 3. 内容分类和优先级
        if (text.match(/🔥|紧急|错误|崩溃|失败|异常|断开|断连|不健康/)) {
            analysis.priority = 'high';
            analysis.emotion = 'urgent';
            analysis.category = 'error';
        } else if (text.match(/✅|完成|成功|好/)) {
            analysis.emotion = 'happy';
            analysis.category = 'success';
        } else if (text.match(/⚠️|警告|注意/)) {
            analysis.priority = 'medium';
            analysis.emotion = 'concern';
            analysis.category = 'warning';
        } else if (text.match(/📊|监控|性能|统计/)) {
            analysis.category = 'data';
        } else if (text.match(/🎉|恭喜|太好了/)) {
            analysis.emotion = 'excited';
            analysis.category = 'celebration';
        }
        
        // 4. 智能文本预处理
        analysis.processedText = this.enhanceText(text, analysis);
        
        return analysis;
    }

    /**
     * ✨ 增强文本 - 让播报更自然
     */
    enhanceText(text, analysis) {
        let enhanced = text;
        
        // 1. 清理特殊字符
        enhanced = this.cleanTextForSpeech(enhanced);
        
        // 2. 根据情境添加语气词
        if (analysis.emotion === 'happy') {
            // 成功的事情，语气更轻快
            if (!enhanced.match(/[，。！]$/)) {
                enhanced += '！';
            }
        } else if (analysis.emotion === 'urgent') {
            // 紧急情况，更简洁直接
            enhanced = enhanced.replace(/正在|准备/, '');
        }
        
        // 3. 智能断句 - 让播报有节奏
        enhanced = this.addNaturalPauses(enhanced);
        
        // 4. 口语化处理
        enhanced = this.makeConversational(enhanced);
        
        return enhanced;
    }

    /**
     * 🎵 添加自然停顿
     */
    addNaturalPauses(text) {
        let paused = text;
        
        // 在关键位置添加停顿
        paused = paused.replace(/，/g, '， ')           // 逗号后短停顿
                       .replace(/。/g, '。 ')           // 句号后长停顿
                       .replace(/！/g, '！ ')           // 感叹号后停顿
                       .replace(/\s+/g, ' ')            // 清理多余空格
                       .trim();
        
        return paused;
    }

    /**
     * 💬 口语化处理
     */
    makeConversational(text) {
        let conversational = text;
        
        // 技术术语口语化
        const replacements = {
            'API': '接口',
            'URL': '网址',
            'JSON': '数据',
            'HTTP': '',
            'IPC': '通信',
            'CPU': '处理器',
            'GB': '吉字节',
            'MB': '兆字节',
            'KB': '千字节',
            'error': '错误',
            'success': '成功',
            'failed': '失败',
            'warning': '警告',
            'OK': '好的',
            'npm': '',
            'node': '',
            '.js': '脚本',
            '.json': '配置',
            'undefined': '未定义',
            'null': '空值'
        };
        
        for (const [tech, speak] of Object.entries(replacements)) {
            const regex = new RegExp(tech, 'gi');
            conversational = conversational.replace(regex, speak);
        }
        
        // 数字读法优化
        conversational = conversational.replace(/(\d+)MB/g, '$1兆')
                                       .replace(/(\d+)GB/g, '$1G')
                                       .replace(/(\d+)%/g, '百分之$1');
        
        // 添加自然的连接词
        if (conversational.match(/^(完成|成功|好|收到)$/)) {
            conversational += '了';
        }
        
        return conversational;
    }

    /**
     * 🎭 根据内容选择语音
     */
    selectVoice(analysis) {
        let config = {
            voice: this.voice,
            rate: '+0%',    // 语速
            pitch: '+0Hz'   // 音调
        };
        
        // 根据情境调整语音特性
        switch (analysis.emotion) {
            case 'excited':
            case 'happy':
                config.rate = '+10%';   // 稍快
                config.pitch = '+30Hz'; // 开心
                break;
            case 'surprised':
                config.rate = '+15%';   // 更快
                config.pitch = '+40Hz'; // 惊讶语调高
                break;
            case 'urgent':
            case 'fearful':
                config.rate = '+10%';
                config.voice = 'zh-CN-YunxiNeural';  // 换男声，更有力
                break;
            case 'sad':
                config.rate = '-5%';    // 稍慢
                config.pitch = '-10Hz'; // 低沉一点
                break;
            case 'thinking':
                config.rate = '-5%';    // 思考时慢一点
                config.pitch = '+10Hz';
                break;
            case 'calm':
                config.rate = '-5%';    // 平静舒缓
                config.pitch = '+15Hz';
                break;
            case 'angry':
                config.rate = '+5%';
                config.pitch = '+20Hz';
                break;
            default:
                config.pitch = '+15Hz';
                break;
        }
        
        return config;
    }

    /**
     * 🔊 立即播报
     */
    async speakNow(text, voiceConfig, analysis) {
        this.isSpeaking = true;
        const startTime = Date.now();
        
        try {
            const cleanText = analysis.processedText || this.cleanTextForSpeech(text);
            
            if (!cleanText.trim()) {
                console.log('⚠️ 清理后文本为空');
                return;
            }
            
            // 记录播报
            this.lastSpoken = text;
            this.lastSpokenTime = Date.now();
            this.stats.totalSpoken++;
            
            // 生成语音
            const outputFile = path.join(this.tempDir, `speech_${Date.now()}.mp3`);
            
            // 显示播报内容（带分类标签）
            const categoryIcon = {
                'success': '✅',
                'error': '🔥',
                'warning': '⚠️',
                'data': '📊',
                'celebration': '🎉',
                'general': '🔊'
            }[analysis.category] || '🔊';
            
            console.log(`${categoryIcon} 播报: ${cleanText.substring(0, 40)}${cleanText.length > 40 ? '...' : ''}`);
            
            // 🎙️ 根据引擎选择 TTS 方式
            if (this.ttsEngine === 'minimax' && this.minimax) {
                // MiniMax Speech 2.5 (带情感控制)
                try {
                    // 优先用 analysis 传入的 emotion，否则自动检测
                    const emotion = (['happy','sad','angry','fearful','disgusted','surprised','calm'].includes(analysis.emotion))
                        ? analysis.emotion
                        : MiniMaxTTS.detectEmotion(cleanText);
                    console.log(`[Voice] 🎭 TTS情绪: ${emotion} (来源: ${analysis.emotion === emotion ? '外部指定' : '自动检测'})`);
                    const audioFile = await this.minimax.synthesize(cleanText, {
                        voiceId: this.minimaxVoiceId,
                        emotion: emotion,
                        outputFile: outputFile
                    });

                    await this._playAudioFile(audioFile);

                } catch (minimaxErr) {
                    console.error('[Voice] ❌ MiniMax 失败，回退到 Edge TTS:', minimaxErr.message);
                    // 🚨 发送降级通知
                    this.notifyDegradation('minimax', 'edge', minimaxErr.message);
                    // 直接回退到 Edge TTS
                    await this.speakWithEdgeTTS(cleanText, voiceConfig, outputFile);
                }
            } else {
                // Edge TTS (回退方案)
                await this.speakWithEdgeTTS(cleanText, voiceConfig, outputFile);
            }
            
            const duration = (Date.now() - startTime) / 1000;
            this.stats.avgDuration = (this.stats.avgDuration * (this.stats.totalSpoken - 1) + duration) / this.stats.totalSpoken;
            
            console.log(`✅ 播放完成 (${duration.toFixed(1)}秒)`);

            // 🧹 每 20 次播报自动清理旧文件，保留最近 30 个
            if (this.stats.totalSpoken % 20 === 0) {
                this.cleanupTempFiles(30).catch(() => {});
            }

        } catch (err) {
            console.error('🎙️ 播报失败:', err.message);
        } finally {
            this.isSpeaking = false;
        }
    }

    async processQueue() {
        if (this.queue.length > 0 && !this.isSpeaking) {
            const next = this.queue.shift();
            console.log(`🔊 队列播报 (剩余: ${this.queue.length})`);
            await this.speakNow(next.text, next.voiceConfig, next.analysis);
            // 继续处理队列
            if (this.queue.length > 0) {
                setTimeout(() => this.processQueue(), 500);
            }
        }
    }

    /**
     * 🧹 文本清理（基础版本）
     */
    cleanTextForSpeech(text) {
        let cleaned = text;
        
        // Emoji 移除
        cleaned = cleaned.replace(/[\u{1F600}-\u{1F64F}]/gu, '')
                         .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
                         .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
                         .replace(/[\u{1F900}-\u{1F9FF}]/gu, '')
                         .replace(/[\u{2600}-\u{26FF}]/gu, '')
                         .replace(/[\u{2700}-\u{27BF}]/gu, '');
        
        // 常见符号替换
        cleaned = cleaned.replace(/✅/g, '完成')
                         .replace(/❌/g, '失败')
                         .replace(/⚠️/g, '注意')
                         .replace(/🚀/g, '')
                         .replace(/[📢💡🔧📝📸📤🔊⚙️]/g, '');
        
        // Markdown 清理
        cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '$1')
                         .replace(/\*(.*?)\*/g, '$1')
                         .replace(/`(.*?)`/g, '$1')
                         .replace(/\[(.*?)\]\(.*?\)/g, '$1');
        
        // 特殊符号清理（保留 MiniMax TTS 停顿标记 <#X#>）
        cleaned = cleaned.replace(/<#([\d.]+)#>/g, 'TPAUSE$1TEND');  // 暂存停顿标记
        cleaned = cleaned.replace(/[【】\[\]{}「」_~#@]/g, '');
        cleaned = cleaned.replace(/TPAUSE([\d.]+)TEND/g, '<#$1#>');  // 恢复停顿标记
        
        // 长度限制
        if (cleaned.length > 800) {
            cleaned = cleaned.substring(0, 800) + '，等共' + cleaned.length + '字';
        }
        
        // 空格清理
        cleaned = cleaned.replace(/\s+/g, ' ').trim();
        
        return cleaned;
    }

    /**
     * 📊 获取统计
     */
    getStats() {
        return {
            ...this.stats,
            queueLength: this.queue.length,
            isSpeaking: this.isSpeaking,
            enabled: this.enabled
        };
    }

    /**
     * 🎛️ 设置模式
     */
    setMode(mode) {
        this.contextMode = mode;
        console.log(`🎭 切换播报模式: ${mode}`);
    }

    /**
     * 🔇 开关语音
     */
    toggle(enabled) {
        this.enabled = enabled;
        console.log(`🔊 语音${enabled ? '开启' : '关闭'}`);
    }

    clearQueue() {
        this.queue = [];
    }

    stop() {
        this.clearQueue();
        this.isSpeaking = false;
        // 杀掉正在播放的进程
        if (this._currentProcess && !this._currentProcess.killed) {
            this._currentProcess.kill();
            this._currentProcess = null;
        }
    }

    /**
     * 🔊 使用 Edge TTS 播报（回退方案，使用 execFile 避免命令注入）
     */
    async speakWithEdgeTTS(cleanText, voiceConfig, outputFile) {
        const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
        // 将文本写入临时文件，通过 --file 传入，避免 shell 注入
        const textFile = path.join(this.tempDir, `tts_text_${Date.now()}.txt`);
        const fsSync = require('fs');
        fsSync.writeFileSync(textFile, cleanText, 'utf8');

        const args = ['-m', 'edge_tts', '--voice', voiceConfig.voice, '--file', textFile, '--write-media', outputFile];

        if (voiceConfig.rate !== '+0%') {
            args.push('--rate', voiceConfig.rate);
        }
        if (voiceConfig.pitch !== '+0Hz') {
            args.push('--pitch', voiceConfig.pitch);
        }

        try {
            await execFileAsync(pythonCmd, args, { timeout: 30000, windowsHide: true });
        } finally {
            fsSync.unlink(textFile, () => {}); // 清理临时文件
        }

        await this._playAudioFile(outputFile);
    }

    /**
     * 🎙️ 切换 TTS 引擎
     */
    setEngine(engine) {
        if (!['minimax', 'edge'].includes(engine)) {
            console.log(`[Voice] ⚠️ 不支持的引擎: ${engine}，可选: minimax, edge`);
            return false;
        }
        if (engine === 'minimax' && !this.minimax) {
            console.log('[Voice] ⚠️ MiniMax 未初始化，无法切换');
            return false;
        }
        this.ttsEngine = engine;
        console.log(`[Voice] 🎙️ TTS 引擎切换为: ${engine}`);
        return true;
    }

    /**
     * 🚨 发送降级通知到 OpenClaw
     */
    async notifyDegradation(fromEngine, toEngine, errorMessage) {
        try {
            const https = require('https');
            const http = require('http');
            
            // 判断错误原因
            let reason = '未知错误';
            let suggestion = '';
            
            if (errorMessage.includes('quota') || errorMessage.includes('balance') || errorMessage.includes('insufficient')) {
                reason = '额度用完';
                suggestion = 'MiniMax API 额度已用完，请前往官网充值续费';
            } else if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT') || errorMessage.includes('ECONNREFUSED')) {
                reason = '网络超时';
                suggestion = '网络连接失败，请检查网络状态';
            } else if (errorMessage.includes('401') || errorMessage.includes('403') || errorMessage.includes('Unauthorized')) {
                reason = 'API Key 无效';
                suggestion = '请检查 API Key 是否正确';
            } else if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
                reason = '请求频率过高';
                suggestion = '触发限流，请稍后再试';
            } else {
                reason = 'API 调用失败';
                suggestion = errorMessage.substring(0, 100);
            }
            
            const message = `🚨 语音引擎降级通知\n\n` +
                          `从 ${fromEngine.toUpperCase()} 降级到 ${toEngine.toUpperCase()}\n` +
                          `原因: ${reason}\n` +
                          `建议: ${suggestion}\n\n` +
                          `时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`;
            
            console.log('[Voice] 📤 发送降级通知到 OpenClaw');
            
            // 发送到 OpenClaw Gateway (desktop-bridge.js 会转发到飞书)
            const payload = JSON.stringify({
                action: 'agent-response',
                text: message
            });
            
            const notifyPort = (this.petConfig && this.petConfig.get('notifyPort')) || 18788;
            const options = {
                hostname: '127.0.0.1',
                port: notifyPort,
                path: '/notify',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(payload)
                }
            };
            
            const req = http.request(options, (res) => {
                console.log(`[Voice] ✅ 降级通知已发送 (状态: ${res.statusCode})`);
            });
            
            req.on('error', (err) => {
                console.error('[Voice] ❌ 降级通知发送失败:', err.message);
            });
            
            req.write(payload);
            req.end();
            
        } catch (err) {
            console.error('[Voice] ❌ notifyDegradation 失败:', err.message);
        }
    }

    /**
     * 🧹 清理临时文件
     */
    async cleanupTempFiles(keepCount = 50) {
        try {
            const files = await fs.readdir(this.tempDir);
            const mp3Files = files.filter(f => f.endsWith('.mp3'));
            
            if (mp3Files.length <= keepCount) {
                return { deleted: 0, freed: 0 };
            }
            
            const fileStats = await Promise.all(
                mp3Files.map(async (file) => {
                    const filePath = path.join(this.tempDir, file);
                    const stat = await fs.stat(filePath);
                    return { file, path: filePath, mtime: stat.mtime, size: stat.size };
                })
            );
            
            fileStats.sort((a, b) => b.mtime - a.mtime);
            const toDelete = fileStats.slice(keepCount);
            
            let deleted = 0;
            let freed = 0;
            
            for (const item of toDelete) {
                try {
                    await fs.unlink(item.path);
                    deleted++;
                    freed += item.size;
                } catch (err) {
                    console.warn('[SmartVoice] 清理临时语音文件失败:', item.path, err?.message || err);
                }
            }
            
            if (deleted > 0) {
                console.log(`🧹 清理语音文件: ${deleted}个, ${(freed / 1024).toFixed(1)}KB`);
            }
            
            return { deleted, freed };
        } catch (err) {
            return { deleted: 0, freed: 0 };
        }
    }
}

module.exports = SmartVoiceSystem;
