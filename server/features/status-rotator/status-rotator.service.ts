import { discord } from '../../services/discord.service'
import { logger } from '../../core/logger'
import { broadcastWSEvent } from '../../core/websocket'

export interface CustomStatusItem {
  text: string
  emoji?: string
  status?: 'online' | 'idle' | 'dnd' | 'invisible'
}

export interface StatusRotatorConfig {
  enabled: boolean
  intervalSeconds: number
  statuses: CustomStatusItem[]
  rotateBio?: boolean
  bios?: string[]
}

class StatusRotatorService {
  private config: StatusRotatorConfig = {
    enabled: false,
    intervalSeconds: 30,
    statuses: [
      { text: 'PhantomClear V2', emoji: '⚡', status: 'dnd' },
      { text: 'github.com/Raioshok', emoji: '🛡️', status: 'online' },
      { text: 'Stealth & Privacy', emoji: '👻', status: 'idle' },
    ],
    rotateBio: false,
    bios: [],
  }

  private timer: NodeJS.Timeout | null = null
  private statusIndex = 0
  private bioIndex = 0

  getConfig(): StatusRotatorConfig {
    return { ...this.config }
  }

  updateConfig(cfg: Partial<StatusRotatorConfig>): StatusRotatorConfig {
    this.config = { ...this.config, ...cfg }
    if (this.config.intervalSeconds < 10) this.config.intervalSeconds = 10
    if (this.config.enabled) {
      this.start()
    } else {
      this.stop()
    }
    return this.getConfig()
  }

  start(): void {
    this.stop()
    this.config.enabled = true
    logger.info('StatusRotator', `Iniciando rotação de status a cada ${this.config.intervalSeconds}s`)
    this.rotate()
    this.timer = setInterval(() => {
      this.rotate()
    }, this.config.intervalSeconds * 1000)
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    this.config.enabled = false
    logger.info('StatusRotator', 'Rotação de status desativada')
  }

  private async rotate(): Promise<void> {
    const client = discord.getActiveClient()
    if (!client || !client.isReady()) return

    // 1. Rotate status
    if (this.config.statuses.length > 0) {
      const item = this.config.statuses[this.statusIndex % this.config.statuses.length]
      this.statusIndex++

      try {
        const presenceData: any = {
          status: item.status || 'online',
          activities: [
            {
              name: 'Custom Status',
              type: 'CUSTOM',
              state: item.text,
              emoji: item.emoji ? { name: item.emoji } : undefined,
            },
          ],
        }
        await client.user.setPresence(presenceData)
        broadcastWSEvent('status-rotator:tick', {
          currentStatus: item,
          nextInSeconds: this.config.intervalSeconds,
        })
      } catch (err) {
        logger.warn('StatusRotator', `Falha ao definir status: ${err}`)
      }
    }

    // 2. Rotate bio
    if (this.config.rotateBio && this.config.bios && this.config.bios.length > 0) {
      const bioText = this.config.bios[this.bioIndex % this.config.bios.length]
      this.bioIndex++
      const token = discord.getActiveToken()
      if (token) {
        try {
          await discord.request('/users/@me/profile', token, {
            method: 'PATCH',
            body: JSON.stringify({ bio: bioText }),
          })
          logger.debug('StatusRotator', `Bio atualizada: "${bioText.slice(0, 30)}..."`)
        } catch (err) {
          logger.warn('StatusRotator', `Falha ao rotacionar bio: ${err}`)
        }
      }
    }
  }
}

export const statusRotator = new StatusRotatorService()
