import { discord } from '../../services/discord.service'
import { storage } from '../../services/storage.service'
import { taskManager } from '../../services/task-manager.service'
import { sleep } from '../../utils/helpers'
import { logger } from '../../core/logger'
import { broadcastWSEvent } from '../../core/websocket'

export interface AutoBumpConfig {
  guildId: string
  channelId: string
  intervalMinutes: number // Default 120 (2h)
  jitterMinutes: number   // Random delay 1-5m
  mode: 'slash' | 'text'  // 'slash' (/bump) or 'text' (!d bump)
  bumpCarlBot: boolean    // Also bump Carl-bot (!bump / /bump)
}

export interface AutoBumpStatus {
  active: boolean
  guildId: string | null
  guildName: string | null
  channelId: string | null
  channelName: string | null
  lastBumpAt: string | null
  nextBumpAt: string | null
  totalBumps: number
  lastStatus: 'success' | 'failed' | 'cooldown' | 'idle'
  lastMessage: string
  carlBotBumped?: boolean
}

const DISBOARD_BOT_ID = '302050872383242240'
const CARLBOT_BOT_ID = '235148962103951360'

class AutoBumpService {
  private config: AutoBumpConfig = {
    guildId: '',
    channelId: '',
    intervalMinutes: 120,
    jitterMinutes: 2,
    mode: 'slash',
    bumpCarlBot: true,
  }

  private isRunning = false
  private timer: NodeJS.Timeout | null = null
  private totalBumps = 0
  private lastBumpAt: number | null = null
  private nextBumpAt: number | null = null
  private lastStatus: AutoBumpStatus['lastStatus'] = 'idle'
  private lastMessage = 'Nenhum bump executado ainda.'
  private taskId: string | null = null

  getConfig(): AutoBumpConfig {
    return { ...this.config }
  }

  getStatus(): AutoBumpStatus {
    const client = discord.getActiveClient()
    let guildName = null
    let channelName = null

    if (client && client.isReady() && this.config.guildId) {
      const g = client.guilds.cache.get(this.config.guildId)
      if (g) guildName = g.name
      const c = client.channels.cache.get(this.config.channelId)
      if (c) channelName = c.name
    }

    return {
      active: this.isRunning,
      guildId: this.config.guildId || null,
      guildName,
      channelId: this.config.channelId || null,
      channelName,
      lastBumpAt: this.lastBumpAt ? new Date(this.lastBumpAt).toISOString() : null,
      nextBumpAt: this.nextBumpAt ? new Date(this.nextBumpAt).toISOString() : null,
      totalBumps: this.totalBumps,
      lastStatus: this.lastStatus,
      lastMessage: this.lastMessage,
      carlBotBumped: this.config.bumpCarlBot,
    }
  }

  async start(cfg: Partial<AutoBumpConfig>): Promise<AutoBumpStatus> {
    if (this.isRunning) {
      this.stop()
    }

    this.config = {
      ...this.config,
      ...cfg,
    }

    if (!this.config.channelId) {
      throw Object.assign(new Error('ID do canal é obrigatório para o Disboard Auto-Bumper'), { statusCode: 400 })
    }

    this.isRunning = true
    this.lastStatus = 'idle'
    this.lastMessage = 'Disboard & Carlbot Auto-Bumper iniciado.'

    const task = taskManager.createTask('call-utils' as any, {
      total: 100,
      phase: 'Disboard & Carlbot Auto-Bumper ativo',
    })
    this.taskId = task.id
    taskManager.startTask(task.id)

    logger.info('AutoBump', `Iniciando auto-bump no canal ${this.config.channelId}`)
    broadcastWSEvent('autobump:status', this.getStatus())

    // Trigger first bump immediately
    this.executeBump().catch(() => {})

    return this.getStatus()
  }

  stop(): AutoBumpStatus {
    this.isRunning = false
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }

    if (this.taskId) {
      taskManager.completeTask(this.taskId)
      this.taskId = null
    }

    this.lastStatus = 'idle'
    this.lastMessage = 'Disboard Auto-Bumper parado.'
    logger.info('AutoBump', 'Auto-bumper parado pelo usuário.')
    broadcastWSEvent('autobump:status', this.getStatus())

