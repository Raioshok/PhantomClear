import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { discord } from '../../services/discord.service'
import { config } from '../../config'
import { logger } from '../../core/logger'
import { broadcastWSEvent } from '../../core/websocket'
import { sleep } from '../../utils/helpers'
import type { GiveawayJoinerConfig, GiveawayLog, AutoReactorRule } from './giveaway-joiner.types'

const KNOWN_GIVEAWAY_BOTS = new Set([
  '294882584201003009', // GiveawayBot
  '235148962103951360', // Carl-bot
  '155149108183695360', // Dyno
  '204255221017214977', // YAGPDB.xyz
  '282859044593598464', // ProBot
])

const HONEYPOT_KEYWORDS = [
  'test',
  'fake',
  'ban',
  'selfbot',
  'honeypot',
  'trap',
  'do not enter',
  'dont react',
  'don\'t react',
]

class GiveawayJoinerService {
  private config: GiveawayJoinerConfig = {
    enabled: false,
    reactionJoinEnabled: true,
    buttonJoinEnabled: true,
    minDelayMs: 1500,
    maxDelayMs: 4000,
    antiHoneypot: true,
    whitelistGuilds: [],
    blacklistGuilds: [],
  }

  private rules: AutoReactorRule[] = []
  private logs: GiveawayLog[] = []
  private enteredMessages = new Set<string>()
  private boundClient: any = null
  private configFile: string
  private rulesFile: string

  constructor() {
    this.configFile = path.join(config.storage.dataPath, 'giveaways-config.json')
    this.rulesFile = path.join(config.storage.dataPath, 'giveaways-rules.json')
    this.loadState()

    // Auto-attach when client is ready
    setInterval(() => {
      const client = discord.getActiveClient()
      if (client && client.isReady() && this.boundClient !== client) {
        this.attachListener(client)
      }
    }, 2000)
  }

  private loadState() {
    try {
      if (fs.existsSync(this.configFile)) {
        const raw = fs.readFileSync(this.configFile, 'utf-8')
        this.config = { ...this.config, ...JSON.parse(raw) }
      }
    } catch {}

    try {
      if (fs.existsSync(this.rulesFile)) {
        const raw = fs.readFileSync(this.rulesFile, 'utf-8')
        this.rules = JSON.parse(raw)
      }
    } catch {}
  }

  private saveState() {
    try {
      fs.writeFileSync(this.configFile, JSON.stringify(this.config, null, 2), 'utf-8')
      fs.writeFileSync(this.rulesFile, JSON.stringify(this.rules, null, 2), 'utf-8')
    } catch (err: any) {
      logger.error('GiveawayJoiner', `Erro ao salvar estado: ${err.message}`)
    }
  }

  getConfig(): GiveawayJoinerConfig {
    return { ...this.config }
  }

  updateConfig(cfg: Partial<GiveawayJoinerConfig>): GiveawayJoinerConfig {
    this.config = { ...this.config, ...cfg }
    this.saveState()
    broadcastWSEvent('giveaway:config-updated', this.config)
    return this.getConfig()
  }

  getLogs(): GiveawayLog[] {
    return this.logs.slice(-100)
  }

  getRules(): AutoReactorRule[] {
    return [...this.rules]
  }

  addRule(rule: Omit<AutoReactorRule, 'id' | 'createdAt'>): AutoReactorRule {
    const newRule: AutoReactorRule = {
      ...rule,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    }
    this.rules.push(newRule)
    this.saveState()
    broadcastWSEvent('giveaway:rules-updated', this.getRules())
    return newRule
  }

  deleteRule(id: string): boolean {
    const prevLen = this.rules.length
    this.rules = this.rules.filter((r) => r.id !== id)
    this.saveState()
    broadcastWSEvent('giveaway:rules-updated', this.getRules())
    return this.rules.length < prevLen
  }

  private attachListener(client: any) {
    this.boundClient = client
    logger.info('GiveawayJoiner', `Motor conectado à conta ${client.user?.tag}`)

    client.on('messageCreate', async (message: any) => {
      if (!message) return

      // Auto-Reactor rules evaluation for all messages
      if (this.rules.length > 0) {
        this.evaluateAutoReactor(message).catch(() => {})
      }

      // Giveaway joiner evaluation
      if (this.config.enabled) {
        this.handleMessage(message).catch(() => {})
      }
    })

    client.on('messageUpdate', async (_oldMsg: any, newMsg: any) => {
      if (this.config.enabled && newMsg) {
        this.handleMessage(newMsg).catch(() => {})
      }
    })
  }

  private async evaluateAutoReactor(message: any) {
    if (message.author?.id === this.boundClient?.user?.id) return

    for (const rule of this.rules) {
      if (!rule.enabled) continue

      // Filter by guild
      if (rule.targetGuildId && message.guild?.id !== rule.targetGuildId) continue

      // Filter by channel
      if (rule.targetChannelId && message.channel?.id !== rule.targetChannelId) continue

      // Filter by user
      if (rule.targetUserId && message.author?.id !== rule.targetUserId) continue

      // Filter by keyword
      if (rule.keyword && !message.content?.toLowerCase().includes(rule.keyword.toLowerCase())) continue

      // Trigger reaction
      try {
        await message.react(rule.emoji)
        logger.info('AutoReactor', `Reagido com ${rule.emoji} em mensagem de ${message.author?.tag} (Regra: ${rule.name})`)
      } catch (err: any) {
        logger.warn('AutoReactor', `Falha ao reagir com ${rule.emoji}: ${err.message}`)
      }
    }
  }

