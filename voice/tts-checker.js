// 🔍 TTS 依赖检测器
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const fs = require('fs');
const path = require('path');

class TTSChecker {
    static getPythonInstallCommand() {
        if (process.platform === 'darwin') {
            return 'brew install python';
        }
        if (process.platform === 'win32') {
            return 'winget install --id Python.Python.3.12 -e';
        }
        return 'sudo apt-get install -y python3 python3-pip || sudo yum install -y python3 python3-pip';
    }

    /**
     * 检测 Python 环境
     */
    static async checkPython() {
        const pythonCmds = ['python', 'python3', 'py'];
        
        for (const cmd of pythonCmds) {
            try {
                const { stdout, stderr } = await execAsync(`${cmd} --version`, { 
                    timeout: 3000, 
                    windowsHide: true 
                });
                const raw = `${stdout || ''} ${stderr || ''}`.trim();
                const verMatch = raw.match(/Python (\d+)\.(\d+)/); const version = verMatch ? verMatch[1] + '.' + verMatch[2] : null;
                if (version && verMatch && (parseInt(verMatch[1]) > 3 || (parseInt(verMatch[1]) === 3 && parseInt(verMatch[2]) >= 6))) {
                    return { 
                        available: true, 
                        command: cmd, 
                        version: version 
                    };
                }
            } catch (e) {
                continue;
            }
        }
        
        return { 
            available: false, 
            error: 'Python 3.6+ 未安装或不在PATH中',
            fix: this.getPythonInstallCommand()
        };
    }
    
    /**
     * 检测 edge-tts 包
     */
    static async checkEdgeTTS(pythonCmd = 'python') {
        try {
            await execAsync(`${pythonCmd} -m edge_tts --version`, { 
                timeout: 3000, 
                windowsHide: true 
            });
            return { available: true };
        } catch (e) {
            return { 
                available: false, 
                error: 'edge-tts 包未安装',
                fix: `${pythonCmd} -m pip install edge-tts`
            };
        }
    }
    
    /**
     * 检测 dashscope 包
     */
    static async checkDashScopePackage(pythonCmd = 'python') {
        try {
            const { stdout } = await execAsync(`${pythonCmd} -c "import dashscope; print(dashscope.__version__)"`, { 
                timeout: 3000, 
                windowsHide: true 
            });
            return { 
                available: true,
                version: stdout.trim()
            };
        } catch (e) {
            return { 
                available: false, 
                error: 'dashscope 包未安装',
                fix: `${pythonCmd} -m pip install dashscope`
            };
        }
    }
    
