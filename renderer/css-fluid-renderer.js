/**
 * CssFluidRenderer — CSS 流体球渲染器
 *
 * 将当前 index.html 中硬编码的流体球 + 眼睛 + 装饰全部参数化，
 * 运行时从 theme.json 读取配色、尺寸、表情等数据。
 */

// 加载父类
const _PetRenderer = (typeof PetRenderer !== 'undefined') ? PetRenderer : require('./pet-renderer');

// 眼睛过渡速度预设
const EYE_SPEED = {
    snap:   '0s',
    fast:   '0.08s',
    normal: '0.18s',
    smooth: '0.3s',
    slow:   '0.45s',
    drift:  '0.6s',
};

class CssFluidRenderer extends _PetRenderer {
    constructor(container, theme) {
        super(container, theme);

        // CSS-Fluid 特有元素引用
        this._fluid = null;
        this._blob1 = null;
        this._blob2 = null;
        this._glassShell = null;
        this._eyeL = null;
        this._eyeR = null;
        this._blushL = null;
        this._blushR = null;
        this._eyesContainer = null;

        // 说话动画 interval
        this._talkInterval = null;
    }

    _getBaseGlassShadow() {
        const gs = this.theme.shape?.glassShell || {};
        return gs.boxShadow || 'inset -2px -2px 8px rgba(255,255,255,0.08), inset 2px 2px 8px rgba(255,255,255,0.35), 0px 2px 6px rgba(220,80,80,0.08)';
    }

    // ==================== DOM 构建 ====================

