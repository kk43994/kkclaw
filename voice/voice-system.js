// 语音系统模块 - 使用 Windows TTS
const path = require('path');
const fs = require('fs').promises;
const { spawn } = require('child_process');

class VoiceSystem {
    constructor() {
        this.isSupported = true;
        this.isSpeaking = false;
        this.currentProcess = null;
        this.tempDir = path.join(__dirname, 'temp');
        this.initTempDir();
    }

    async initTempDir() {
        try {
            await fs.mkdir(this.tempDir, { recursive: true });
        } catch (err) {
            console.error('创建临时目录失败:', err);
        }
    }

    // 安全转义文本，防止命令注入
    sanitizeText(text) {
        if (!text || typeof text !== 'string') return '';
        // 移除或转义危险字符
        return text
            .replace(/[`$\\]/g, '')     // 移除反引号、美元符号、反斜杠
            .replace(/"/g, "'")          // 双引号替换为单引号
            .replace(/[\r\n]/g, ' ')     // 换行替换为空格
            .replace(/[<>|&;(){}[\]]/g, '') // 移除其他危险字符
            .substring(0, 500);          // 限制长度
    }

    async speak(text) {
        if (this.isSpeaking) {
            console.log('正在播放,跳过');
            return;
        }

        const safeText = this.sanitizeText(text);
        if (!safeText) {
            console.log('文本为空,跳过');
            return;
        }

        try {
            this.isSpeaking = true;

            // 使用 Windows 自带的 TTS
            if (process.platform === 'win32') {
                await this.speakWindows(safeText);
            } else if (process.platform === 'darwin') {
                await this.speakMac(safeText);
            } else {
                console.log('当前平台不支持语音');
            }
        } catch (err) {
            console.error('语音播放失败:', err);
        } finally {
            this.isSpeaking = false;
            this.currentProcess = null;
        }
    }

    async speakWindows(text) {
        return new Promise((resolve, reject) => {
            // 使用 PowerShell 脚本文件方式，更安全
            const psScript = `
Add-Type -AssemblyName System.Speech
$speak = New-Object System.Speech.Synthesis.SpeechSynthesizer
$speak.Rate = 2
$speak.Volume = 80
$speak.Speak('${text.replace(/'/g, "''")}')
            `.trim();

            this.currentProcess = spawn('powershell', ['-Command', psScript], {
                windowsHide: true
            });

            const timeout = setTimeout(() => {
                if (this.currentProcess) {
                    this.currentProcess.kill();
                    reject(new Error('语音超时'));
                }
            }, 15000);

            this.currentProcess.on('close', (code) => {
                clearTimeout(timeout);
                this.currentProcess = null;
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`PowerShell 退出码: ${code}`));
                }
            });

            this.currentProcess.on('error', (err) => {
                clearTimeout(timeout);
                this.currentProcess = null;
                reject(err);
            });
        });
    }

    async speakMac(text) {
        return new Promise((resolve, reject) => {
            this.currentProcess = spawn('say', ['-r', '200', text]);

            this.currentProcess.on('close', (code) => {
                this.currentProcess = null;
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`say 命令退出码: ${code}`));
                }
            });

            this.currentProcess.on('error', (err) => {
                this.currentProcess = null;
                reject(err);
            });
        });
    }

    // 简单的语音识别 (需要用户手动输入,未来可以集成真正的 STT)
    async listen() {
        // TODO: 集成 Web Speech API 或其他 STT 服务
        return null;
    }

    stop() {
        this.isSpeaking = false;
        if (this.currentProcess) {
            this.currentProcess.kill();
            this.currentProcess = null;
        }
    }
}

module.exports = VoiceSystem;