    /**
     * 检测 MiniMax API 连通性
     */
    static async checkMiniMaxAPI(apiKey) {
        if (!apiKey) {
            return { available: false, error: 'API Key 未配置' };
        }
        
        try {
            const response = await fetch('https://api.minimaxi.com/v1/text/chatcompletion_v2', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'abab6.5s-chat',
                    messages: [{ role: 'user', content: 'test' }]
                }),
                signal: AbortSignal.timeout(5000)
            });
            
            // 401 说明 key 格式对，只是权限问题（可能是 TTS 专用 key）
            if (response.ok || response.status === 401) {
                return { available: true };
            }
            
            return { 
                available: false, 
                error: `HTTP ${response.status}`,
                fix: '请检查 API Key 是否正确'
            };
        } catch (e) {
            return { 
                available: false, 
                error: e.message,
                fix: '请检查网络连接'
            };
        }
    }
    
    /**
     * 检测 DashScope API 连通性
     */
    static async checkDashScopeAPI(apiKey) {
        if (!apiKey) {
            return { available: false, error: 'API Key 未配置' };
        }
        
        try {
            const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'qwen-turbo',
                    input: { prompt: 'test' }
                }),
                signal: AbortSignal.timeout(5000)
            });
            
            if (response.ok || response.status === 401) {
                return { available: true };
            }
            
            return { 
                available: false, 
                error: `HTTP ${response.status}`,
                fix: '请检查 API Key 是否正确'
            };
        } catch (e) {
            return { 
                available: false, 
                error: e.message,
                fix: '请检查网络连接'
            };
        }
    }
    
    /**
     * 检测 temp 目录
     */
    static checkTempDir(tempDir) {
        try {
            // 如果是文件，标记为错误
            if (fs.existsSync(tempDir) && fs.statSync(tempDir).isFile()) {
                return {
                    available: false,
                    error: 'temp 路径是文件而非目录',
                    fix: '将自动修复（删除文件并创建目录）'
                };
            }
            
            // 尝试创建目录
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            
            // 测试写入权限
            const testFile = path.join(tempDir, '.test');
            fs.writeFileSync(testFile, 'test');
            fs.unlinkSync(testFile);
            
            return { available: true };
        } catch (e) {
            return {
                available: false,
                error: `无法创建/写入 temp 目录: ${e.message}`,
                fix: '请检查磁盘空间和权限'
            };
        }
    }
    
    /**
     * 全面检测所有TTS引擎
     */
    static async checkAll(config = {}) {
        const results = {
            python: await this.checkPython(),
            edgeTTS: { available: false },
            dashscopePackage: { available: false },
            minimax: await this.checkMiniMaxAPI(config.minimaxApiKey),
            dashscope: await this.checkDashScopeAPI(config.dashscopeApiKey),
            tempDir: this.checkTempDir(config.tempDir || path.join(__dirname, 'temp'))
        };
        
        // 只有Python可用时才检测 edge-tts 和 dashscope 包
        if (results.python.available) {
            results.edgeTTS = await this.checkEdgeTTS(results.python.command);
            results.dashscopePackage = await this.checkDashScopePackage(results.python.command);
        } else {
            results.edgeTTS.error = 'Python 不可用';
            results.dashscopePackage.error = 'Python 不可用';
        }
        
        // 推荐引擎（按优先级）
        if (results.minimax.available) {
            results.recommended = 'minimax';
            results.recommendedReason = '最佳音质 + 情感控制';
        } else if (results.dashscope.available && results.dashscopePackage.available) {
            results.recommended = 'dashscope';
            results.recommendedReason = '音色克隆 + 高质量';
        } else if (results.edgeTTS.available) {
            results.recommended = 'edge';
            results.recommendedReason = '免费但音质一般';
        } else {
            results.recommended = 'none';
            results.recommendedReason = '⚠️ 无可用TTS引擎';
        }
        
        return results;
    }
    
    /**
     * 一键安装 edge-tts
     */
    static async installEdgeTTS(pythonCmd = 'python') {
        try {
            const { stdout, stderr } = await execAsync(`${pythonCmd} -m pip install edge-tts`, {
                timeout: 60000,
                windowsHide: true
            });
            
            // 验证安装
            const check = await this.checkEdgeTTS(pythonCmd);
            if (check.available) {
                return { success: true, output: stdout };
            } else {
                return { success: false, error: stderr || '安装后验证失败' };
            }
        } catch (e) {
            return { success: false, error: e.message };
        }
    }
    
    /**
     * 一键安装 dashscope
     */
    static async installDashScope(pythonCmd = 'python') {
        try {
            const { stdout, stderr } = await execAsync(`${pythonCmd} -m pip install dashscope`, {
                timeout: 60000,
                windowsHide: true
            });
            
            // 验证安装
            const check = await this.checkDashScopePackage(pythonCmd);
            if (check.available) {
                return { success: true, output: stdout };
            } else {
                return { success: false, error: stderr || '安装后验证失败' };
            }
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    /**
     * 一键安装 Python
     */
    static async installPython() {
        const installCmd = this.getPythonInstallCommand();

        try {
            if (process.platform === 'darwin') {
                await execAsync('brew --version', { timeout: 5000, windowsHide: true });
                await execAsync(installCmd, {
                    timeout: 300000,
                    windowsHide: true
                });
            } else if (process.platform === 'win32') {
                await execAsync(installCmd, {
                    timeout: 300000,
                    windowsHide: true
                });
            } else {
                await execAsync(installCmd, {
                    timeout: 300000,
                    windowsHide: true
                });
            }

            const check = await this.checkPython();
            if (check.available) {
                return { success: true, command: check.command, version: check.version };
            }

            return { success: false, error: '安装完成，但仍未检测到 Python', fix: installCmd };
        } catch (e) {
            const prefix = process.platform === 'darwin'
                ? '自动安装失败，请先确认 Homebrew 已安装'
                : '自动安装失败';
            return { success: false, error: `${prefix}: ${e.message}`, fix: installCmd };
        }
    }
}

module.exports = TTSChecker;