    _buildDOM() {
        const t = this.theme;
        const sz = t.size || { width: 67, height: 67 };

        // 宠物包裹层
        const wrapper = document.createElement('div');
        wrapper.className = 'pet-wrapper';
        wrapper.style.cssText = `
            width: ${sz.width}px; height: ${sz.height}px;
            position: relative; cursor: grab; will-change: transform;
        `;
        wrapper.addEventListener('mousedown', () => { wrapper.style.cursor = 'grabbing'; });
        wrapper.addEventListener('mouseup', () => { wrapper.style.cursor = 'grab'; });

        // 内部流体层
        const hasImage = !!t.shape?.image?.src;
        const fluid = document.createElement('div');
        fluid.className = 'inner-fluid';
        const defaultMood = t.moods.idle || {};
        const padding = t.shape?.padding ?? 3;
        const fluidBr = t.shape?.fluidBorderRadius || t.shape?.borderRadius || '50%';

        if (hasImage) {
            // 图片主题：流体层完全隐藏，光晕由图片层的 drop-shadow 实现
            fluid.style.cssText = 'display: none;';
        } else {
            fluid.style.cssText = `
                position: absolute; top: ${padding}px; left: ${padding}px; right: ${padding}px; bottom: ${padding}px;
                border-radius: ${fluidBr};
                overflow: hidden; z-index: 1;
                background: ${defaultMood.fluid || 'linear-gradient(135deg,#ffb3b3,#fed6e3)'};
                transition: filter 0.4s ease;
            `;
        }

        // Blob 1
        const blob1 = document.createElement('div');
        blob1.className = 'fluid-blob';
        blob1.style.cssText = `
            position: absolute; width: 130%; height: 130%; top: -15%; left: -15%;
            background: ${defaultMood.b1 || 'none'};
            animation: fluid-spin ${defaultMood.speed || '8s'} linear infinite;
        `;

        // Blob 2
        const blob2 = document.createElement('div');
        blob2.className = 'fluid-blob-2';
        blob2.style.cssText = `
            position: absolute; width: 110%; height: 110%; top: -5%; left: -5%;
            background: ${defaultMood.b2 || 'none'};
            animation: fluid-spin-r 12s linear infinite;
        `;

        fluid.appendChild(blob1);
        fluid.appendChild(blob2);
        wrapper.appendChild(fluid);

        // 玻璃外壳
        const shell = document.createElement('div');
        shell.className = 'glass-shell';
        const gs = t.shape?.glassShell || {};

        if (hasImage) {
            // 图片主题：璃璃壳也隐藏
            shell.style.cssText = 'display: none;';
        } else {
            shell.style.cssText = `
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                border-radius: ${t.shape?.borderRadius || '50%'}; z-index: 2;
                background: ${gs.background || 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.12), rgba(255,255,255,0.03))'};
                box-shadow: ${this._getBaseGlassShadow()};
                border: ${gs.border || '1px solid rgba(255,255,255,0.12)'};
                transition: box-shadow 1.0s cubic-bezier(0.4,0,0.2,1), border 1.0s cubic-bezier(0.4,0,0.2,1);
            `;
        }

        // 高光
        const hlRadius = t.shape?.highlightRadius || '50%';
        if (gs.highlightTop) {
            const ht = gs.highlightTop;
            const before = document.createElement('div');
            before.style.cssText = `
                position: absolute; top: ${ht.top}; left: ${ht.left}; width: ${ht.width}; height: ${ht.height};
                border-radius: ${hlRadius}; background: ${ht.background}; filter: blur(${ht.blur || '1px'});
                transform: rotate(${ht.rotation || '0deg'});
                transition: opacity 1.0s cubic-bezier(0.4,0,0.2,1);
            `;
            shell.appendChild(before);
        }
        if (gs.highlightBottom) {
            const hb = gs.highlightBottom;
            const after = document.createElement('div');
            after.style.cssText = `
                position: absolute; bottom: ${hb.bottom}; right: ${hb.right}; width: ${hb.width}; height: ${hb.height};
                border-radius: ${hlRadius}; background: ${hb.background}; filter: blur(${hb.blur || '1px'});
                transform: rotate(${hb.rotation || '0deg'});
                transition: opacity 1.0s cubic-bezier(0.4,0,0.2,1);
            `;
            shell.appendChild(after);
        }
        wrapper.appendChild(shell);

        // 🖼️ 图片层（可选）— 在流体层和眼睛之间，用于渲染角色图片
        const imgCfg = t.shape?.image;
        if (imgCfg?.src) {
            const imgLayer = document.createElement('div');
            imgLayer.className = 'image-layer';
            const imgSize = imgCfg.size || '90%';
            const imgFit = imgCfg.fit || 'contain';
            // 图片主题的光晕通过 drop-shadow 实现
            const defaultGlow = defaultMood.imageGlow || imgCfg.glow || 'none';
            const imgUrl = imgCfg.src.startsWith('/') ? 'file://' + imgCfg.src : imgCfg.src;
            imgLayer.style.cssText = `
                position: absolute; z-index: 3;
                top: 50%; left: 50%;
                transform: translate(-50%, -50%);
                width: ${imgSize}; height: ${imgSize};
                background-image: url('${imgUrl}');
                background-size: ${imgFit};
                background-repeat: no-repeat;
                background-position: center center;
                pointer-events: none;
                transition: filter 0.6s ease;
                filter: ${defaultGlow !== 'none' ? `drop-shadow(${defaultGlow})` : 'none'};
            `;
            this._imageLayer = imgLayer;
            wrapper.appendChild(imgLayer);
        }

        // 眼睛
        const eyesCfg = t.eyes || {};
        if (eyesCfg.count !== 0) {
            const eyesCont = document.createElement('div');
            eyesCont.className = 'eyes-container';
            const ep = eyesCfg.containerPosition || {};
            eyesCont.style.cssText = `
                position: absolute; z-index: 3;
                top: ${ep.top || '16%'}; left: ${ep.left || '10%'};
                width: ${ep.width || '80%'}; height: ${ep.height || '50%'};
                display: flex; justify-content: center; align-items: center;
                gap: ${eyesCfg.gap || '12px'};
                pointer-events: none; overflow: visible;
            `;

            const eyeDefault = eyesCfg.default || { w: 11, h: 19, br: '6px' };
            const eyeColor = eyesCfg.color || 'white';
            const eyeGlow = eyesCfg.glow || '0 0 4px rgba(255,255,255,0.6)';

            const makeEye = () => {
                const eye = document.createElement('div');
                eye.className = 'eye';
                eye.style.cssText = `
                    width: ${eyeDefault.w}px; height: ${eyeDefault.h}px;
                    background: ${eyeColor}; border-radius: ${eyeDefault.br};
                    box-shadow: ${eyeGlow};
                    transition: width 0.18s, height 0.18s, border-radius 0.18s, transform 0.18s cubic-bezier(0.25,1,0.5,1);
                    transform-origin: center center;
                `;
                return eye;
            };

            const eyeL = makeEye();
            const eyeR = makeEye();
            eyesCont.appendChild(eyeL);
            if ((eyesCfg.count || 2) >= 2) {
                eyesCont.appendChild(eyeR);
            }
            wrapper.appendChild(eyesCont);

            this._eyeL = eyeL;
            this._eyeR = eyeR;
            this._eyesContainer = eyesCont;
        }

        // 腮红
        const blushCfg = t.decorations?.blush;
        if (blushCfg?.enabled) {
            const bSize = blushCfg.size || { width: 14, height: 8 };
            const positions = blushCfg.positions || [];
            const makeBlush = (pos) => {
                const b = document.createElement('div');
                b.className = 'blush';
                let posCSS = '';
                for (const [k, v] of Object.entries(pos)) {
                    posCSS += `${k}: ${v}; `;
                }
                b.style.cssText = `
                    position: absolute; z-index: 3;
                    width: ${bSize.width}px; height: ${bSize.height}px; border-radius: 50%;
                    background: ${blushCfg.color || 'rgba(255,130,130,0.25)'};
                    filter: blur(${blushCfg.blur || 3}px);
                    pointer-events: none;
                    transition: background 2.0s cubic-bezier(0.33,0,0.2,1), opacity 0.6s ease;
                    opacity: 0.8;
                    ${posCSS}
                `;
                return b;
            };
            if (positions[0]) { this._blushL = makeBlush(positions[0]); wrapper.appendChild(this._blushL); }
            if (positions[1]) { this._blushR = makeBlush(positions[1]); wrapper.appendChild(this._blushR); }
        }

        // 气泡装饰
        const bubCfg = t.decorations?.bubbles;
        if (bubCfg?.enabled && bubCfg.items) {
            for (const item of bubCfg.items) {
                const bub = document.createElement('div');
                bub.className = 'bub';
                let posCSS = '';
                if (item.left) posCSS += `left: ${item.left}; `;
                if (item.right) posCSS += `right: ${item.right}; `;
                if (item.top) posCSS += `top: ${item.top}; `;
                bub.style.cssText = `
                    position: absolute; border-radius: 50%;
                    background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), rgba(255,255,255,0.06));
                    border: 1px solid rgba(255,255,255,0.12);
                    z-index: 0; opacity: 0; pointer-events: none;
                    width: ${item.size}px; height: ${item.size}px;
                    animation: bub ${item.duration || '5s'} ease-in infinite ${item.delay || '0s'};
                    ${posCSS}
                `;
                wrapper.appendChild(bub);
            }
        }

        // 粒子容器
        const particles = document.createElement('div');
        particles.className = 'particles';
        particles.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10;';
        wrapper.appendChild(particles);
        this._particlesEl = particles;

        // 挂载
        this.container.appendChild(wrapper);

        // 保存引用
        this._petElement = wrapper;
        this._fluid = fluid;
        this._blob1 = blob1;
        this._blob2 = blob2;
        this._glassShell = shell;
    }

