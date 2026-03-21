/**
 * ExpressionEngine — 待机微表情 & 眨眼 & 眼神游走引擎
 *
 * 从 index.html 中提取出来的行为驱动系统，与渲染器解耦。
 * 通过 renderer.playExpression() 接口驱动任何类型的渲染器。
 */
class ExpressionEngine {
    /**
     * @param {PetRenderer} renderer — 渲染器实例（CssFluidRenderer 或 SpriteRenderer）
     */
    constructor(renderer) {
        this.renderer = renderer;
        this._blinkTimer = null;
        this._idleTimer = null;
        this._eyeDriftTimer = null;
        this._intervals = [];
        this._stopped = false;

        // 语气状态（从 AI 回复检测）
        this.lastTone = 'neutral';
    }

    /**
     * 启动所有自动行为
     */
    start() {
        this._stopped = false;
        this._scheduleBlink();
        this._startIdleActions();
        this._startEyeDrift();
    }

    /**
     * 停止所有自动行为
     */
    stop() {
        this._stopped = true;
        if (this._blinkTimer) clearTimeout(this._blinkTimer);
        if (this._idleTimer) clearInterval(this._idleTimer);
        if (this._eyeDriftTimer) clearInterval(this._eyeDriftTimer);
        this._intervals.forEach(id => clearInterval(id));
        this._intervals = [];
        this.renderer = null; // 断开引用，防止泄漏
    }

    // ==================== 眨眼 ====================

    _scheduleBlink() {
        if (this._stopped) return;
        const base = Math.random() < 0.2
            ? 800 + Math.random() * 1500
            : 2500 + Math.random() * 5000;

        this._blinkTimer = setTimeout(() => this._doBlink(), base);
    }

    _doBlink() {
        if (this._stopped || !this.renderer) return;
        const mood = this.renderer.currentMood;
        if (mood === 'sleepy' || mood === 'happy') {
            this._scheduleBlink();
            return;
        }

        this.renderer._mouseTracking = false;
        this.renderer.playExpression('blink');

        const r = Math.random();
        if (r < 0.15) {
            // 连眨两下
            setTimeout(() => {
                this.renderer.playExpression('normal');
                setTimeout(() => {
                    this.renderer.playExpression('blink');
                    setTimeout(() => {
                        this.renderer.applyMoodEyes();
                        this.renderer._mouseTracking = true;
                    }, 70);
                }, 100);
            }, 70);
        } else if (r < 0.3) {
            // 半眨 → 全眨
            setTimeout(() => {
                this.renderer.playExpression('halfBlink');
                setTimeout(() => {
                    this.renderer.playExpression('blink');
                    setTimeout(() => {
                        this.renderer.applyMoodEyes();
                        this.renderer._mouseTracking = true;
                    }, 80);
                }, 120);
            }, 70 + Math.random() * 40);
        } else if (r < 0.4) {
            // 慢眨
            setTimeout(() => {
                this.renderer.playExpression('halfBlink');
                setTimeout(() => {
                    this.renderer.applyMoodEyes();
                    this.renderer._mouseTracking = true;
                }, 250 + Math.random() * 150);
            }, 120);
        } else {
            // 正常快速眨
            setTimeout(() => {
                this.renderer.applyMoodEyes();
                this.renderer._mouseTracking = true;
            }, 70 + Math.random() * 30);
        }

        this._scheduleBlink();
    }

    // ==================== 待机微表情 ====================

    _startIdleActions() {
        this._idleTimer = setInterval(() => {
            if (this._stopped || !this.renderer) return;
            if (this.renderer.currentMood !== 'idle' || !this.renderer._mouseTracking) return;

            const idleTime = (Date.now() - this.renderer.lastInteraction) / 1000;

            // 无聊渐进
            if (idleTime > 180 && Math.random() < 0.25) {
                this._playBoredAction();
                return;
            }
            if (idleTime > 60 && Math.random() < 0.3) {
                this._playRestlessAction();
                return;
            }

            // 常规微表情
            if (Math.random() < 0.3) {
                this.renderer._mouseTracking = false;
                this._pickIdleAction()();
                setTimeout(() => { this.renderer._mouseTracking = true; }, 1500);
            }
        }, 4000);
    }

    // ==================== 眼神游走 ====================

