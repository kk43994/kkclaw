// Tests for GlobalErrorHandler
const EventEmitter = require('events')

// Remove process listeners set by GlobalErrorHandler after each test
const originalListeners = {}

beforeAll(() => {
  // Save original listeners
  for (const event of ['uncaughtException', 'unhandledRejection', 'warning']) {
    originalListeners[event] = process.listeners(event).slice()
  }
})

afterAll(() => {
  // Restore original listeners
  for (const event of Object.keys(originalListeners)) {
    process.removeAllListeners(event)
    for (const fn of originalListeners[event]) {
      process.on(event, fn)
    }
  }
})

const GlobalErrorHandler = require('../../global-error-handler')

describe('GlobalErrorHandler', () => {
  let handler

  beforeEach(() => {
    handler = new GlobalErrorHandler({
      exitOnCritical: false,
      notifyOnError: false,
      logErrors: false,
    })
  })

  test('should be an EventEmitter', () => {
    expect(handler).toBeInstanceOf(EventEmitter)
  })

  test('should initialize with default options', () => {
    expect(handler.options.maxRecoveryAttempts).toBe(3)
    expect(handler.options.recoveryDelay).toBe(1000)
  })

  test('should track errors in errors array', () => {
    expect(handler.errors).toEqual([])
    expect(handler.maxErrors).toBe(100)
  })

  test('should define critical error codes', () => {
    expect(handler.criticalErrors.has('ENOSPC')).toBe(true)
    expect(handler.criticalErrors.has('ENOMEM')).toBe(true)
    expect(handler.criticalErrors.has('ERR_OUT_OF_MEMORY')).toBe(true)
  })

  test('should initialize recovery attempts as empty Map', () => {
    expect(handler.recoveryAttempts).toBeInstanceOf(Map)
    expect(handler.recoveryAttempts.size).toBe(0)
  })

  test('should accept custom options', () => {
    const custom = new GlobalErrorHandler({
      exitOnCritical: false,
      maxRecoveryAttempts: 5,
      recoveryDelay: 2000,
    })
    expect(custom.options.maxRecoveryAttempts).toBe(5)
    expect(custom.options.recoveryDelay).toBe(2000)
    expect(custom.options.exitOnCritical).toBe(false)
  })
})
