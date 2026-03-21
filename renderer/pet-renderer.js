/**
 * PetRenderer — 宠物渲染器抽象基类
 *
 * 所有具体渲染器（CssFluidRenderer, SpriteRenderer 等）必须继承此类
 * 并实现 _buildDOM(), _applyMoodVisuals(), _applyExpression(), _startLoop(), _stopLoop()
 */
class PetRenderer {
    /**
     * @param {HTMLElement} container — DOM 容器（宠物挂载点）
     * @param {object} theme — 经过 ThemeLoader.load() 校验的主题对象
     */
    constructor(container, theme) {
        if (!container) throw new Error('PetRenderer: container is required');
        if (!theme) throw new Error('PetRenderer: theme is required');

        this.container = container;
        this.theme = theme;

        // 公共状态
        this.currentMood = 'idle';
        this._running = false;
        this._animFrameId = null;
        this._moodTimer = null;

        // 动画时间轴
        this._t = 0;
        this._targetScale = 1;
        this._curScale = 1;
        this._breathExtra = 0;
        this._squishing = false;
        this._deepBreathPhase = 0;
        this._fidgetSeed = Math.random() * 100;

        // 互动追踪
        this.lastInteraction = Date.now();
        this._mouseTracking = true;

        // 由子类实现
        this._petElement = null;       // 宠物主 DOM 元素
        this._particlesEl = null;      // 粒子容器
    }

    // ==================== 公共 API ====================

    /**
     * 初始化渲染器：构建 DOM + 启动动画循环
     */
    init() {
        this._buildDOM();
        this._bindEvents();
        this.startLoop();
    }

    /**
     * 切换情绪
     * @param {string} mood
     */
    setMood(mood) {
        const map = { normal: 'idle', busy: 'talking', excited: 'happy' };
        mood = map[mood] || mood;
        if (!this.theme.moods[mood]) mood = 'idle';

        this.lastInteraction = Date.now();

        const m = this.theme.moods[mood];
        const prevMood = this.currentMood;
        this.currentMood = mood;

        this._targetScale = m.scale || 1;
        this._breathExtra = m.bounce || 0;
        this._mouseTracking = (mood !== 'sleepy' && mood !== 'happy' && mood !== 'sad');

        // 子类实现具体视觉切换（渐变色/帧动画等）
        this._applyMoodVisuals(mood, prevMood, m);
    }

    /**
     * 播放指定表情
     * @param {string} name — 表情名（如 "happy", "blink", "wink" 等）
     */
    playExpression(name) {
        this._applyExpression(name);
    }

    /**
     * 应用当前情绪的默认眼睛表情
     */
    applyMoodEyes() {
        const m = this.theme.moods[this.currentMood];
        if (m && m.eyes) {
            this._applyExpression(m.eyes);
        }
    }

    /**
     * 启动 60fps 动画主循环
     */
    startLoop() {
        if (this._running) return;
        this._running = true;
        this._loop();
        this._startDeepBreathTimer();
    }

    /**
     * 停止动画
     */
    stopLoop() {
        this._running = false;
        if (this._animFrameId) {
            cancelAnimationFrame(this._animFrameId);
            this._animFrameId = null;
        }
        if (this._deepBreathInterval) {
            clearInterval(this._deepBreathInterval);
            this._deepBreathInterval = null;
        }
    }

    /**
     * 设置缩放
     */
    setScale(s) {
        this._targetScale = s;
    }

    /**
     * 获取宠物的主 DOM 元素（用于外部绑定拖拽等）
     */
    getElement() {
        return this._petElement;
    }

    /**
     * 生成点击粒子效果
     */
    spawnParticles() {
        const deco = this.theme.decorations?.particles;
        if (!deco || !this._particlesEl) return;

        const colors = deco.colors || ['#fff'];
        const count = deco.count || 8;
        const minDist = deco.distance?.min || 15;
        const maxDist = deco.distance?.max || 40;
        const minSz = deco.sizeRange?.min || 2;
        const maxSz = deco.sizeRange?.max || 5;

        for (let i = 0; i < count; i++) {
            const p = document.createElement('div');
            const sz = minSz + Math.random() * (maxSz - minSz);
            const a = (Math.PI * 2 / count) * i + Math.random() * 0.4;
            const dist = minDist + Math.random() * (maxDist - minDist);
            p.style.cssText = `position:absolute;border-radius:50%;pointer-events:none;
                width:${sz}px;height:${sz}px;
                background:${colors[Math.floor(Math.random() * colors.length)]};
                left:50%;top:50%;opacity:1;
                transition:transform 0.4s ease-out,opacity 0.4s ease-out;`;
            this._particlesEl.appendChild(p);
            requestAnimationFrame(() => {
                p.style.transform = `translate(${Math.cos(a) * dist}px,${Math.sin(a) * dist}px)`;
                p.style.opacity = '0';
            });
            setTimeout(() => p.remove(), 450);
        }
    }

