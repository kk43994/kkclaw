/**
 * ThemeManager — 主题管理器（主进程）
 *
 * 负责：扫描主题目录 / 读取主题 / 切换主题 / 导入导出 .kktheme 包
 */
const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');

// 内置主题目录
const BUILTIN_THEMES_DIR = path.join(__dirname, 'themes');
// 用户自定义主题目录
const USER_THEMES_DIR = path.join(__dirname, 'skins', 'user');

// 必须存在的情绪
const REQUIRED_MOODS = ['offline', 'idle', 'happy', 'talking', 'thinking', 'sleepy', 'sad'];

class ThemeManager extends EventEmitter {
    /**
     * @param {PetConfig} petConfig — 配置管理器实例（用于持久化当前主题选择）
     */
    constructor(petConfig) {
        super();
        this._petConfig = petConfig;
        this._themes = new Map(); // id → theme data
        this._activeThemeId = null;
    }

    /**
     * 初始化：扫描所有主题
     */
    async init() {
        await this._ensureDirs();
        await this._scanThemes();

        // 从配置中恢复上次选择的主题
        const savedId = this._petConfig?.get('activeTheme') || 'fluid-lobster';
        if (this._themes.has(savedId)) {
            this._activeThemeId = savedId;
        } else {
            this._activeThemeId = 'fluid-lobster';
        }

        console.log(`🎨 ThemeManager: ${this._themes.size} 个主题已加载, 当前: ${this._activeThemeId}`);
    }

    /**
     * 获取所有可用主题列表（轻量摘要）
     */
    listThemes() {
        const list = [];
        for (const [id, theme] of this._themes) {
            // 提取预览用的视觉数据
            const idle = theme.moods?.idle || {};
            const eyeDef = theme.eyes?.default || {};
            list.push({
                id: theme.id,
                name: theme.name,
                version: theme.version,
                author: theme.author || 'Unknown',
                description: theme.description || '',
                type: theme.type,
                isBuiltin: theme._isBuiltin || false,
                isActive: id === this._activeThemeId,
                previewPath: theme._previewPath || null,
                // 预览数据
                preview: {
                    size: theme.size || { width: 67, height: 67 },
                    borderRadius: theme.shape?.borderRadius || '50%',
                    fluid: idle.fluid || '',
                    b1: idle.b1 || '',
                    glow: idle.glow || '',
                    speed: idle.speed || '8s',
                    eyeColor: theme.eyes?.color || 'white',
                    eyeGlow: theme.eyes?.glow || '',
                    eyeW: eyeDef.w || 11,
                    eyeH: eyeDef.h || 19,
                    eyeBr: eyeDef.br || '6px',
                    eyeGap: theme.eyes?.gap || '12px',
                    imageSrc: theme.shape?.image?.src || null,
                    imageGlow: theme.shape?.image?.glow || null,
                },
            });
        }
        return list;
    }

    /**
     * 获取当前激活主题的完整数据
     */
    getActiveTheme() {
        return this._themes.get(this._activeThemeId) || this._themes.get('fluid-lobster') || null;
    }

    /**
     * 获取当前激活主题 ID
     */
    getActiveThemeId() {
        return this._activeThemeId;
    }

    /**
     * 获取指定主题的完整数据
     */
    getTheme(id) {
        return this._themes.get(id) || null;
    }

    /**
     * 切换主题
     * @returns {object} 切换后的主题数据
     */
    async switchTheme(themeId) {
        if (!this._themes.has(themeId)) {
            throw new Error(`Theme "${themeId}" not found`);
        }

        this._activeThemeId = themeId;

        // 持久化
        if (this._petConfig) {
            this._petConfig.set('activeTheme', themeId);
        }

        const theme = this._themes.get(themeId);
        this.emit('theme-changed', theme);
        console.log(`🎨 主题切换为: ${theme.name}`);
        return theme;
    }

