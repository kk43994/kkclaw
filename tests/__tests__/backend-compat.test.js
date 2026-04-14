jest.mock('child_process', () => ({
  execSync: jest.fn(() => {
    throw new Error('cli not found')
  }),
  execFileSync: jest.fn(),
}))

describe('backend compat', () => {
  afterEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  test('does not treat a leftover Hermes config directory as installed when the CLI is missing', () => {
    jest.doMock('fs', () => {
      const actual = jest.requireActual('fs')
      return {
        ...actual,
        existsSync: jest.fn((target) => {
          const normalized = String(target)
          if (normalized === '/Users/test/.hermes') {
            return true
          }
          if (
            normalized === '/Users/test/.local/bin/hermes' ||
            normalized === '/Users/test/.hermes/.env' ||
            normalized === '/Users/test/.hermes/config.yaml'
          ) {
            return false
          }
          return false
        }),
        readFileSync: jest.fn(() => ''),
      }
    })

    jest.doMock('../../utils/path-resolver', () => ({
      getUserHome: jest.fn(() => '/Users/test'),
      getProjectRoot: jest.fn(() => '/repo/kkclaw'),
      getOpenClawConfigDir: jest.fn(() => '/Users/test/.openclaw'),
      getOpenClawConfigPath: jest.fn(() => '/Users/test/.openclaw/openclaw.json'),
    }))

    jest.doMock('../../utils/openclaw-path-resolver', () => ({
      findOpenClawCliPath: jest.fn(() => '/opt/homebrew/bin/openclaw'),
      resolveOpenClawInvocation: jest.fn(() => ({
        command: '/opt/homebrew/bin/openclaw',
        args: [],
        cwd: '/opt/homebrew/bin',
      })),
    }))

    jest.doMock('../../utils/safe-config-loader', () => ({
      load: jest.fn(() => ({})),
    }))

    const backendCompat = require('../../utils/backend-compat')
    const result = backendCompat.resolve()

    expect(result.hermes.installed).toBe(false)
    expect(result.hermes.cliPath).toBeNull()
    expect(result.active.mode).toBe('openclaw')
  })
})