    // ==================== 情绪切换视觉 ====================

    _applyMoodVisuals(mood, prevMood, m) {
        // 停止说话动画
        if (this._talkInterval) {
            clearInterval(this._talkInterval);
            this._talkInterval = null;
        }

        const hasImage = !!this.theme.shape?.image?.src;

        // 🖼️ 图片主题：切换图片 + 更新 drop-shadow 光晕 + CSS 滤镜表情
        if (this._imageLayer) {
            let moodImg = m.image || this.theme.shape?.image?.src;
            if (moodImg) {
                if (moodImg.startsWith('/')) moodImg = 'file://' + moodImg;
                this._imageLayer.style.backgroundImage = `url('${moodImg}')`;
            }
            // 组装 filter：drop-shadow(光晕) + 额外的情绪滤镜
            const glow = m.imageGlow || this.theme.shape?.image?.glow || 'none';
            const moodFilter = m.imageFilter || '';
            const filters = [];
            if (glow !== 'none') filters.push(`drop-shadow(${glow})`);
            if (moodFilter) filters.push(moodFilter);
            this._imageLayer.style.filter = filters.length > 0 ? filters.join(' ') : 'none';
        }

        // 非图片主题：流体层过渡
        if (!hasImage && mood !== prevMood && this._fluid) {
            // 打断上一次未完成的过渡
            if (this._moodTimer) { clearTimeout(this._moodTimer); this._moodTimer = null; }

            // 基础 blur（图片主题用于漫射光效）
            const baseBlur = this.theme.shape?.fluidBlur || 0;

            // filter 柔光过渡
            this._fluid.style.transition = 'filter 0.35s ease-in';
            this._fluid.style.filter = `brightness(1.6) blur(${baseBlur + 2}px)`;

            this._moodTimer = setTimeout(() => {
                this._fluid.style.background = m.fluid;
                if (this._blob1) this._blob1.style.background = m.b1;
                if (this._blob2) this._blob2.style.background = m.b2;
                if (m.glow && this._glassShell) {
                    this._glassShell.style.boxShadow = `${this._getBaseGlassShadow()}, ${m.glow}`;
                } else if (this._glassShell) {
                    this._glassShell.style.boxShadow = this._getBaseGlassShadow();
                }
                if (this._blob1) this._blob1.style.animation = `fluid-spin ${m.speed || '8s'} linear infinite`;

                this._fluid.style.transition = 'filter 0.5s ease-out';
                this._fluid.style.filter = `brightness(1) blur(${baseBlur}px)`;

                this._moodTimer = setTimeout(() => {
                    this._fluid.style.transition = '';
                    this._fluid.style.filter = baseBlur > 0 ? `blur(${baseBlur}px)` : '';
                    this._moodTimer = null;
                }, 550);
            }, 350);
        }

        // Blob 透明度（仅非图片主题）
        if (!hasImage && this._blob1) {
            if (mood === 'sleepy' || mood === 'sad') {
                this._blob1.style.transition = 'opacity 1.5s ease';
                this._blob1.style.opacity = '0.6';
            } else {
                this._blob1.style.transition = 'opacity 1.0s ease';
                this._blob1.style.opacity = '1';
            }
        }

        // 说话动画
        if (mood === 'talking') {
            let tog = false;
            this._talkInterval = setInterval(() => {
                tog = !tog;
                this._applyExpression(tog ? 'talkBig' : 'talking');
            }, 250);
        } else {
            this.applyMoodEyes();
        }

        // 腮红
        if (this._blushL && this._blushR) {
            if (mood === 'happy' || mood === 'excited' || mood === 'love') {
                this._blushL.style.transition = 'background 0.8s ease, opacity 0.6s ease';
                this._blushR.style.transition = 'background 0.8s ease, opacity 0.6s ease';
                const blushColor = mood === 'love' ? 'rgba(255,90,120,0.5)' : 'rgba(255,120,120,0.4)';
                this._blushL.style.background = blushColor;
                this._blushR.style.background = blushColor;
            } else {
                this._blushL.style.transition = 'background 0.6s ease, opacity 0.4s ease';
                this._blushR.style.transition = 'background 0.6s ease, opacity 0.4s ease';
                this._blushL.style.background = '';
                this._blushR.style.background = '';
            }
        }
    }

