const { buildRunCommand } = require('../../scripts/open-terminal')
const {
  buildChildEnv,
  describeDefault,
  getDefaultChoice,
  resolveLauncherDefault,
  resolveModeInput,
} = require('../../scripts/launch-console')

describe('launch console helpers', () => {
  test('buildRunCommand launches the backend selector script by default', () => {
    expect(buildRunCommand({ projectPath: '/tmp/kkclaw' })).toBe(
      'cd "/tmp/kkclaw" && node scripts/launch-console.js'
    )
  })

  test('resolveModeInput accepts menu keys and labels', () => {
    expect(resolveModeInput('1', 'auto')).toBe('openclaw')
    expect(resolveModeInput('2', 'auto')).toBe('hermes')
    expect(resolveModeInput('3', 'openclaw')).toBe('auto')
    expect(resolveModeInput('Hermes', 'openclaw')).toBe('hermes')
    expect(resolveModeInput('', 'auto')).toBe('auto')
    expect(resolveModeInput('', null)).toBeNull()
    expect(resolveModeInput('bad-choice', 'auto')).toBeNull()
  })

  test('buildChildEnv injects the selected compat mode', () => {
    const originalValue = process.env.KKCLAW_COMPAT_MODE
    process.env.KKCLAW_COMPAT_MODE = 'openclaw'

    const hermesEnv = buildChildEnv('hermes')
    const autoEnv = buildChildEnv('auto')
    const clearEnv = buildChildEnv('invalid')

    expect(hermesEnv.KKCLAW_COMPAT_MODE).toBe('hermes')
    expect(autoEnv.KKCLAW_COMPAT_MODE).toBe('auto')
    expect(clearEnv.KKCLAW_COMPAT_MODE).toBeUndefined()

    if (typeof originalValue === 'undefined') {
      delete process.env.KKCLAW_COMPAT_MODE
    } else {
      process.env.KKCLAW_COMPAT_MODE = originalValue
    }
  })

  test('default choice and label reflect saved preference and auto fallback', () => {
    const hermesSnapshot = {
      preference: { mode: 'hermes', source: 'pet-config' },
      activeMode: 'hermes',
      active: { label: 'Hermes' },
    }

    expect(getDefaultChoice(hermesSnapshot, { compatMode: 'hermes' })).toBe('hermes')
    expect(describeDefault(hermesSnapshot, 'hermes', { fixed: true })).toBe('Hermes (fixed)')
  })

  test('first launch requires an explicit choice when nothing is saved', () => {
    const snapshot = {
      preference: { mode: 'auto', source: 'auto' },
      activeMode: 'openclaw',
      active: { label: 'OpenClaw' },
    }

    expect(resolveLauncherDefault(snapshot, {})).toEqual({
      mode: null,
      source: 'first-launch',
      fixed: false,
      requiresChoice: true,
    })
    expect(getDefaultChoice(snapshot, {})).toBeNull()
  })

  test('stored settings override first-launch prompting', () => {
    const snapshot = {
      preference: { mode: 'auto', source: 'auto' },
      activeMode: 'openclaw',
      active: { label: 'OpenClaw' },
    }

    expect(resolveLauncherDefault(snapshot, { lastCompatMode: 'hermes' })).toEqual({
      mode: 'hermes',
      source: 'pet-config.lastCompatMode',
      fixed: false,
      requiresChoice: false,
    })
    expect(resolveLauncherDefault(snapshot, { compatMode: 'auto', lastCompatMode: 'hermes' })).toEqual({
      mode: 'auto',
      source: 'pet-config.compatMode',
      fixed: true,
      requiresChoice: false,
    })
    expect(getDefaultChoice(snapshot, { compatMode: 'hermes' })).toBe('hermes')
  })

})
