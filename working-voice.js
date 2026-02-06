// 18:04 能听到声音的版本
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const path = require('path');
const fs = require('fs').promises;

class WorkingVoice {
    constructor() {
        this.isSpeaking = false;
        this.tempDir = path.join(__dirname, 'temp');
        this.voice = 'zh-CN-XiaoxiaoNeural';
        this.edgeTtsPath = 'C:\\Users\\zhouk\\AppData\\Roaming\\Python\\Python313\\Scripts\\edge-tts.exe';
        this.initTempDir();
    }

    async initTempDir() {
        try {
            await fs.mkdir(this.tempDir, { recursive: true });
        } catch (err) {}
    }

    async speak(text) {
        if (this.isSpeaking) {
            console.log('⏭️ 跳过 (正在播放)');
            return;
        }

        this.isSpeaking = true;
        const startTime = Date.now();
        
        try {
            // 清理文本: 移除emoji和特殊符号
            const cleanText = this.cleanTextForSpeech(text);
            
            if (!cleanText.trim()) {
                console.log('⚠️ 清理后文本为空,跳过播放');
                return;
            }
            
            // 生成语音文件
            const outputFile = path.join(this.tempDir, 'speech.mp3');
            console.log('🔊 生成语音:', cleanText.substring(0, 30));
            const genCmd = `"${this.edgeTtsPath}" --voice "${this.voice}" --text "${cleanText.replace(/"/g, '').replace(/\n/g, ' ')}" --write-media "${outputFile}"`;
            
            await execAsync(genCmd, { timeout: 10000 });
            console.log('✅ 语音文件生成');
            
            // PowerShell MediaPlayer 播放
            const playCmd = `powershell -c "Add-Type -AssemblyName presentationCore; $mp = New-Object System.Windows.Media.MediaPlayer; $mp.Open('${outputFile}'); $mp.Play(); while($mp.NaturalDuration.HasTimeSpan -eq $false) { Start-Sleep -Milliseconds 100 }; $duration = $mp.NaturalDuration.TimeSpan.TotalSeconds; Start-Sleep -Seconds $duration; $mp.Close()"`;
            
            await execAsync(playCmd, { timeout: 60000 });
            
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            console.log(`✅ 播放完成 (${elapsed}秒)`);
            
        } catch (err) {
            console.error('Edge TTS失败:', err.message);
        } finally {
            this.isSpeaking = false;
            console.log('🔓 语音系统已解锁');
        }
    }

    cleanTextForSpeech(text) {
        // 移除emoji (Unicode范围)
        let cleaned = text.replace(/[\u{1F600}-\u{1F64F}]/gu, '') // 表情符号
                         .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // 杂项符号和象形文字
                         .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // 交通和地图符号
                         .replace(/[\u{1F700}-\u{1F77F}]/gu, '') // 炼金术符号
                         .replace(/[\u{1F780}-\u{1F7FF}]/gu, '') // 几何形状扩展
                         .replace(/[\u{1F800}-\u{1F8FF}]/gu, '') // 补充箭头-C
                         .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // 补充符号和象形文字
                         .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '') // 国际象棋符号
                         .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '') // 符号和象形文字扩展-A
                         .replace(/[\u{2600}-\u{26FF}]/gu, '')   // 杂项符号
                         .replace(/[\u{2700}-\u{27BF}]/gu, '');  // 装饰符号
        
        // 替换常见的特殊标记
        cleaned = cleaned.replace(/✅/g, '完成')
                         .replace(/❌/g, '失败')
                         .replace(/⚙️/g, '')
                         .replace(/🚀/g, '开始')
                         .replace(/📢/g, '')
                         .replace(/💡/g, '')
                         .replace(/🔧/g, '')
                         .replace(/📝/g, '');
        
        // 清理多余空格
        cleaned = cleaned.replace(/\s+/g, ' ').trim();
        
        return cleaned;
    }

    async fallback(text) {
        const ps = `Add-Type -AssemblyName System.Speech; $s = New-Object System.Speech.Synthesis.SpeechSynthesizer; $s.Rate = 1; $s.Speak("${text.replace(/"/g, '`"')}")`;
        try {
            await execAsync(`powershell -Command "${ps}"`, { timeout: 10000 });
        } catch (e) {}
    }
}

module.exports = WorkingVoice;
