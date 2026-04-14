jest.mock('../../utils/openclaw-path-resolver', () => ({
  getConfigPath: jest.fn(() => '/Users/test/.openclaw/openclaw.json'),
}))

jest.mock('../../utils/config-manager', () => ({
  getConfig: jest.fn(() => ({})),
}))

jest.mock('../../utils/backend-compat', () => ({
  resolve: jest.fn(() => ({
    active: {
      mode: 'hermes',
      apiServerEnabled: false,
      chatBlockReason: 'Hermes API server 未启用，请在 ~/.hermes/.env 中设置 API_SERVER_ENABLED=true 后重启 Hermes。',
      apiHost: 'http://127.0.0.1:8642',
      apiKey: '',
      apiKeyHeader: {},
      model: 'hermes-agent',
    },
  })),
}))

jest.mock('../../utils/log-sanitizer', () => ({
  sanitizeMessage: jest.fn((value) => value),
}))

jest.mock('../../utils/secure-storage', () => ({
  getSecureToken: jest.fn(() => ''),
}))

jest.mock('../../utils/session-lock-manager', () => ({
  isPluginSessionKey: jest.fn(() => false),
  cleanupPluginSessions: jest.fn(() => ({ deletedSessions: 0, removedLocks: 0, skippedLocked: 0 })),
}))

const GatewayClient = require('../../gateway-client')

describe('gateway client', () => {
  const originalFetch = global.fetch
  const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

  afterEach(() => {
    global.fetch = originalFetch
  })

  afterAll(() => {
    errorSpy.mockRestore()
  })

  test('blocks Hermes chat requests when the API server is disabled', async () => {
    global.fetch = jest.fn()
    const client = new GatewayClient()

    await expect(client.sendMessage('hello')).resolves.toContain('Hermes API server 未启用')
    expect(global.fetch).not.toHaveBeenCalled()
  })
})