    // ==================== 表情系统 ====================

    _applyExpression(name) {
        const expressions = this.theme.eyes?.expressions;
        if (!expressions || !expressions[name]) {
            // fallback to normal
            if (expressions?.normal) {
                name = 'normal';
            } else {
                return;
            }
        }

        const expr = expressions[name];
        const eyeDefault = this.theme.eyes?.default || { w: 11, h: 19, br: '6px' };
        const d = { w: eyeDefault.w, h: eyeDefault.h, br: eyeDefault.br, tx: 0, ty: 0, sx: 1, sy: 1, rot: 0 };

        const speed = expr.speed || null;
        if (speed) this._setEyeTransition(speed);

        const l = { ...d, ...(expr.L || {}) };
        const r = expr.R ? { ...d, ...expr.R } : { ...l };

        if (this._eyeL) {
            this._eyeL.style.width = l.w + 'px';
            this._eyeL.style.height = l.h + 'px';
            this._eyeL.style.borderRadius = l.br;
            this._eyeL.style.transform = `translate(${l.tx}px,${l.ty}px) scale(${l.sx},${l.sy}) rotate(${l.rot}deg)`;
        }
        if (this._eyeR) {
            this._eyeR.style.width = r.w + 'px';
            this._eyeR.style.height = r.h + 'px';
            this._eyeR.style.borderRadius = r.br;
            this._eyeR.style.transform = `translate(${r.tx}px,${r.ty}px) scale(${r.sx},${r.sy}) rotate(${r.rot}deg)`;
        }

        if (speed) setTimeout(() => this._setEyeTransition('normal'), 20);
    }

