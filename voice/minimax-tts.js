// 🎙️ MiniMax Speech TTS 模块
// 调用 MiniMax 开放平台的 Speech 2.5 语音合成 API
const https = require('https');
const http = require('http');
const path = require('path');
const fs = require('fs');

class MiniMaxTTS {
    constructor(options = {}) {
        this.apiKey = options.apiKey || process.env.MINIMAX_API_KEY || '';
        this.model = options.model || 'speech-2.5-turbo-preview';
        this.voiceId = options.voiceId || 'xiaotuantuan_minimax';
        this.speed = options.speed || 1.1;
        this.vol = options.vol || 3.0;
        this.pitch = options.pitch || 0;
        this.emotion = options.emotion || 'happy';  // 默认开心情绪
        this.tempDir = options.tempDir || path.join(__dirname, 'temp');

        this.initTempDir();
    }

    initTempDir() {
        try {
            if (!fs.existsSync(this.tempDir)) {
                fs.mkdirSync(this.tempDir, { recursive: true });
            }
        } catch (err) {
            console.error('[MiniMax TTS] 创建临时目录失败:', err.message);
        }
    }

    /**
     * 🔊 合成语音
     * @param {string} text - 要合成的文本
     * @param {object} options - 选项 { voiceId, emotion, outputFile, speed, pitch }
     * @returns {Promise<string>} 输出文件路径
     */
    async synthesize(text, options = {}) {
        const voiceId = options.voiceId || options.voice || this.voiceId;
        const emotion = options.emotion || this.emotion;
        const speed = options.speed || this.speed;
        const pitch = options.pitch !== undefined ? options.pitch : this.pitch;
        const vol = options.vol || this.vol;
        const outputFile = options.outputFile || path.join(this.tempDir, `minimax_${Date.now()}.mp3`);

        if (!this.apiKey) {
            throw new Error('MiniMax API Key 未设置');
        }

        if (!text || !text.trim()) {
            throw new Error('文本为空');
        }

        const payload = {
            model: this.model,
            text: text.trim(),
            stream: false,
            voice_setting: {
                voice_id: voiceId,
                speed: speed,
                vol: vol,
                pitch: pitch,
                emotion: emotion
            },
            audio_setting: {
                sample_rate: 32000,
                bitrate: 128000,
                format: 'mp3'
            }
        };

        return new Promise((resolve, reject) => {
            const postData = JSON.stringify(payload);
            const urlObj = new URL('https://api.minimaxi.com/v1/t2a_v2');

            const reqOptions = {
                hostname: urlObj.hostname,
                port: 443,
                path: urlObj.pathname,
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                },
                timeout: 60000
            };

            const req = https.request(reqOptions, (res) => {
                let data = '';
                res.on('data', chunk => { data += chunk; });
                res.on('end', () => {
                    try {
                        const resp = JSON.parse(data);
                        const statusCode = resp.base_resp?.status_code;

                        if (statusCode !== 0) {
                            reject(new Error(`MiniMax API error ${statusCode}: ${resp.base_resp?.status_msg}`));
                            return;
                        }

                        if (resp.data && resp.data.audio) {
                            const audioBytes = Buffer.from(resp.data.audio, 'hex');
                            fs.writeFileSync(outputFile, audioBytes);
                            const sizeKB = (audioBytes.length / 1024).toFixed(1);
                            const durationMs = resp.extra_info?.audio_length || 0;
                            console.log(`[MiniMax TTS] ✅ 语音已保存: ${outputFile} (${sizeKB}KB, ${durationMs}ms, emotion=${emotion})`);
                            resolve(outputFile);
                        } else {
                            reject(new Error('MiniMax API 未返回音频数据'));
                        }
                    } catch (parseErr) {
                        reject(new Error(`响应解析失败: ${parseErr.message}`));
                    }
                });
            });

            req.on('error', (err) => {
                reject(new Error(`MiniMax 请求失败: ${err.message}`));
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error('MiniMax 请求超时'));
            });

            req.write(postData);
            req.end();
        });
    }

    /**
     * 🎭 根据文本内容自动选择情绪（增强版 - 更丰富的情感判断）
     */
    static detectEmotion(text) {
        // 😊 开心/兴奋 — 最常用
        if (text.match(/[!！]{2,}|太棒|太厉害|成功|完成|耶|哇|恭喜|开心|棒|好哒|搞定|好的|收到|没问题|可以|漂亮|厉害|优秀|不错|给力|牛|赞|爽|妙|绝|哈哈|嘻嘻|嘿嘿|加油|冲|干得好/)) {
            return 'happy';
        }
        // 😲 惊讶 — 意外发现
        if (text.match(/天哪|居然|不敢相信|竟然|意想不到|没想到|什么|真的吗|哇塞|我靠|卧槽|神了|amazing|wow|omg/i)) {
            return 'surprised';
        }
        // 😢 难过 — 遇到困难
        if (text.match(/呜|难过|失败|抱歉|对不起|不好意思|遗憾|可惜|糟糕|不行|出错|报错|bug|崩了|挂了|凉了/i)) {
            return 'sad';
        }
        // 😨 害怕/紧张 — 紧急情况
        if (text.match(/错误|崩溃|警告|紧急|危险|注意|小心|完蛋|糟了|坏了|出事|不妙/)) {
            return 'fearful';
        }
        // 😠 愤怒 — 生气
        if (text.match(/生气|愤怒|气死|可恶|烦死|讨厌|受不了|太过分|无语|离谱|荒唐/)) {
            return 'angry';
        }
        // 🤢 厌恶
        if (text.match(/恶心|讨厌|烦|垃圾|辣鸡|渣/)) {
            return 'disgusted';
        }
        // 😌 平静/温柔 — 关怀类
        if (text.match(/休息|晚安|睡觉|安静|轻柔|温柔|早安|注意身体|保重|辛苦|慢慢|别急|没事|放心|陪你|在的/)) {
            return 'calm';
        }
        // 默认开心（小K就是开朗的！）
        return 'happy';
    }

    /**
     * 🎭 获取支持的情绪列表
     */
    static getEmotions() {
        return {
            'happy': '😊 高兴',
            'sad': '😢 悲伤',
            'angry': '😠 愤怒',
            'fearful': '😨 害怕',
            'disgusted': '🤢 厌恶',
            'surprised': '😲 惊讶',
            'calm': '😌 平静/中性'
        };
    }

    /**
     * 🎭 获取可用音色列表
     */
    static getVoices() {
        return {
            // 🎤 克隆音色
            'xiaotuantuan_minimax': '🎤 小团团 - MiniMax克隆音色（当前使用）',
            // 系统甜美音色
            'female-tianmei': '甜美女性音色',
            'female-tianmei-jingpin': '甜美女性音色-beta',
            'female-shaonv': '少女音色',
            'female-shaonv-jingpin': '少女音色-beta',
            'diadia_xuemei': '嗲嗲学妹',
            'qiaopi_mengmei': '俏皮萌妹',
            'tianxin_xiaoling': '甜心小玲',
            'lovely_girl': '萌萌女童',
            'Sweet_Girl': 'Sweet Girl',
            'Cute_Elf': 'Cute Elf'
        };
    }
}

module.exports = MiniMaxTTS;
