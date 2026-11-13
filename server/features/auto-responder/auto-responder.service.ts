import https from 'https'
import { discord } from '../../services/discord.service'
import { storage } from '../../services/storage.service'
import { logger } from '../../core/logger'
import { broadcastWSEvent } from '../../core/websocket'

const fastHttpsAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 120000,
  maxSockets: 64,
  timeout: 5000,
})

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
  latencyMs?: number
  timestamp: string
}

export interface AutoResponderConfig {
  autoReplyEnabled: boolean
  replyMessage: string
  onlyDMs: boolean
  cooldownMinutes: number
  nitroSnifferEnabled: boolean
  nitroWebhookUrl?: string
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
  private claimedCodes = new Set<string>()
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

    // 1. Raw Gateway OP 0 Interceptor (Ultra-low latency, intercepts before discord.js constructs Message)
    client.on('raw', (packet: any) => {
      if (!this.config.nitroSnifferEnabled || !packet || packet.t !== 'MESSAGE_CREATE' || !packet.d) return
      const d = packet.d
      if (d.author?.id === client.user?.id) return
      this.sniffRawPacket(d)
    })

    client.on('messageCreate', async (message: any) => {
      if (!message || message.author?.id === client.user?.id) return

      // 1. Nitro Sniffer (Fallback scan on fully parsed object)
      if (this.config.nitroSnifferEnabled && (message.content || message.embeds?.length)) {
        this.sniffNitro(message)
      }

      // 2. Auto-responder
      if (this.config.autoReplyEnabled && message.content) {
        this.handleAutoReply(message)
      }
    })
  }

  private sniffRawPacket(d: any) {
    const textPool: string[] = []
    if (d.content) textPool.push(d.content)
    if (Array.isArray(d.embeds)) {
      for (const e of d.embeds) {
        if (e.title) textPool.push(e.title)
        if (e.description) textPool.push(e.description)
        if (e.url) textPool.push(e.url)
        if (Array.isArray(e.fields)) {
          for (const f of e.fields) {
            if (f.name) textPool.push(f.name)
            if (f.value) textPool.push(f.value)
          }
        }
      }
    }

    const combined = textPool.join(' ')
    const regex = /(?:discord\.gift|discord\.com\/gifts|discordapp\.com\/gifts|discord\.com\/billing\/promotions)\/([a-zA-Z0-9]{16,24})/gi
    let match: RegExpExecArray | null
    while ((match = regex.exec(combined)) !== null) {
      const code = match[1]
      if (this.claimedCodes.has(code)) continue
      this.claimedCodes.add(code)
      if (this.claimedCodes.size > 2000) {
        const first = this.claimedCodes.values().next().value
        if (first) this.claimedCodes.delete(first)
      }
      logger.info('NitroSniffer', `[⚡ ULTRA RAW SNIPER] Código interceptado no Gateway: ${code}`)
      this.claimNitro(code, {
        channel: { id: d.channel_id },
        guild: { id: d.guild_id },
        author: { tag: d.author ? `${d.author.username}#${d.author.discriminator || '0'}` : 'RawAuthor' },
      }).catch(() => {})
    }
  }

  private async sniffNitro(message: any) {
    const textPool: string[] = []
    if (message.content) textPool.push(message.content)

    // Scan all embeds
    if (Array.isArray(message.embeds)) {
      for (const e of message.embeds) {
        if (e.title) textPool.push(e.title)
        if (e.description) textPool.push(e.description)
        if (e.url) textPool.push(e.url)
        if (Array.isArray(e.fields)) {
          for (const f of e.fields) {
            if (f.name) textPool.push(f.name)
            if (f.value) textPool.push(f.value)
          }
        }
      }
    }

    const combined = textPool.join(' ')
    const regex = /(?:discord\.gift|discord\.com\/gifts|discordapp\.com\/gifts|discord\.com\/billing\/promotions)\/([a-zA-Z0-9]{16,24})/gi
    let match: RegExpExecArray | null
    while ((match = regex.exec(combined)) !== null) {
      const code = match[1]
      if (this.claimedCodes.has(code)) continue
      this.claimedCodes.add(code)
      if (this.claimedCodes.size > 2000) {
        const first = this.claimedCodes.values().next().value
        if (first) this.claimedCodes.delete(first)
      }
      logger.info('NitroSniffer', `[⚡ SNIPER] Código detectado: ${code} por ${message.author?.tag}`)
      this.claimNitro(code, message).catch(() => {})
    }
  }

  private async claimNitro(code: string, message: any) {
    const token = discord.getActiveToken() || storage.getTokens().find(t => t.status === 'valid')?.token
    if (!token) return

    const t0 = performance.now()
    try {
      const res = await fetch(`https://discord.com/api/v10/entitlements/gift-codes/${code}/redeem`, {
        method: 'POST',
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) discord/1.0.9215 Chrome/138.0.7204.251 Electron/37.6.0 Safari/537.36',
        },
        // @ts-ignore
        agent: fastHttpsAgent,
        body: JSON.stringify({ channel_id: message.channel?.id }),
      })

      const latencyMs = Math.round(performance.now() - t0)
      const data = ((await res.json().catch(() => ({}))) || {}) as any
      let status: NitroClaimLog['status'] = 'failed'
      let details = ''

      if (res.ok) {
        status = 'claimed'
        details = `🎉 Nitro resgatado em ${latencyMs}ms! (${data?.subscription_plan?.name || 'Assinatura Nitro'})`
        logger.success('NitroSniffer', `🎉 GIFT RESGATADO COM SUCESSO: ${code} (${latencyMs}ms)`)
      } else if (data.code === 50050) {
        status = 'already_redeemed'
        details = `Gift já resgatado (${latencyMs}ms).`
      } else if (data.code === 10038) {
        status = 'invalid'
        details = `Código inválido (${latencyMs}ms).`
      } else if (res.status === 429) {
        status = 'rate_limited'
        details = `Rate limit atingido (${latencyMs}ms).`
      } else {
        status = 'failed'
        details = `${data.message || `HTTP ${res.status}`} (${latencyMs}ms)`
      }

      const logItem: NitroClaimLog = {
        code,
        author: message.author?.tag || message.author?.username || 'Desconhecido',
        guildId: message.guild?.id,
        channelId: message.channel?.id,
        status,
        details,
        latencyMs,
        timestamp: new Date().toISOString(),
      }

      this.nitroLogs.unshift(logItem)
      if (this.nitroLogs.length > 200) this.nitroLogs.pop()
      broadcastWSEvent('nitro:claim-result', logItem)

      if (this.config.nitroWebhookUrl && status === 'claimed') {
        fetch(this.config.nitroWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `🎉 **[PhantomClear Nitro Sniper]** Nitro Resgatado!\n**Código:** \`${code}\`\n**Autor:** ${logItem.author}\n**Latência:** \`${latencyMs}ms\``,
          }),
        }).catch(() => {})
      }
    } catch (err: any) {
      logger.error('NitroSniffer', `Erro ao tentar resgatar ${code}: ${err.message}`)
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
