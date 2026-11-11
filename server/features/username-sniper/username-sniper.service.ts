import { discord } from '../../services/discord.service'
import { storage } from '../../services/storage.service'
import { taskManager } from '../../services/task-manager.service'
import { sleep } from '../../utils/helpers'
import { logger } from '../../core/logger'
import { broadcastWSEvent } from '../../core/websocket'

export type UsernamePreset = '3char' | '4char' | '3letter' | '4letter' | 'rare-words' | 'custom'

export interface UsernameSniperConfig {
  preset: UsernamePreset
  customList?: string[]
  delay?: number
  maxChecks?: number
  autoClaim?: boolean
  password?: string
}

export interface UsernameCheckResult {
  username: string
  available: boolean
  status: 'available' | 'taken' | 'rate-limited' | 'claimed' | 'error'
  timestamp: string
}

const RARE_WORDS = [
  'apex', 'aura', 'void', 'echo', 'flux', 'onyx', 'haze', 'nova', 'zero', 'mist',
  'frost', 'drift', 'spec', 'ghost', 'pulse', 'cowl', 'shade', 'phantom', 'veil', 'rift',
  'warp', 'core', 'glow', 'fade', 'dark', 'cyan', 'myth', 'iron', 'volt', 'vibe',
  'byte', 'sync', 'root', 'exec', 'fork', 'ping', 'node', 'link', 'hash', 'lock',
  'blaze', 'dusk', 'dawn', 'bolt', 'spark', 'flare', 'storm', 'surge', 'spark', 'fang',
]

function generateCandidates(preset: UsernamePreset, customList?: string[]): string[] {
  if (preset === 'custom' && customList && customList.length > 0) {
    return [...customList]
  }

  if (preset === 'rare-words') {
    return [...RARE_WORDS].sort(() => Math.random() - 0.5)
  }

  const letters = 'abcdefghijklmnopqrstuvwxyz'
  const alphanumeric = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const candidates: string[] = []

  if (preset === '3letter') {
    for (let i = 0; i < 200; i++) {
      const c1 = letters[Math.floor(Math.random() * letters.length)]
      const c2 = letters[Math.floor(Math.random() * letters.length)]
      const c3 = letters[Math.floor(Math.random() * letters.length)]
      candidates.push(`${c1}${c2}${c3}`)
    }
  } else if (preset === '4letter') {
    for (let i = 0; i < 300; i++) {
      const c1 = letters[Math.floor(Math.random() * letters.length)]
      const c2 = letters[Math.floor(Math.random() * letters.length)]
      const c3 = letters[Math.floor(Math.random() * letters.length)]
      const c4 = letters[Math.floor(Math.random() * letters.length)]
      candidates.push(`${c1}${c2}${c3}${c4}`)
    }
  } else if (preset === '3char') {
    for (let i = 0; i < 200; i++) {
      const c1 = alphanumeric[Math.floor(Math.random() * alphanumeric.length)]
      const c2 = alphanumeric[Math.floor(Math.random() * alphanumeric.length)]
      const c3 = alphanumeric[Math.floor(Math.random() * alphanumeric.length)]
      candidates.push(`${c1}${c2}${c3}`)
    }
  } else if (preset === '4char') {
    for (let i = 0; i < 300; i++) {
      const c1 = alphanumeric[Math.floor(Math.random() * alphanumeric.length)]
      const c2 = alphanumeric[Math.floor(Math.random() * alphanumeric.length)]
      const c3 = alphanumeric[Math.floor(Math.random() * alphanumeric.length)]
      const c4 = alphanumeric[Math.floor(Math.random() * alphanumeric.length)]
      candidates.push(`${c1}${c2}${c3}${c4}`)
    }
  }

  return Array.from(new Set(candidates))
}

class UsernameSniperService {
  private availableFound: string[] = []
  private checkedHistory: UsernameCheckResult[] = []

  getAvailable(): string[] {
    return [...this.availableFound]
  }

  getHistory(): UsernameCheckResult[] {
    return this.checkedHistory.slice(-50)
  }