    _setEyeTransition(speed) {
        const dur = EYE_SPEED[speed] || speed || EYE_SPEED.normal;
        const ease = speed === 'snap' || speed === 'fast'
            ? 'linear'
            : speed === 'slow' || speed === 'drift'
                ? 'cubic-bezier(0.4, 0, 0.2, 1)'
                : 'cubic-bezier(0.25, 1, 0.5, 1)';
        const transition = `width ${dur} ${ease}, height ${dur} ${ease}, border-radius ${dur} ${ease}, transform ${dur} ${ease}`;
        if (this._eyeL) this._eyeL.style.transition = transition;
        if (this._eyeR) this._eyeR.style.transition = transition;
    }

    // ==================== 鼠标跟随（CSS-Fluid 特有）====================

    enableMouseTracking() {
        if (this._mouseTrackBound) return;
        this._mouseTrackBound = (e) => {
            if (!this._mouseTracking) return;
            if (!this._petElement) return;
            const rect = this._petElement.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = Math.max(-2, Math.min(2, (e.clientX - cx) / window.innerWidth * 6));
            const dy = Math.max(-2, Math.min(2, (e.clientY - cy) / window.innerHeight * 6));
            if (this._eyeL) this._eyeL.style.transform = `translate(${dx}px,${dy}px)`;
            if (this._eyeR) this._eyeR.style.transform = `translate(${dx}px,${dy}px)`;
        };
        document.addEventListener('mousemove', this._mouseTrackBound);
    }

    disableMouseTracking() {
        if (this._mouseTrackBound) {
            document.removeEventListener('mousemove', this._mouseTrackBound);
            this._mouseTrackBound = null;
        }
    }

    // ==================== Hover 效果 ====================

    enableHoverEffect() {
        if (!this._petElement) return;
        this._hoverEnter = () => {
            if (this.currentMood === 'sleepy' || this.currentMood === 'offline') return;
            if (this._eyeL) this._eyeL.style.transform = 'scale(1.08)';
            if (this._eyeR) this._eyeR.style.transform = 'scale(1.08)';
            if (this._petElement) this._petElement.style.filter = 'brightness(1.05)';
        };
        this._hoverLeave = () => {
            if (this._eyeL) this._eyeL.style.transform = '';
            if (this._eyeR) this._eyeR.style.transform = '';
            if (this._petElement) this._petElement.style.filter = '';
        };
        this._petElement.addEventListener('mouseenter', this._hoverEnter);
        this._petElement.addEventListener('mouseleave', this._hoverLeave);
    }

    // ==================== 辅助 API ====================

    /** 获取腮红元素（供外部动作池直接操作）*/
    getBlush() {
        return { left: this._blushL, right: this._blushR };
    }

    /** 获取眼睛元素引用 */
    getEyes() {
        return { left: this._eyeL, right: this._eyeR };
    }

    /** 模型切换闪变效果 */
    flashColor(color) {
        if (!this._petElement) return;
        this._petElement.style.transition = 'filter 0.15s';
        this._petElement.style.filter = `brightness(1.5) drop-shadow(0 0 15px ${color})`;
        setTimeout(() => {
            this._petElement.style.filter = '';
            this._petElement.style.transition = '';
        }, 400);
    }

    destroy() {
        this.disableMouseTracking();
        if (this._talkInterval) clearInterval(this._talkInterval);
        super.destroy();
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CssFluidRenderer;
} else if (typeof window !== 'undefined') {
    window.CssFluidRenderer = CssFluidRenderer;
}