    return this.getStatus()
  }

  private scheduleNext(customMinutes?: number) {
    if (!this.isRunning) return

    const minutes = customMinutes ?? this.config.intervalMinutes
    const baseMs = minutes * 60 * 1000
    const jitterMs = Math.floor(Math.random() * Math.max(1, this.config.jitterMinutes) * 60 * 1000)
    const totalDelay = baseMs + jitterMs

    this.nextBumpAt = Date.now() + totalDelay
    logger.info(
      'AutoBump',
      `Próximo bump agendado para ${new Date(this.nextBumpAt).toLocaleTimeString()} (${Math.round(totalDelay / 60000)}m)`
    )
    broadcastWSEvent('autobump:status', this.getStatus())

    this.timer = setTimeout(() => {
      this.executeBump().catch(() => {})
    }, totalDelay)
  }

  private async executeBump(): Promise<boolean> {
    if (!this.isRunning) return false

    let client = discord.getActiveClient()
    const token = discord.getActiveToken() || storage.getTokens().find((t) => t.status === 'valid')?.token

    // Auto-connect if client is offline or reconnecting
    if (!client || !client.isReady()) {
      if (token) {
        logger.info('AutoBump', 'Discord client offline. Tentando auto-conectar...')
        try {
          await discord.connect(token)
          client = discord.getActiveClient()
        } catch (e: any) {
          logger.warn('AutoBump', `Auto-conexão falhou: ${e.message}`)
        }
      }
    }

    this.lastBumpAt = Date.now()
    let disboardSuccess = false
    let carlbotSuccess = false
    const results: string[] = []

    // 1. DISBOARD BUMP
    try {
      if (client && client.isReady()) {
        const channel =
          client.channels.cache.get(this.config.channelId) ||
          (await client.channels.fetch(this.config.channelId).catch(() => null))

        if (channel) {
          if (this.config.mode === 'slash' && typeof channel.sendSlash === 'function') {
            try {
              await channel.sendSlash(DISBOARD_BOT_ID, 'bump')
              disboardSuccess = true
              results.push('Disboard /bump enviado via slash command')
            } catch (slashErr: any) {
              logger.warn('AutoBump', `sendSlash Disboard falhou (${slashErr.message}), tentando fallback texto...`)
              await channel.send('!d bump')
              disboardSuccess = true
              results.push('Disboard !d bump enviado via texto')
            }
          } else {
            await channel.send('!d bump')
            disboardSuccess = true
            results.push('Disboard !d bump enviado via texto')
          }
        }
      }

      // REST API fallback for Disboard if gateway failed
      if (!disboardSuccess && token) {
        logger.info('AutoBump', 'Enviando Disboard !d bump via REST fallback...')
        const res = await fetch(`https://discord.com/api/v9/channels/${this.config.channelId}/messages`, {
          method: 'POST',
          headers: {
            Authorization: token,
            'Content-Type': 'application/json',
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) discord/1.0.9215 Chrome/138.0.7204.251 Electron/37.6.0 Safari/537.36',
          },
          body: JSON.stringify({ content: '!d bump' }),
        })
        if (res.ok) {
          disboardSuccess = true
          results.push('Disboard !d bump enviado via REST fallback')
        }
      }
    } catch (err: any) {
      logger.error('AutoBump', `Erro no bump do Disboard: ${err.message}`)
    }

    // 2. CARLBOT BUMP (if enabled)
    if (this.config.bumpCarlBot) {
      await sleep(3500) // Natural delay between bot bumps to prevent anti-spam
      try {
        if (client && client.isReady()) {
          const channel =
            client.channels.cache.get(this.config.channelId) ||
            (await client.channels.fetch(this.config.channelId).catch(() => null))

          if (channel) {
            if (this.config.mode === 'slash' && typeof channel.sendSlash === 'function') {
              try {
                await channel.sendSlash(CARLBOT_BOT_ID, 'bump')
                carlbotSuccess = true
                results.push('Carl-bot /bump enviado via slash command')
              } catch {
                await channel.send('!bump')
                carlbotSuccess = true
                results.push('Carl-bot !bump enviado via texto')
              }
            } else {
              await channel.send('!bump')
              carlbotSuccess = true
              results.push('Carl-bot !bump enviado via texto')
            }
          }
        }

        // REST fallback for Carlbot
        if (!carlbotSuccess && token) {
          const res = await fetch(`https://discord.com/api/v9/channels/${this.config.channelId}/messages`, {
            method: 'POST',
            headers: {
              Authorization: token,
              'Content-Type': 'application/json',
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) discord/1.0.9215 Chrome/138.0.7204.251 Electron/37.6.0 Safari/537.36',
            },
            body: JSON.stringify({ content: '!bump' }),
          })
          if (res.ok) {
            carlbotSuccess = true
            results.push('Carl-bot !bump enviado via REST fallback')
          }
        }
      } catch (err: any) {
        logger.error('AutoBump', `Erro no bump do Carl-bot: ${err.message}`)
      }
    }

    if (disboardSuccess || carlbotSuccess) {
      this.totalBumps++
      this.lastStatus = 'success'
      this.lastMessage = results.join(' • ')
      logger.success('AutoBump', `🚀 BUMP CONCLUÍDO! (${this.lastMessage})`)

      broadcastWSEvent('autobump:bumped', {
        total: this.totalBumps,
        channelId: this.config.channelId,
        timestamp: new Date().toISOString(),
      })

      this.scheduleNext()
      return true
    } else {
      this.lastStatus = 'failed'
      this.lastMessage = 'Falha ao despachar bump: verifique o ID do canal e se a conta tem acesso a ele.'
      logger.error('AutoBump', this.lastMessage)
      this.scheduleNext(15) // Retry sooner (15 min) on failure instead of waiting 2 hours
      return false
    }
  }
}

export const autoBump = new AutoBumpService()
