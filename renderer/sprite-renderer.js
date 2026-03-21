/**
 * SpriteRenderer — 精灵图帧动画渲染器
 *
 * 支持用户上传 sprite sheet 图片，通过帧切换实现宠物动画。
 * 在 PetRenderer 基础动画（浮动/呼吸/微动）之上叠加帧动画。
 */

const _PetRenderer = (typeof PetRenderer !== 'undefined') ? PetRenderer : require('./pet-renderer');

class SpriteRenderer extends _PetRenderer {
    constructor(container, theme) {
        super(container, theme);

        this._canvas = null;
        this._ctx = null;
        this._spriteImage = null;
        this._imageLoaded = false;

        // 帧动画状态
        this._currentAnim = null;
        this._frameIndex = 0;
        this._frameTick = 0;
        this._framesPerTick = 1; // 每多少 loop tick 切一帧

        // 当前播放的动画名
        this._currentAnimName = 'idle';
    }

    // ==================== DOM 构建 ====================

    _buildDOM() {
        const t = this.theme;
        const sz = t.size || { width: 64, height: 64 };
        const sprite = t.sprite || {};

        // 宠物包裹层
        const wrapper = document.createElement('div');
        wrapper.className = 'pet-wrapper';
        wrapper.style.cssText = `
            width: ${sz.width}px; height: ${sz.height}px;
            position: relative; cursor: grab; will-change: transform;
        `;

        // Canvas 用于绘制精灵图帧
        const canvas = document.createElement('canvas');
        canvas.width = sprite.frameWidth || sz.width;
        canvas.height = sprite.frameHeight || sz.height;
        canvas.style.cssText = `
            width: ${sz.width}px; height: ${sz.height}px;
            image-rendering: pixelated;
        `;
        wrapper.appendChild(canvas);

        // 粒子容器
        const particles = document.createElement('div');
        particles.className = 'particles';
        particles.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10;';
        wrapper.appendChild(particles);
        this._particlesEl = particles;

        this.container.appendChild(wrapper);

        this._petElement = wrapper;
        this._canvas = canvas;
        this._ctx = canvas.getContext('2d');

        // 加载精灵图
        this._loadSpriteSheet(sprite.sheet);
    }

    /**
     * 加载精灵图资源
     * @param {string} sheetPath — 图片路径（相对于主题目录）
     */
    _loadSpriteSheet(sheetPath) {
        if (!sheetPath) {
            console.error('[SpriteRenderer] No sprite sheet path specified');
            return;
        }

        const img = new Image();
        img.onload = () => {
            this._spriteImage = img;
            this._imageLoaded = true;
            console.log(`[SpriteRenderer] Sprite sheet loaded: ${img.width}x${img.height}`);
            // 立刻播放 idle 动画
            this._playAnimation('idle');
        };
        img.onerror = (err) => {
            console.error('[SpriteRenderer] Failed to load sprite sheet:', sheetPath, err);
        };
        img.src = sheetPath;
    }

    // ==================== 帧动画 ====================

    /**
     * 播放指定名称的帧动画
     */
    _playAnimation(name) {
        const anims = this.theme.sprite?.animations;
        if (!anims) return;

        const anim = anims[name] || anims.idle;
        if (!anim) return;

        this._currentAnimName = name;
        this._currentAnim = anim;
        this._frameIndex = 0;
        this._frameTick = 0;

        // 计算帧率：主循环约 60fps，sprite fps 通常 4-12
        const fps = anim.fps || 6;
        this._framesPerTick = Math.max(1, Math.round(60 / fps));
    }

    /**
     * 在主循环中调用，推进帧动画+绘制当前帧
     */
    _drawFrame() {
        if (!this._imageLoaded || !this._ctx || !this._currentAnim) return;

        const sprite = this.theme.sprite || {};
        const fw = sprite.frameWidth || this._canvas.width;
        const fh = sprite.frameHeight || this._canvas.height;
        const anim = this._currentAnim;
        const frames = anim.frames || [0];

        // 推进帧
        this._frameTick++;
        if (this._frameTick >= this._framesPerTick) {
            this._frameTick = 0;
            this._frameIndex++;
            if (this._frameIndex >= frames.length) {
                if (anim.loop !== false) {
                    this._frameIndex = 0;
                } else {
                    this._frameIndex = frames.length - 1; // 停在最后一帧
                }
            }
        }

        // 计算 sprite sheet 中的位置
        const frameNum = frames[this._frameIndex];
        const cols = Math.floor(this._spriteImage.width / fw) || 1;
        const sx = (frameNum % cols) * fw;
        const sy = Math.floor(frameNum / cols) * fh;

        // 绘制
        this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
        this._ctx.drawImage(this._spriteImage, sx, sy, fw, fh, 0, 0, this._canvas.width, this._canvas.height);
    }