    /**
     * 导入 .kktheme 主题包（实际是 zip）
     * @param {string} filePath — .kktheme 文件路径
     * @returns {object} 导入后的主题摘要
     */
    async importTheme(filePath) {
        // 简易实现：.kktheme 其实是包含 theme.json 的文件夹打成的 zip
        // 这里先支持直接导入一个包含 theme.json 的文件夹路径
        // 后续可以加入 zip 解压支持

        let themeData;
        const stat = await fsp.stat(filePath);

        if (stat.isDirectory()) {
            // 导入目录
            themeData = await this._loadThemeFromDir(filePath);
        } else if (filePath.endsWith('.json')) {
            // 导入单个 theme.json
            const raw = await fsp.readFile(filePath, 'utf-8');
            themeData = JSON.parse(raw);
        } else if (filePath.endsWith('.kktheme') || filePath.endsWith('.zip')) {
            // TODO: 解压 zip
            throw new Error('ZIP/kktheme 导入暂未实现，请先导入文件夹');
        } else {
            throw new Error('不支持的文件格式');
        }

        // 校验
        this._validateTheme(themeData);

        // 复制到用户主题目录
        const destDir = path.join(USER_THEMES_DIR, themeData.id);
        await fsp.mkdir(destDir, { recursive: true });
        await fsp.writeFile(
            path.join(destDir, 'theme.json'),
            JSON.stringify(themeData, null, 2)
        );

        // 如果是目录导入，复制额外资源文件
        if (stat.isDirectory()) {
            await this._copyAssets(filePath, destDir, themeData);
        }

        // 注册到内存
        themeData._isBuiltin = false;
        themeData._dir = destDir;
        this._themes.set(themeData.id, themeData);

        this.emit('theme-imported', { id: themeData.id, name: themeData.name });
        console.log(`🎨 主题已导入: ${themeData.name}`);

        return {
            id: themeData.id,
            name: themeData.name,
            type: themeData.type,
        };
    }

    /**
     * 导出主题目录（包含 theme.json 和所有素材）
     * @param {string} themeId
     * @param {string} destPath — 导出目录路径
     */
    async exportTheme(themeId, destPath) {
        const theme = this._themes.get(themeId);
        if (!theme) throw new Error(`Theme "${themeId}" not found`);
        if (!theme._dir) throw new Error(`Theme "${themeId}" has no source directory`);

        const stat = await fsp.stat(theme._dir);
        if (!stat.isDirectory()) {
            throw new Error(`Theme source is not a directory: ${theme._dir}`);
        }

        const finalPath = await this._ensureUniqueExportPath(destPath);
        await this._copyDirectory(theme._dir, finalPath);

        console.log(`🎨 主题已打包导出: ${theme.name} → ${finalPath}`);
        return { success: true, path: finalPath };
    }

    /**
     * 删除自定义主题
     */
    async deleteTheme(themeId) {
        const theme = this._themes.get(themeId);
        if (!theme) throw new Error(`Theme "${themeId}" not found`);
        if (theme._isBuiltin) throw new Error('Cannot delete built-in theme');

        // 删除目录
        if (theme._dir) {
            await fsp.rm(theme._dir, { recursive: true, force: true });
        }

        this._themes.delete(themeId);

        // 如果删除的是当前主题，切回默认
        if (this._activeThemeId === themeId) {
            await this.switchTheme('fluid-lobster');
        }

        this.emit('theme-deleted', { id: themeId });
        console.log(`🎨 主题已删除: ${themeId}`);
    }

    /**
     * 重新扫描主题目录
     */
    async reload() {
        this._themes.clear();
        await this._scanThemes();
        console.log(`🎨 主题已重新扫描: ${this._themes.size} 个`);
    }

    // ==================== 内部方法 ====================

    async _ensureDirs() {
        await fsp.mkdir(BUILTIN_THEMES_DIR, { recursive: true });
        await fsp.mkdir(USER_THEMES_DIR, { recursive: true });
    }

    async _scanThemes() {
        // 扫描内置主题
        await this._scanDir(BUILTIN_THEMES_DIR, true);
        // 扫描用户主题
        await this._scanDir(USER_THEMES_DIR, false);
    }