    _startEyeDrift() {
        this._eyeDriftTimer = setInterval(() => {
            if (this._stopped || !this.renderer) return;
            if (this.renderer.currentMood !== 'idle' || !this.renderer._mouseTracking) return;
            if (Math.random() < 0.35) {
                const eyes = this.renderer.getEyes?.();
                if (!eyes?.left || !eyes?.right) return;

                const dx = (Math.random() - 0.5) * 4;
                const dy = (Math.random() - 0.5) * 3;
                eyes.left.style.transition = 'transform 0.8s ease';
                eyes.right.style.transition = 'transform 0.8s ease';
                eyes.left.style.transform = `translate(${dx}px,${dy}px)`;
                eyes.right.style.transform = `translate(${dx}px,${dy}px)`;
                setTimeout(() => {
                    eyes.left.style.transition = 'transform 1.2s ease';
                    eyes.right.style.transition = 'transform 1.2s ease';
                    eyes.left.style.transform = '';
                    eyes.right.style.transform = '';
                    setTimeout(() => {
                        eyes.left.style.transition = '';
                        eyes.right.style.transition = '';
                    }, 1200);
                }, 1500 + Math.random() * 2000);
            }
        }, 5000);
    }

    // ==================== 无聊行为 ====================

    _playBoredAction() {
        this.renderer._mouseTracking = false;
        const r = Math.random();
        const R = this.renderer;

        if (r < 0.4) {
            // 打哈欠
            R.playExpression('wow');
            const s = R._targetScale;
            R._targetScale = 1.06;
            setTimeout(() => { R.playExpression('sleepy'); R._targetScale = s; }, 800);
            setTimeout(() => R.playExpression('drowsy'), 1500);
            setTimeout(() => { R.applyMoodEyes(); R._mouseTracking = true; }, 2500);
        } else if (r < 0.7) {
            // 伸懒腰
            const s = R._targetScale;
            R.playExpression('sleepy');
            R._targetScale = 1.1;
            setTimeout(() => { R._targetScale = 0.92; }, 600);
            setTimeout(() => { R._targetScale = 1.06; R.playExpression('surprised'); }, 900);
            setTimeout(() => { R._targetScale = s; R.applyMoodEyes(); R._mouseTracking = true; }, 1400);
        } else {
            // 发呆
            R.playExpression('drowsy');
            setTimeout(() => R.playExpression('halfBlink'), 1200);
            setTimeout(() => R.playExpression('blink'), 2000);
            setTimeout(() => R.playExpression('curious'), 2200);
            setTimeout(() => { R.applyMoodEyes(); R._mouseTracking = true; }, 2800);
        }
    }

    _playRestlessAction() {
        this.renderer._mouseTracking = false;
        const r = Math.random();
        const R = this.renderer;

        if (r < 0.3) {
            R._deepBreathPhase = 0.01;
            R.playExpression('halfBlink');
            setTimeout(() => { R.applyMoodEyes(); R._mouseTracking = true; }, 1500);
        } else if (r < 0.6) {
            R.playExpression('lookLeft');
            setTimeout(() => R.playExpression('lookUp'), 500);
            setTimeout(() => R.playExpression('lookRight'), 1000);
            setTimeout(() => R.playExpression('hmm'), 1500);
            setTimeout(() => { R.applyMoodEyes(); R._mouseTracking = true; }, 2200);
        } else {
            R.playExpression('hmm');
            const s = R._targetScale;
            R._targetScale = 0.97;
            setTimeout(() => { R._targetScale = s; R.playExpression('blink'); }, 1000);
            setTimeout(() => { R.applyMoodEyes(); R._mouseTracking = true; }, 1300);
        }
    }

    // ==================== 动作池 & 智能选择 ====================

    /** 从 AI 回复文本中检测语气 */
    detectTone(text) {
        if (!text) return 'neutral';
        if (/哈哈|嘻嘻|😄|😆|笑|开心|太好了|棒|厉害|不错|好耶/.test(text)) return 'cheerful';
        if (/害羞|脸红|嘿嘿|😳|😊|人家/.test(text)) return 'shy';
        if (/生气|可恶|气死|哼|😠|😤|讨厌/.test(text)) return 'annoyed';
        if (/难过|伤心|唉|😢|😭|呜呜|抱歉|对不起/.test(text)) return 'sad';
        if (/好奇|为什么|怎么|吗？|呢？|🤔|想想/.test(text)) return 'curious';
        if (/加油|冲|💪|努力|一定可以|相信/.test(text)) return 'encourage';
        if (/困|累|😴|哈欠|想睡|好困/.test(text)) return 'tired';
        if (/惊|天哪|什么|😱|😮|不会吧|哇/.test(text)) return 'surprised';
        if (/嗯|好的|了解|明白|知道了|收到/.test(text)) return 'calm';
        return 'neutral';
    }

    _getTimeScene() {
        const h = new Date().getHours();
        if (h >= 6 && h < 11) return 'morning';
        if (h >= 11 && h < 14) return 'noon';
        if (h >= 14 && h < 18) return 'afternoon';
        if (h >= 18 && h < 22) return 'evening';
        return 'latenight';
    }

