// Tests for LogRotationManager
const path = require('path')
const fs = require('fs').promises
const os = require('os')

const LogRotationManager = require('../../log-rotation')

describe('LogRotationManager', () => {
  let manager
  let testLogDir

  beforeEach(async () => {
    testLogDir = path.join(os.tmpdir(), `kkclaw-test-logs-${Date.now()}`)
    await fs.mkdir(testLogDir, { recursive: true })
    manager = new LogRotationManager({
      logDir: testLogDir,
      maxAge: 7,
      maxSize: 1024 * 1024, // 1MB
      checkInterval: 60000,
    })
  })

  afterEach(async () => {
    manager.stop()
    try {
      const files = await fs.readdir(testLogDir)
      for (const f of files) {
        await fs.unlink(path.join(testLogDir, f))
      }
      await fs.rmdir(testLogDir)
    } catch {}
  })

  test('should initialize with custom options', () => {
    expect(manager.logDir).toBe(testLogDir)
    expect(manager.maxAge).toBe(7)
    expect(manager.maxSize).toBe(1024 * 1024)
  })

  test('should have default options', () => {
    const defaultManager = new LogRotationManager({})
    expect(defaultManager.maxAge).toBe(30)
    expect(defaultManager.maxSize).toBe(10 * 1024 * 1024)
    defaultManager.stop()
  })

  test('should start and stop timer', () => {
    manager.start()
    expect(manager.timer).not.toBeNull()
    manager.stop()
    expect(manager.timer).toBeNull()
  })

  test('stop() should be idempotent', () => {
    manager.stop()
    manager.stop()
    expect(manager.timer).toBeNull()
  })

  test('should clean up old log files', async () => {
    // Create a "old" file by writing then changing mtime
    const oldFile = path.join(testLogDir, 'old.log')
    await fs.writeFile(oldFile, 'old log content')

    // Set file modification time to 30 days ago
    const oldTime = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    await fs.utimes(oldFile, oldTime, oldTime)

    // Create a recent file
    const newFile = path.join(testLogDir, 'new.log')
    await fs.writeFile(newFile, 'new log content')

    const result = await manager.cleanupOldLogs()
    expect(result.deleted).toBeGreaterThanOrEqual(1)

    // New file should still exist
    const remaining = await fs.readdir(testLogDir)
    expect(remaining).toContain('new.log')
  })

  test('rotate() should return stats object', async () => {
    const result = await manager.rotate()
    expect(result).toHaveProperty('deleted')
    expect(result).toHaveProperty('freed')
    expect(result).toHaveProperty('compressed')
  })
})
