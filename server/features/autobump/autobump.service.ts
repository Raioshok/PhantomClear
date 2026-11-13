import { discord } from '../../services/discord.service'
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
}

const DISBOARD_BOT_ID = '302050872383242240'

class AutoBumpService {
  private config: AutoBumpConfig = {
    guildId: '',
    channelId: '',
    intervalMinutes: 120,
    jitterMinutes: 2,
    mode: 'slash',
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
    this.lastMessage = 'Disboard Auto-Bumper iniciado.'

    const task = taskManager.createTask('call-utils' as any, {
      total: 100,
      phase: 'Disboard Auto-Bumper ativo',
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

  private scheduleNext() {
    if (!this.isRunning) return

    // Base interval in ms (e.g. 120 minutes = 7,200,000 ms)
    const baseMs = this.config.intervalMinutes * 60 * 1000
    // Add random jitter (1 to jitterMinutes)
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

    const client = discord.getActiveClient()
    if (!client || !client.isReady()) {
      this.lastStatus = 'failed'
      this.lastMessage = 'Discord Client não está conectado.'
      logger.warn('AutoBump', 'Falha ao executar bump: cliente Discord offline')
      this.scheduleNext()
      return false
    }

    try {
      const channel = client.channels.cache.get(this.config.channelId) || (await client.channels.fetch(this.config.channelId).catch(() => null))
      if (!channel) {
        throw new Error(`Canal de bump ${this.config.channelId} não encontrado.`)
      }

      this.lastBumpAt = Date.now()
      let success = false

      if (this.config.mode === 'slash' && typeof channel.sendSlash === 'function') {
        try {
          await channel.sendSlash(DISBOARD_BOT_ID, 'bump')
          success = true
          this.lastMessage = 'Comando slash /bump enviado com sucesso ao Disboard!'
        } catch (slashErr: any) {
          logger.warn('AutoBump', `sendSlash falhou (${slashErr.message}), tentando modo texto fallback...`)
          await channel.send('!d bump')
          success = true
          this.lastMessage = 'Comando !d bump enviado via texto (fallback).'
        }
      } else {
        await channel.send('!d bump')
        success = true
        this.lastMessage = 'Comando !d bump enviado via texto.'
      }

      this.totalBumps++
      this.lastStatus = 'success'
      logger.success('AutoBump', `🚀 BUMP ENVIADO COM SUCESSO! Total acumulado: ${this.totalBumps}`)

      broadcastWSEvent('autobump:bumped', {
        total: this.totalBumps,
        channelId: this.config.channelId,
        timestamp: new Date().toISOString(),
      })

      this.scheduleNext()
      return true
    } catch (err: any) {
      this.lastStatus = 'failed'
      this.lastMessage = `Erro ao enviar bump: ${err.message}`
      logger.error('AutoBump', `Erro no auto-bump: ${err.message}`)
      this.scheduleNext()
      return false
    }
  }
}

export const autoBump = new AutoBumpService()