    /**
     * 播放点击弹跳动画
     */
    squish() {
        this._squishing = true;
        if (this._petElement) {
            this._petElement.style.animation = 'squish 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)';
            this._petElement.style.filter = 'brightness(1.15)';
        }
        setTimeout(() => {
            if (this._petElement) {
                this._petElement.style.animation = '';
                this._petElement.style.filter = '';
            }
            this._squishing = false;
        }, 350);
    }

    /**
     * 销毁渲染器，清理所有资源
     */
    destroy() {
        this.stopLoop();
        if (this._petElement && this._petElement.parentNode) {
            this._petElement.parentNode.removeChild(this._petElement);
        }
        this._petElement = null;
        this._particlesEl = null;
    }

    // ==================== 内部方法 ====================

    /**
     * 主动画循环 — 基于主题的动画参数驱动浮动/呼吸/微动
     */
    _loop() {
        if (!this._running) return;

        this._t += 0.016;
        this._curScale += (this._targetScale - this._curScale) * 0.08;

        const anim = this.theme.animation || {};

        // 浮动
        let floatY = 0;
        const floatFreqs = anim.float?.frequencies || [1.3, 0.67, 2.3];
        const floatAmps = anim.float?.amplitudes || [3.5, 2, 0.6];
        for (let i = 0; i < floatFreqs.length; i++) {
            floatY += Math.sin(this._t * floatFreqs[i]) * (floatAmps[i] || 0);
        }

        // 旋转浮动
        let floatR = 0;
        const rotFreqs = anim.rotation?.frequencies || [0.9, 0.37];
        const rotAmps = anim.rotation?.amplitudes || [0.3, 0.2];
        for (let i = 0; i < rotFreqs.length; i++) {
            floatR += Math.sin(this._t * rotFreqs[i]) * (rotAmps[i] || 0);
        }

        // 呼吸
        const breath = anim.breath || {};
        let breathScale = 1 + Math.sin(this._t * (breath.frequency || 2)) * (breath.amplitude || 0.01)
                            + Math.sin(this._t * (breath.secondaryFreq || 0.8)) * (breath.secondaryAmp || 0.005);

        // 深呼吸
        const db = anim.deepBreath || {};
        if (this._deepBreathPhase > 0) {
            breathScale += Math.sin(this._deepBreathPhase) * (db.amplitude || 0.025);
            this._deepBreathPhase += (db.speed || 0.04);
            if (this._deepBreathPhase > Math.PI) this._deepBreathPhase = 0;
        }

        // 微动
        const fidget = anim.fidget || {};
        const fidgetX = Math.sin(this._t * (fidget.xFreq || 0.23) + this._fidgetSeed) * (fidget.xAmp || 0.6);
        const fidgetR = Math.sin(this._t * (fidget.rotFreq || 0.17) + this._fidgetSeed * 2) * (fidget.rotAmp || 0.12);

        // 弹跳
        const bounce = this._breathExtra > 0 ? Math.sin(this._t * 12) * this._breathExtra : 0;

        // 应用 transform
        if (!this._squishing && this._petElement) {
            this._petElement.style.transform = `translateX(${fidgetX}px) translateY(${floatY + bounce}px) rotate(${floatR + fidgetR}deg) scale(${this._curScale * breathScale})`;
        }

        this._animFrameId = requestAnimationFrame(() => this._loop());
    }

    _startDeepBreathTimer() {
        const interval = 20000 + Math.random() * 20000;
        this._deepBreathInterval = setInterval(() => {
            if (this.currentMood === 'talking' || this.currentMood === 'thinking') return;
            if (this._deepBreathPhase === 0 && Math.random() < 0.5) {
                this._deepBreathPhase = 0.01;
            }
        }, interval);
    }

    /**
     * 绑定通用交互事件
     */
    _bindEvents() {
        if (!this._petElement) return;

        this._petElement.addEventListener('mousedown', () => {
            this.lastInteraction = Date.now();
        });
    }

    // ==================== 子类必须实现 ====================

    /** 构建 DOM 结构并挂载到 this.container */
    _buildDOM() { throw new Error('_buildDOM() must be implemented by subclass'); }

    /** 切换情绪的视觉效果（渐变色/帧动画等）*/
    _applyMoodVisuals(mood, prevMood, moodConfig) { throw new Error('_applyMoodVisuals() must be implemented by subclass'); }

    /** 播放指定表情 */
    _applyExpression(name) { throw new Error('_applyExpression() must be implemented by subclass'); }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PetRenderer;
} else if (typeof window !== 'undefined') {
    window.PetRenderer = PetRenderer;
}
