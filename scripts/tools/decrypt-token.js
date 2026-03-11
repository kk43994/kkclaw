// 临时脚本：解密 token_encrypted 并恢复配置
const { safeStorage } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');

const configPath = path.join(os.homedir(), '.openclaw', 'openclaw.json');

try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    if (config.gateway?.auth?.token_encrypted) {
        const encryptedToken = config.gateway.auth.token_encrypted;
        console.log('找到加密的 token，正在解密...');

        const buffer = Buffer.from(encryptedToken, 'base64');
        const plainToken = safeStorage.decryptString(buffer);

        console.log('解密成功！');
        console.log('明文 token 长度:', plainToken.length);

        // 恢复配置
        config.gateway.auth.token = plainToken;
        delete config.gateway.auth.token_encrypted;
        delete config.gateway.auth.token_is_encrypted;

        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        console.log('✅ 配置已恢复，token_encrypted 已改回 token');
        console.log('现在可以重启 Gateway 了');
    } else {
        console.log('未找到 token_encrypted 字段');
    }
} catch (err) {
    console.error('❌ 解密失败:', err.message);
    process.exit(1);
}