    _pickIdleAction() {
        const R = this.renderer;
        const scene = this._getTimeScene();
        const tonePool = this._TONE_MAP[this.lastTone];

        // 语气优先
        if (tonePool && this._ACT[tonePool] && Math.random() < 0.7) {
            this.lastTone = 'neutral';
            const pool = this._ACT[tonePool];
            return pool[Math.floor(Math.random() * pool.length)];
        }

        // 时间场景加权
        const weights = this._SCENE_WEIGHTS[scene] || this._SCENE_WEIGHTS.afternoon;
        const entries = [];
        for (const [cat, w] of Object.entries(weights)) {
            if (this._ACT[cat]) {
                for (let i = 0; i < w; i++) entries.push(cat);
            }
        }
        const cat = entries[Math.floor(Math.random() * entries.length)] || 'daily';
        const pool = this._ACT[cat] || this._ACT.daily;
        return pool[Math.floor(Math.random() * pool.length)];
    }

    get _TONE_MAP() {
        return {
            cheerful: 'happy', shy: 'shy', annoyed: 'annoyed', sad: 'sad',
            curious: 'thinking', encourage: 'encourage', tired: 'sleepy',
            surprised: 'surprised', calm: 'dreamy', neutral: null,
        };
    }

    get _SCENE_WEIGHTS() {
        return {
            morning:   { sleepy: 4, daily: 3, dreamy: 2, shy: 1, thinking: 1 },
            noon:      { daily: 3, happy: 2, playful: 2, thinking: 1, sleepy: 1 },
            afternoon: { daily: 3, thinking: 2, happy: 1, dreamy: 1, playful: 1, encourage: 1 },
            evening:   { daily: 2, happy: 2, dreamy: 2, shy: 1, sleepy: 2 },
            latenight: { sleepy: 5, dreamy: 2, daily: 1, dizzy: 2, sad: 1 },
        };
    }