    async _scanDir(dir, isBuiltin) {
        try {
            const entries = await fsp.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                if (!entry.isDirectory()) continue;
                const themeDir = path.join(dir, entry.name);
                try {
                    const theme = await this._loadThemeFromDir(themeDir);
                    theme._isBuiltin = isBuiltin;
                    theme._dir = themeDir;

                    // 检查预览图
                    const previewPath = path.join(themeDir, 'preview.png');
                    if (fs.existsSync(previewPath)) {
                        theme._previewPath = previewPath;
                    }

                    this._themes.set(theme.id, theme);
                } catch (err) {
                    console.warn(`⚠️ 跳过无效主题目录 ${entry.name}:`, err.message);
                }
            }
        } catch (err) {
            // 目录不存在等
        }
    }

    async _loadThemeFromDir(themeDir) {
        const themeFile = path.join(themeDir, 'theme.json');
        const raw = await fsp.readFile(themeFile, 'utf-8');
        const data = JSON.parse(raw);

        // 将 sprite sheet 路径转为绝对路径（供渲染进程通过 file:// 加载）
        if (data.type === 'sprite' && data.sprite?.sheet) {
            const absSheet = path.resolve(themeDir, data.sprite.sheet);
            data.sprite._resolvedSheet = absSheet;
        }

        // 将图片主题的 image src 转为绝对路径
        if (data.shape?.image?.src) {
            data.shape.image.src = path.resolve(themeDir, data.shape.image.src);
        }

        // 将各情绪的 image 路径转为绝对路径
        if (data.moods) {
            for (const mood of Object.values(data.moods)) {
                if (mood.image) {
                    mood.image = path.resolve(themeDir, mood.image);
                }
            }
        }

        return data;
    }

    _validateTheme(data) {
        if (!data.id || typeof data.id !== 'string') {
            throw new Error('Theme must have a valid "id" field');
        }
        if (!/^[a-z0-9-]+$/.test(data.id)) {
            throw new Error('Theme id must be lowercase alphanumeric with hyphens');
        }
        if (!data.name) {
            throw new Error('Theme must have a "name" field');
        }
        if (!data.type || !['css-fluid', 'sprite', 'lottie'].includes(data.type)) {
            throw new Error('Theme must have a valid "type" (css-fluid, sprite, lottie)');
        }
        if (!data.moods) {
            throw new Error('Theme must have a "moods" section');
        }
        for (const mood of REQUIRED_MOODS) {
            if (!data.moods[mood]) {
                throw new Error(`Theme must define mood "${mood}"`);
            }
        }
    }

    async _copyAssets(srcDir, destDir, themeData) {
        // 复制 sprite sheet
        if (themeData.type === 'sprite' && themeData.sprite?.sheet) {
            const srcFile = path.join(srcDir, themeData.sprite.sheet);
            const destFile = path.join(destDir, themeData.sprite.sheet);
            await fsp.mkdir(path.dirname(destFile), { recursive: true });
            if (fs.existsSync(srcFile)) {
                await fsp.copyFile(srcFile, destFile);
            }
        }

        // 复制预览图
        const srcPreview = path.join(srcDir, 'preview.png');
        if (fs.existsSync(srcPreview)) {
            await fsp.copyFile(srcPreview, path.join(destDir, 'preview.png'));
        }
    }

    async _ensureUniqueExportPath(basePath) {
        let candidate = basePath;
        let index = 1;
        while (fs.existsSync(candidate)) {
            candidate = `${basePath}-${index}`;
            index += 1;
        }
        return candidate;
    }

    async _copyDirectory(srcDir, destDir) {
        await fsp.mkdir(destDir, { recursive: true });
        const entries = await fsp.readdir(srcDir, { withFileTypes: true });
        for (const entry of entries) {
            const srcPath = path.join(srcDir, entry.name);
            const destPath = path.join(destDir, entry.name);
            if (entry.isDirectory()) {
                await this._copyDirectory(srcPath, destPath);
            } else if (entry.isFile()) {
                await fsp.mkdir(path.dirname(destPath), { recursive: true });
                await fsp.copyFile(srcPath, destPath);
            }
        }
    }
}

module.exports = ThemeManager;