  private async handleMessage(message: any) {
    if (this.enteredMessages.has(message.id)) return

    const guildId = message.guild?.id
    if (guildId) {
      if (this.config.whitelistGuilds.length > 0 && !this.config.whitelistGuilds.includes(guildId)) return
      if (this.config.blacklistGuilds.includes(guildId)) return
    }

    const isBot = Boolean(message.author?.bot)
    const isKnownBot = KNOWN_GIVEAWAY_BOTS.has(message.author?.id)

    // Detect Giveaway
    let isGiveaway = false
    let prize = ''
    let entryType: 'button' | 'reaction' = 'button'

    const contentLower = (message.content || '').toLowerCase()
    const embeds = Array.isArray(message.embeds) ? message.embeds : []

    let fullText = contentLower
    for (const e of embeds) {
      if (e.title) fullText += ' ' + e.title.toLowerCase()
      if (e.description) fullText += ' ' + e.description.toLowerCase()
      if (e.footer?.text) fullText += ' ' + e.footer.text.toLowerCase()
      if (e.title) prize = e.title
    }

    if (
      isKnownBot ||
      fullText.includes('giveaway') ||
      fullText.includes('sorteio') ||
      fullText.includes('react with 🎉') ||
      fullText.includes('reaja com 🎉')
    ) {
      isGiveaway = true
    }

    if (!isGiveaway) return

    // Anti-Honeypot inspection
    if (this.config.antiHoneypot) {
      for (const kw of HONEYPOT_KEYWORDS) {
        if (fullText.includes(kw)) {
          logger.warn('GiveawayJoiner', `[🛑 HONEYPOT BLOQUEADO] Palavra suspeita "${kw}" detectada em ${message.guild?.name || 'DM'}`)
          this.recordLog({
            id: randomUUID(),
            guildId,
            guildName: message.guild?.name,
            channelId: message.channel.id,
            channelName: message.channel.name,
            messageId: message.id,
            botName: message.author?.tag || 'Bot',
            prize: prize || 'Possível Trap',
            entryType: 'button',
            status: 'honeypot_avoided',
            details: `Identificada palavra suspeita "${kw}". Participação cancelada preventivamente.`,
            latencyMs: 0,
            timestamp: new Date().toISOString(),
          })
          return
        }
      }
    }

    this.enteredMessages.add(message.id)
    if (this.enteredMessages.size > 2000) {
      const first = this.enteredMessages.values().next().value
      if (first) this.enteredMessages.delete(first)
    }

    // Determine Entry Type (Button vs Reaction)
    const components = Array.isArray(message.components) ? message.components : []
    let targetButton: any = null

    for (const row of components) {
      if (Array.isArray(row.components)) {
        for (const comp of row.components) {
          if (comp.type === 'BUTTON' || comp.type === 2) {
            targetButton = comp
            break
          }
        }
      }
      if (targetButton) break
    }

    if (targetButton && this.config.buttonJoinEnabled) {
      entryType = 'button'
    } else if (this.config.reactionJoinEnabled) {
      entryType = 'reaction'
    } else {
      return
    }

    // Apply Gaussian humanized jitter
    const minD = Math.max(500, this.config.minDelayMs)
    const maxD = Math.max(minD, this.config.maxDelayMs)
    const jitter = Math.floor(minD + Math.random() * (maxD - minD))

    logger.info(
      'GiveawayJoiner',
      `🎉 Sorteio detectado de ${message.author?.tag} em #${message.channel.name}! Entrando via ${entryType} em ${jitter}ms...`
    )

    await sleep(jitter)

    const t0 = performance.now()
    let status: GiveawayLog['status'] = 'entered'
    let details = ''

    try {
      if (entryType === 'button' && targetButton) {
        if (typeof message.clickButton === 'function') {
          await message.clickButton(targetButton.customId || 0)
          details = `Botão "${targetButton.label || targetButton.customId || 'Participar'}" clicado com sucesso!`
        } else {
          throw new Error('Função clickButton não disponível no cliente.')
        }
      } else {
        await message.react('🎉')
        details = 'Reação 🎉 adicionada com sucesso!'
      }

      const latencyMs = Math.round(performance.now() - t0)
      logger.success('GiveawayJoiner', `✅ Entrou no sorteio "${prize || 'Giveaway'}" em ${latencyMs}ms!`)

      this.recordLog({
        id: randomUUID(),
        guildId,
        guildName: message.guild?.name,
        channelId: message.channel.id,
        channelName: message.channel.name,
        messageId: message.id,
        botName: message.author?.tag || 'Bot',
        prize: prize || 'Sorteio de Servidor',
        entryType,
        status: 'entered',
        details,
        latencyMs,
        timestamp: new Date().toISOString(),
      })

      if (this.config.webhookUrl) {
        fetch(this.config.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `🎉 **[PhantomClear]** Entrou no sorteio: **${prize || 'Giveaway'}** no servidor **${message.guild?.name || 'DM'}** (#${message.channel.name}) via \`${entryType}\`!`,
          }),
        }).catch(() => {})
      }
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - t0)
      logger.error('GiveawayJoiner', `Erro ao participar do sorteio: ${err.message}`)
      this.recordLog({
        id: randomUUID(),
        guildId,
        guildName: message.guild?.name,
        channelId: message.channel.id,
        channelName: message.channel.name,
        messageId: message.id,
        botName: message.author?.tag || 'Bot',
        prize: prize || 'Sorteio',
        entryType,
        status: 'failed',
        details: err.message,
        latencyMs,
        timestamp: new Date().toISOString(),
      })
    }
  }

  private recordLog(log: GiveawayLog) {
    this.logs.unshift(log)
    if (this.logs.length > 200) this.logs.pop()
    broadcastWSEvent('giveaway:log', log)
  }
}

export const giveawayJoiner = new GiveawayJoinerService()