    /**
     * 内置动作池 — 使用 renderer API 驱动
     * 每个动作是一个返回 void 的函数
     */
    get _ACT() {
        const R = this.renderer;
        const expr = (name) => R.playExpression(name);
        const moodEyes = () => R.applyMoodEyes();
        const blush = R.getBlush?.() || {};

        return {
            daily: [
                () => { expr('lookLeft'); setTimeout(() => { expr('lookRight'); setTimeout(() => expr('normal'), 500); }, 500); },
                () => { expr('curious'); setTimeout(() => expr('normal'), 800); },
                () => { expr('wink'); setTimeout(() => expr('normal'), 700); },
                () => { expr('winkR'); setTimeout(() => expr('normal'), 700); },
                () => { expr('hmm'); setTimeout(() => expr('normal'), 800); },
                () => { expr('sparkle'); setTimeout(() => expr('normal'), 500); },
                () => { expr('blink'); setTimeout(() => expr('normal'), 80); setTimeout(() => expr('blink'), 250); setTimeout(() => expr('normal'), 330); },
                () => { expr('lookLeft'); setTimeout(() => expr('lookRight'), 200); setTimeout(() => expr('lookLeft'), 400); setTimeout(() => expr('lookRight'), 600); setTimeout(() => expr('normal'), 800); },
                () => { expr('blank'); setTimeout(() => { expr('blink'); setTimeout(() => { expr('surprised'); setTimeout(() => expr('normal'), 300); }, 100); }, 1200); },
                () => { expr('softSmile'); setTimeout(() => expr('normal'), 1000); },
                () => { expr('focus'); setTimeout(() => { expr('curious'); setTimeout(() => expr('normal'), 500); }, 800); },
            ],
            happy: [
                () => { expr('happy'); setTimeout(() => expr('normal'), 1000); },
                () => { expr('giggle'); setTimeout(() => expr('normal'), 800); },
                () => { expr('superHappy'); const s = R._targetScale; R._targetScale = 1.1; setTimeout(() => { R._targetScale = 0.93; }, 200); setTimeout(() => { R._targetScale = s; expr('happy'); }, 800); setTimeout(() => expr('normal'), 1200); },
                () => { expr('smug'); setTimeout(() => { expr('giggle'); setTimeout(() => expr('normal'), 600); }, 700); },
                () => { expr('content'); R._deepBreathPhase = 0.01; setTimeout(() => { expr('softSmile'); setTimeout(() => expr('normal'), 800); }, 600); },
            ],
            shy: [
                () => { expr('happy'); if (blush.left) { blush.left.style.background = 'rgba(255,100,100,0.5)'; blush.right.style.background = 'rgba(255,100,100,0.5)'; } setTimeout(() => { expr('normal'); if (blush.left) { blush.left.style.background = ''; blush.right.style.background = ''; } }, 1200); },
                () => { expr('squint'); setTimeout(() => expr('lookDown'), 400); setTimeout(() => { expr('normal'); }, 1000); },
            ],
            thinking: [
                () => { expr('thinking'); setTimeout(() => expr('normal'), 800); },
                () => { expr('hmm'); setTimeout(() => { expr('thinking'); setTimeout(() => expr('normal'), 600); }, 500); },
                () => { expr('curious'); setTimeout(() => { expr('hmm'); setTimeout(() => expr('normal'), 600); }, 500); },
                () => { expr('confused'); setTimeout(() => { expr('thinking'); setTimeout(() => { expr('sparkle'); setTimeout(() => expr('normal'), 400); }, 500); }, 600); },
                () => { expr('daydream'); setTimeout(() => { expr('blink'); setTimeout(() => { expr('surprised'); setTimeout(() => expr('normal'), 300); }, 100); }, 1500); },
            ],
            surprised: [
                () => { expr('surprised'); setTimeout(() => expr('normal'), 600); },
                () => { expr('wow'); setTimeout(() => { expr('curious'); setTimeout(() => expr('normal'), 600); }, 500); },
            ],
            sleepy: [
                () => { expr('drowsy'); setTimeout(() => { expr('sleepy'); setTimeout(() => { expr('surprised'); setTimeout(() => expr('normal'), 300); }, 600); }, 400); },
                () => { expr('halfBlink'); setTimeout(() => expr('sleepy'), 500); setTimeout(() => expr('halfBlink'), 1200); setTimeout(() => expr('drowsy'), 1700); setTimeout(() => expr('normal'), 2200); },
            ],
            sad: [
                () => { expr('sad'); setTimeout(() => { expr('drowsy'); setTimeout(() => { expr('normal'); setTimeout(() => expr('happy'), 200); setTimeout(() => expr('normal'), 700); }, 400); }, 600); },
                () => { expr('worried'); R._deepBreathPhase = 0.01; setTimeout(() => { expr('sad'); setTimeout(() => { expr('blink'); setTimeout(() => { expr('softSmile'); setTimeout(() => expr('normal'), 500); }, 100); }, 700); }, 800); },
            ],
            annoyed: [
                () => { expr('angry'); const s = R._targetScale; R._targetScale = 1.05; setTimeout(() => R._targetScale = 0.95, 200); setTimeout(() => R._targetScale = 1.05, 400); setTimeout(() => { R._targetScale = s; expr('hmm'); }, 600); setTimeout(() => expr('normal'), 1000); },
                () => { expr('lookUp'); setTimeout(() => { expr('lookDown'); setTimeout(() => { expr('blink'); setTimeout(() => expr('normal'), 200); }, 300); }, 300); },
            ],
            encourage: [
                () => { expr('sparkle'); const s = R._targetScale; R._targetScale = 1.08; setTimeout(() => { R._targetScale = s; expr('superHappy'); }, 400); setTimeout(() => expr('normal'), 900); },
                () => { expr('happy'); setTimeout(() => { expr('superHappy'); setTimeout(() => { expr('giggle'); setTimeout(() => expr('normal'), 500); }, 400); }, 300); },
            ],
            playful: [
                () => { expr('mischief'); setTimeout(() => { expr('wink'); setTimeout(() => { expr('giggle'); setTimeout(() => expr('normal'), 500); }, 400); }, 600); },
                () => { expr('peekL'); setTimeout(() => { expr('surprised'); setTimeout(() => { expr('nervous'); setTimeout(() => { expr('blink'); setTimeout(() => expr('normal'), 100); }, 300); }, 300); }, 800); },
            ],
            dreamy: [
                () => { expr('daydream'); setTimeout(() => { expr('softSmile'); setTimeout(() => expr('normal'), 800); }, 1200); },
                () => { expr('blank'); R._deepBreathPhase = 0.01; setTimeout(() => { expr('daydream'); setTimeout(() => { expr('content'); setTimeout(() => expr('normal'), 600); }, 1000); }, 800); },
            ],
            dizzy: [
                () => { expr('dizzy'); const s = R._targetScale; R._targetScale = 0.95; setTimeout(() => R._targetScale = 1.03, 200); setTimeout(() => R._targetScale = 0.97, 400); setTimeout(() => { R._targetScale = s; expr('halfBlink'); }, 600); setTimeout(() => expr('normal'), 900); },
            ],
            smug: [
                () => { expr('blink'); setTimeout(() => { expr('hmm'); setTimeout(() => expr('normal'), 600); }, 300); },
                () => { expr('mischief'); setTimeout(() => { expr('sly'); setTimeout(() => { expr('smug'); setTimeout(() => expr('normal'), 500); }, 500); }, 500); },
            ],
        };
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExpressionEngine;
} else if (typeof window !== 'undefined') {
    window.ExpressionEngine = ExpressionEngine;
}