    // ==================== 覆写主循环 ====================

    _loop() {
        if (!this._running) return;

        // 调用父类的物理运动（浮动/呼吸/微动）
        this._t += 0.016;
        this._curScale += (this._targetScale - this._curScale) * 0.08;

        const anim = this.theme.animation || {};

        let floatY = 0;
        const floatFreqs = anim.float?.frequencies || [1.3, 0.67, 2.3];
        const floatAmps = anim.float?.amplitudes || [3.5, 2, 0.6];
        for (let i = 0; i < floatFreqs.length; i++) {
            floatY += Math.sin(this._t * floatFreqs[i]) * (floatAmps[i] || 0);
        }

        let floatR = 0;
        const rotFreqs = anim.rotation?.frequencies || [0.9, 0.37];
        const rotAmps = anim.rotation?.amplitudes || [0.3, 0.2];
        for (let i = 0; i < rotFreqs.length; i++) {
            floatR += Math.sin(this._t * rotFreqs[i]) * (rotAmps[i] || 0);
        }

        const breath = anim.breath || {};
        let breathScale = 1 + Math.sin(this._t * (breath.frequency || 2)) * (breath.amplitude || 0.01)
                            + Math.sin(this._t * (breath.secondaryFreq || 0.8)) * (breath.secondaryAmp || 0.005);

        const db = anim.deepBreath || {};
        if (this._deepBreathPhase > 0) {
            breathScale += Math.sin(this._deepBreathPhase) * (db.amplitude || 0.025);
            this._deepBreathPhase += (db.speed || 0.04);
            if (this._deepBreathPhase > Math.PI) this._deepBreathPhase = 0;
        }

        const fidget = anim.fidget || {};
        const fidgetX = Math.sin(this._t * (fidget.xFreq || 0.23) + this._fidgetSeed) * (fidget.xAmp || 0.6);

        const bounce = this._breathExtra > 0 ? Math.sin(this._t * 12) * this._breathExtra : 0;

        if (!this._squishing && this._petElement) {
            this._petElement.style.transform = `translateX(${fidgetX}px) translateY(${floatY + bounce}px) rotate(${floatR}deg) scale(${this._curScale * breathScale})`;
        }

        // 帧动画绘制
        this._drawFrame();

        this._animFrameId = requestAnimationFrame(() => this._loop());
    }

    // ==================== 情绪切换 ====================

    _applyMoodVisuals(mood, prevMood, moodConfig) {
        // Sprite 型：情绪切换 = 切换到对应的帧动画
        const animName = moodConfig.animation || moodConfig.eyes || mood;
        const anims = this.theme.sprite?.animations || {};

        if (anims[animName]) {
            this._playAnimation(animName);
        } else if (anims[mood]) {
            this._playAnimation(mood);
        } else {
            this._playAnimation('idle');
        }
    }

    // ==================== 表情（Sprite 型：切换动画片段）====================

    _applyExpression(name) {
        const anims = this.theme.sprite?.animations || {};
        if (anims[name]) {
            this._playAnimation(name);
        }
        // Sprite 型没有细粒度眼睛控制，忽略不支持的表情
    }

    // ==================== 辅助 ====================

    /** 模型切换闪变 */
    flashColor(color) {
        if (!this._petElement) return;
        this._petElement.style.transition = 'filter 0.15s';
        this._petElement.style.filter = `brightness(1.5) drop-shadow(0 0 15px ${color})`;
        setTimeout(() => {
            this._petElement.style.filter = '';
            this._petElement.style.transition = '';
        }, 400);
    }

    /**
     * 获取当前正在播放的动画名
     */
    getCurrentAnimation() {
        return this._currentAnimName;
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpriteRenderer;
} else if (typeof window !== 'undefined') {
    window.SpriteRenderer = SpriteRenderer;
}
