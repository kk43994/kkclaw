// Tests for CacheManager (requires Electron mock)
jest.mock('electron')

const CacheManager = require('../../cache-manager')

describe('CacheManager', () => {
  let manager

  beforeEach(() => {
    manager = new CacheManager({
      interval: 1000,
      screenshots: 10,
      voiceFiles: 20,
      logDays: 7,
      cacheSize: 50 * 1024 * 1024,
    })
  })

  afterEach(() => {
    manager.stop()
  })

  test('should initialize with custom options', () => {
    expect(manager.cleanupInterval).toBe(1000)
    expect(manager.limits.screenshots).toBe(10)
    expect(manager.limits.voiceFiles).toBe(20)
    expect(manager.limits.logDays).toBe(7)
    expect(manager.limits.cacheSize).toBe(50 * 1024 * 1024)
  })

  test('should initialize with default options', () => {
    const defaultManager = new CacheManager()
    expect(defaultManager.cleanupInterval).toBe(6 * 60 * 60 * 1000)
    expect(defaultManager.limits.screenshots).toBe(50)
    expect(defaultManager.limits.voiceFiles).toBe(100)
    expect(defaultManager.limits.logDays).toBe(30)
    expect(defaultManager.limits.cacheSize).toBe(200 * 1024 * 1024)
    defaultManager.stop()
  })

  test('should track cleanup stats', () => {
    expect(manager.stats.lastCleanup).toBeNull()
    expect(manager.stats.totalCleaned).toBe(0)
    expect(manager.stats.cleanupCount).toBe(0)
  })

  test('should have null timer initially', () => {
    // Timer should only be set after start()
    expect(manager.timer).toBeNull()
  })

  test('stop() should clear timer', () => {
    manager.timer = setInterval(() => {}, 10000)
    manager.stop()
    expect(manager.timer).toBeNull()
  })
})
