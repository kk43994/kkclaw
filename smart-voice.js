// 🎙️ 智能语音播报系统 - 增强版
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const path = require('path');
const fs = require('fs').promises;

class SmartVoiceSystem {
    constructor() {
        this.isSpeaking = false;
        this.tempDir = path.join(__dirname, 'temp');
        this.voice = 'zh-CN-XiaoxiaoNeural';  // 默认晓晓
        this.enabled = true;
        this.queue = [];
        this.maxQueueSize = 10;
        this.lastSpoken = '';
        this.lastSpokenTime = 0;
        
        // 🎭 情境模式
        this.contextMode = 'normal';  // normal, excited, calm, urgent
        
        // 📊 统计数据
        this.stats = {
            totalSpoken: 0,
            totalSkipped: 0,
            totalQueued: 0,
            avgDuration: 0
        };
        
        this.initTempDir();
    }

    async initTempDir() {
        try {
            await fs.mkdir(this.tempDir, { recursive: true });
        } catch (err) {}
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
        if (text.match(/🔥|紧急|错误|崩溃|失败/)) {
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
                config.rate = '+20%';   // 快一点
                config.pitch = '+50Hz'; // 高一点
                break;
            case 'urgent':
                config.rate = '+10%';
                config.voice = 'zh-CN-YunxiNeural';  // 换男声，更有力
                break;
            case 'calm':
                config.rate = '-10%';   // 慢一点
                break;
            case 'happy':
                config.pitch = '+30Hz';
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
            
            // Edge TTS 命令（带语速和音调）
            let ttsCmd = `python -m edge_tts --voice "${voiceConfig.voice}" --text "${cleanText.replace(/"/g, '').replace(/\n/g, ' ')}" --write-media "${outputFile}"`;
            
            if (voiceConfig.rate !== '+0%') {
                ttsCmd += ` --rate="${voiceConfig.rate}"`;
            }
            if (voiceConfig.pitch !== '+0Hz') {
                ttsCmd += ` --pitch="${voiceConfig.pitch}"`;
            }
            
            await execAsync(ttsCmd, { timeout: 15000 });
            
            // PowerShell 播放
            const playCmd = `powershell -c "Add-Type -AssemblyName presentationCore; $mp = New-Object System.Windows.Media.MediaPlayer; $mp.Open('${outputFile}'); $mp.Play(); while($mp.NaturalDuration.HasTimeSpan -eq $false) { Start-Sleep -Milliseconds 100 }; $duration = $mp.NaturalDuration.TimeSpan.TotalSeconds; Start-Sleep -Seconds $duration; $mp.Close()"`;
            
            await execAsync(playCmd, { timeout: 60000 });
            
            const duration = (Date.now() - startTime) / 1000;
            this.stats.avgDuration = (this.stats.avgDuration * (this.stats.totalSpoken - 1) + duration) / this.stats.totalSpoken;
            
            console.log(`✅ 播放完成 (${duration.toFixed(1)}秒)`);
            
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
        
        // 特殊符号清理
        cleaned = cleaned.replace(/[【】\[\]{}「」_~#@]/g, '');
        
        // 长度限制
        if (cleaned.length > 300) {
            cleaned = cleaned.substring(0, 300) + '，等共' + cleaned.length + '字';
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
                } catch (err) {}
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
