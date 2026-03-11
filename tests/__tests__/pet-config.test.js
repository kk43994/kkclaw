// Tests for PetConfig (requires Electron mock)
jest.mock('electron')

const PetConfig = require('../../pet-config')

describe('PetConfig', () => {
  let config

  beforeEach(() => {
    config = new PetConfig()
  })

  test('should have default config values', () => {
    expect(config.config.mood).toBe('happy')
    expect(config.config.voiceEnabled).toBe(true)
    expect(config.config.theme).toBe('default')
    expect(config.config.position).toEqual({ x: null, y: null })
  })

  test('should have configPath pointing to pet-config.json', () => {
    expect(config.configPath).toContain('pet-config.json')
  })

  test('_canEncrypt should return boolean', () => {
    const result = config._canEncrypt()
    expect(typeof result).toBe('boolean')
  })

  test('_encrypt should return original value when encryption unavailable', () => {
    const value = 'test-api-key'
    const result = config._encrypt(value)
    // safeStorage mock returns isEncryptionAvailable() = false
    expect(result).toBe(value)
  })

  test('_encrypt should handle null/undefined', () => {
    expect(config._encrypt(null)).toBeNull()
    expect(config._encrypt(undefined)).toBeUndefined()
  })

  test('_decrypt should return original value for non-encrypted strings', () => {
    expect(config._decrypt('plain-text')).toBe('plain-text')
    expect(config._decrypt(null)).toBeNull()
    expect(config._decrypt(123)).toBe(123)
  })

  test('_encryptSensitive should return deep copy', () => {
    const original = {
      minimax: { apiKey: 'sk-test-123' },
      dashscope: { apiKey: 'dk-test-456' },
      other: { data: 'untouched' },
    }
    const encrypted = config._encryptSensitive(original)

    // Should be a different object (deep copy)
    expect(encrypted).not.toBe(original)
    // Non-sensitive data should be preserved
    expect(encrypted.other.data).toBe('untouched')
    // Original should be unchanged
    expect(original.minimax.apiKey).toBe('sk-test-123')
  })

  test('_decryptSensitive should handle missing sections', () => {
    const cfg = { other: { data: 'test' } }
    // Should not throw when minimax/dashscope sections are missing
    expect(() => config._decryptSensitive(cfg)).not.toThrow()
  })

  test('load should use defaults when file not found', async () => {
    // configPath points to a non-existent test path by default
    config.configPath = '/tmp/nonexistent-pet-config.json'
    const result = await config.load()
    expect(result.mood).toBe('happy')
    expect(result.voiceEnabled).toBe(true)
  })
})