  async checkUsernameAvailability(username: string, token: string): Promise<{ available: boolean; status: UsernameCheckResult['status'] }> {
    try {
      const res = await fetch('https://discord.com/api/v10/users/@me/pomelo-attempt', {
        method: 'POST',
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      })

      if (res.status === 429) {
        return { available: false, status: 'rate-limited' }
      }

      if (!res.ok) {
        return { available: false, status: 'error' }
      }

      const data = await res.json() as any
      // Discord returns { taken: false } if available
      const isAvailable = data.taken === false
      return { available: isAvailable, status: isAvailable ? 'available' : 'taken' }
    } catch {
      return { available: false, status: 'error' }
    }
  }

  async startSniper(cfg: UsernameSniperConfig): Promise<{ taskId: string; totalCandidates: number }> {
    let token = discord.getActiveToken()
    if (!token) {
      const stored = storage.getTokens()
      if (stored.length > 0) {
        token = stored[0].token
      }
    }

    if (!token) {
      throw Object.assign(new Error('Nenhuma conta Discord cadastrada. Adicione um token na barra lateral antes de iniciar.'), { statusCode: 400 })
    }

    const candidates = generateCandidates(cfg.preset, cfg.customList)
    const delay = Math.max(cfg.delay || 1200, 500)
    const max = cfg.maxChecks ? Math.min(cfg.maxChecks, candidates.length) : candidates.length
    const list = candidates.slice(0, max)

    const task = taskManager.createTask('username-sniper', {
      preset: cfg.preset,
      total: list.length,
      delay,
    })
    const controller = taskManager.startTask(task.id)
    if (!controller) throw new Error('Falha ao iniciar task')

    ;(async () => {
      let checked = 0
      taskManager.updateProgress(task.id, 0, list.length, `Verificando usernames: 0/${list.length}`, 'running')

      for (const targetUser of list) {
        if (taskManager.isAborted(task.id)) break

        const checkRes = await this.checkUsernameAvailability(targetUser, token)
        checked++

        const historyItem: UsernameCheckResult = {
          username: targetUser,
          available: checkRes.available,
          status: checkRes.status,
          timestamp: new Date().toISOString(),
        }

        this.checkedHistory.unshift(historyItem)

        if (checkRes.available) {
          if (!this.availableFound.includes(targetUser)) {
            this.availableFound.unshift(targetUser)
          }
          logger.success('UsernameSniper', `🎯 USERNAME DISPONÍVEL ENCONTRADO: @${targetUser}`)
          broadcastWSEvent('username-sniper:found', { username: targetUser })

          // Auto-claim if enabled
          if (cfg.autoClaim && cfg.password) {
            try {
              const claimRes = await fetch('https://discord.com/api/v10/users/@me', {
                method: 'PATCH',
                headers: {
                  Authorization: token,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username: targetUser, password: cfg.password }),
              })
              if (claimRes.ok) {
                historyItem.status = 'claimed'
                logger.success('UsernameSniper', `👑 USERNAME REIVINDICADO COM SUCESSO: @${targetUser}`)
              }
            } catch (claimErr) {
              logger.error('UsernameSniper', `Falha ao auto-reivindicar @${targetUser}: ${claimErr}`)
            }
          }
        }

        broadcastWSEvent('username-sniper:check', historyItem)
        taskManager.updateProgress(
          task.id,
          checked,
          list.length,
          `Verificado @${targetUser}: ${checkRes.status} (${checked}/${list.length})`,
          'running'
        )

        if (checkRes.status === 'rate-limited') {
          logger.warn('UsernameSniper', 'Rate limit detectado, aguardando 5s...')
          await sleep(5000)
        } else {
          await sleep(delay)
        }
      }

      taskManager.completeTask(task.id)
      logger.info('UsernameSniper', `Varredura de usernames concluída. ${this.availableFound.length} disponíveis encontrados.`)
    })().catch(() => {})

    return { taskId: task.id, totalCandidates: list.length }
  }
}

export const usernameSniper = new UsernameSniperService()
