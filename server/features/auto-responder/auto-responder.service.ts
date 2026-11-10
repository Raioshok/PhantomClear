import { discord } from '../../services/discord.service'
import { logger } from '../../core/logger'
import { broadcastWSEvent } from '../../core/websocket'

export interface AutoResponderLog {
  id: string
  userId: string
  username: string
  content: string
  reply: string
  channelId: string
  timestamp: string
}

export interface NitroClaimLog {
  code: string
  author: string
  guildId?: string
  channelId: string
  status: 'claimed' | 'already_redeemed' | 'invalid' | 'rate_limited' | 'failed'
  details?: string
  timestamp: string
}

export interface AutoResponderConfig {
  autoReplyEnabled: boolean
  replyMessage: string
  onlyDMs: boolean
  cooldownMinutes: number
  nitroSnifferEnabled: boolean
}

class AutoResponderService {
  private config: AutoResponderConfig = {
    autoReplyEnabled: false,
    replyMessage: 'Estou ausente no momento. Mensagem automática via PhantomClear.',
    onlyDMs: true,
    cooldownMinutes: 5,
    nitroSnifferEnabled: false,
  }

  private userCooldowns = new Map<string, number>()
  private logs: AutoResponderLog[] = []
  private nitroLogs: NitroClaimLog[] = []
  private boundClient: any = null

  constructor() {
    discord.onActiveClientChange((client) => {
      this.attachListener(client)
    })
  }

  getConfig() {
    return { ...this.config }
  }

  updateConfig(cfg: Partial<AutoResponderConfig>) {
    this.config = { ...this.config, ...cfg }
    return this.getConfig()
  }

  getLogs() {
    return {
      autoReplyLogs: this.logs.slice(-50),
      nitroLogs: this.nitroLogs.slice(-50),
    }
  }

  private attachListener(client: any) {
    if (!client) {
      this.boundClient = null
      return
    }
    if (this.boundClient === client) return
    this.boundClient = client

    client.on('messageCreate', async (message: any) => {
      if (!message || message.author?.id === client.user?.id) return

      // 1. Nitro Sniffer
      if (this.config.nitroSnifferEnabled && message.content) {
        this.sniffNitro(message)
      }

      // 2. Auto-responder
      if (this.config.autoReplyEnabled && message.content) {
        this.handleAutoReply(message)
      }
    })
  }

  private async sniffNitro(message: any) {
    const regex = /(?:discord\.gift|discord\.com\/gifts|discordapp\.com\/gifts)\/([a-zA-Z0-9]+)/gi
    let match: RegExpExecArray | null
    while ((match = regex.exec(message.content)) !== null) {
      const code = match[1]
      logger.info('NitroSniffer', `Detectado código de gift: ${code} por ${message.author?.tag}`)
      await this.claimNitro(code, message)
    }
  }

  private async claimNitro(code: string, message: any) {
    const token = discord.getActiveToken()
    if (!token) return

    try {
      const res = await fetch(`https://discord.com/api/v10/entitlements/gift-codes/${code}/redeem`, {
        method: 'POST',
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ channel_id: message.channel?.id }),
      })

      const data = await res.json().catch(() => ({})) as any
      let status: NitroClaimLog['status'] = 'failed'
      let details = ''

      if (res.ok) {
        status = 'claimed'
        details = 'Resgatado com sucesso!'
        logger.success('NitroSniffer', `🎉 GIFT RESGATADO: ${code}`)
      } else if (data.code === 50050) {
        status = 'already_redeemed'
        details = 'Gift já foi resgatado por outro usuário.'
      } else if (data.code === 10038) {
        status = 'invalid'
        details = 'Código de presente inválido.'
      } else {
        status = 'failed'
        details = data.message || `HTTP ${res.status}`
      }

      const logItem: NitroClaimLog = {
        code,
        author: message.author?.tag || message.author?.username || 'Desconhecido',
        guildId: message.guild?.id,
        channelId: message.channel?.id,
        status,
        details,
        timestamp: new Date().toISOString(),
      }

      this.nitroLogs.unshift(logItem)
      broadcastWSEvent('nitro:claim-result', logItem)
    } catch (err) {
      logger.error('NitroSniffer', `Erro ao tentar resgatar ${code}: ${err}`)
    }
  }

  private async handleAutoReply(message: any) {
    const isDM = message.channel?.type === 'DM' || message.channel?.type === 1
    const isMention = message.mentions?.users?.has(this.boundClient?.user?.id)

    if (this.config.onlyDMs && !isDM) return
    if (!this.config.onlyDMs && !isDM && !isMention) return

    const authorId = message.author?.id
    const now = Date.now()
    const cooldownMs = this.config.cooldownMinutes * 60 * 1000
    const lastReply = this.userCooldowns.get(authorId) || 0

    if (now - lastReply < cooldownMs) return

    this.userCooldowns.set(authorId, now)

    try {
      await message.reply(this.config.replyMessage)
      const logItem: AutoResponderLog = {
        id: message.id,
        userId: authorId,
        username: message.author?.tag || message.author?.username || 'Usuário',
        content: message.content,
        reply: this.config.replyMessage,
        channelId: message.channel?.id,
        timestamp: new Date().toISOString(),
      }
      this.logs.unshift(logItem)
      broadcastWSEvent('auto-responder:replied', logItem)
      logger.info('AutoResponder', `Respondido para ${logItem.username}`)
    } catch (err) {
      logger.warn('AutoResponder', `Falha ao responder ${authorId}: ${err}`)
    }
  }
}

export const autoResponder = new AutoResponderService()
