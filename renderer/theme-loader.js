/**
 * ThemeLoader — 加载、校验、缓存主题配置
 * 在渲染进程中运行（通过 IPC 从主进程获取主题数据）
 */

// 必须支持的最小情绪集，自定义主题缺少这些会 fallback 到 idle
const REQUIRED_MOODS = ['offline', 'idle', 'happy', 'talking', 'thinking', 'sleepy', 'sad'];

// 必须支持的最小表情集
const REQUIRED_EXPRESSIONS = ['normal', 'blink', 'happy', 'sad', 'thinking', 'talking', 'surprised', 'sleepy'];

class ThemeLoader {
    constructor() {
        this._cache = new Map();
    }

    /**
     * 从 JSON 对象加载主题（渲染进程直接使用）
     * @param {object} themeData — 已解析的 theme.json 内容
     * @returns {object} 校验后的主题对象
     */
    load(themeData) {
        if (!themeData || !themeData.id) {
            throw new Error('Invalid theme: missing id');
        }

        // 缓存命中
        const cacheKey = `${themeData.id}@${themeData.version || '0'}`;
        if (this._cache.has(cacheKey)) {
            return this._cache.get(cacheKey);
        }

        const validated = this._validate(themeData);
        this._cache.set(cacheKey, validated);
        return validated;
    }

    /**
     * 校验并补全主题配置
     */
    _validate(theme) {
        // Deep copy to avoid mutating the original IPC data
        const t = JSON.parse(JSON.stringify(theme));

        // 基础字段
        if (!['css-fluid', 'sprite', 'lottie'].includes(t.type)) {
            console.warn(`[ThemeLoader] Unknown type "${t.type}", falling back to css-fluid`);
            t.type = 'css-fluid';
        }

        // 尺寸默认值
        if (!t.size) t.size = { width: 67, height: 67 };
        t.size.width = Math.max(16, Math.min(256, t.size.width || 67));
        t.size.height = Math.max(16, Math.min(256, t.size.height || 67));

        // === CSS-Fluid 型校验 ===
        if (t.type === 'css-fluid') {
            this._validateCssFluid(t);
        }

        // === Sprite 型校验 ===
        if (t.type === 'sprite') {
            this._validateSprite(t);
        }

        // 情绪校验
        if (!t.moods) t.moods = {};
        for (const mood of REQUIRED_MOODS) {
            if (!t.moods[mood]) {
                console.warn(`[ThemeLoader] Missing required mood "${mood}", cloning "idle"`);
                t.moods[mood] = { ...(t.moods.idle || {}) };
            }
        }

        // 动画参数默认值
        if (!t.animation) {
            t.animation = {
                float: { frequencies: [1.3, 0.67, 2.3], amplitudes: [3.5, 2, 0.6] },
                rotation: { frequencies: [0.9, 0.37], amplitudes: [0.3, 0.2] },
                breath: { frequency: 2, amplitude: 0.01, secondaryFreq: 0.8, secondaryAmp: 0.005 },
                fidget: { xFreq: 0.23, xAmp: 0.6, rotFreq: 0.17, rotAmp: 0.12 },
                deepBreath: { amplitude: 0.025, speed: 0.04 }
            };
        }

        // 装饰默认值
        if (!t.decorations) {
            t.decorations = {
                blush: { enabled: false },
                bubbles: { enabled: false },
                particles: { colors: ['#fff'], count: 6, distance: { min: 15, max: 40 }, sizeRange: { min: 2, max: 5 } }
            };
        }

        return t;
    }

    _validateCssFluid(t) {
        // 形状
        if (!t.shape) {
            t.shape = { borderRadius: '50%' };
        }

        // 眼睛
        if (!t.eyes) {
            t.eyes = {
                count: 2,
                gap: '12px',
                default: { w: 11, h: 19, br: '6px' },
                color: 'white',
                expressions: { normal: { L: { w: 11, h: 19, br: '6px' } } }
            };
        }

        // 表情补全
        if (t.eyes.expressions) {
            for (const expr of REQUIRED_EXPRESSIONS) {
                if (!t.eyes.expressions[expr]) {
                    console.warn(`[ThemeLoader] Missing required expression "${expr}", using "normal"`);
                    t.eyes.expressions[expr] = t.eyes.expressions.normal || { L: t.eyes.default || {} };
                }
            }
        }
    }

    _validateSprite(t) {
        if (!t.sprite) {
            throw new Error('Sprite theme must have a "sprite" config section');
        }
        if (!t.sprite.sheet) {
            throw new Error('Sprite theme must specify sprite.sheet path');
        }
        if (!t.sprite.frameWidth || !t.sprite.frameHeight) {
            throw new Error('Sprite theme must specify frameWidth and frameHeight');
        }
        if (!t.sprite.animations || !t.sprite.animations.idle) {
            throw new Error('Sprite theme must have at least an "idle" animation');
        }
    }

    /**
     * 获取主题的渲染器类型
     */
    getRendererType(theme) {
        return theme.type || 'css-fluid';
    }

    clearCache() {
        this._cache.clear();
    }
}

// 导出为单例（渲染进程内共享）
const themeLoader = new ThemeLoader();

// 兼容 Node.js require 和浏览器 ES module / 全局
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeLoader;
    module.exports.instance = themeLoader;
} else if (typeof window !== 'undefined') {
    window.ThemeLoader = ThemeLoader;
    window.themeLoaderInstance = themeLoader;
}
