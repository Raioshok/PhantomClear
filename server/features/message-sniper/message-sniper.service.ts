import fs from 'fs'
import path from 'path'
import { EventEmitter } from 'events'
import { discord } from '../../services/discord.service'
import { logger } from '../../core/logger'
import { config } from '../../config'
import { broadcastWSEvent } from '../../core/websocket'
import type {
  SnipedMessage,
  EditSnipedMessage,
  GhostPingRecord,
  ReactionSnipeRecord,
  MessageSniperConfig,
  MessageSniperStats,
  SnipedAuthor,
  SnipedAttachment,
  SnipedEmbed,
  SnipedReference,
} from './message-sniper.types'

interface CachedLiveMessage {
  id: string
  channelId: string
  channelName?: string
  guildId?: string | null
  guildName?: string | null
  author: SnipedAuthor
  content: string
  cleanContent?: string
  createdTimestamp: number
  attachments: SnipedAttachment[]
  embeds: SnipedEmbed[]
  stickers: Array<{ id: string; name: string; url: string }>
  mentions: {
    users: string[]
    roles: string[]
    everyone: boolean
    here: boolean
  }
  reference?: SnipedReference | null
  pinned: boolean
}

const DEFAULT_CONFIG: MessageSniperConfig = {
  enabled: true,
  maxChannelMessages: 50,
  maxDeletedPerChannel: 25,
  maxEditedPerChannel: 25,
  ghostPingDetection: true,
  ghostPingAlertToChat: false,
  ghostPingMaxLatencyMs: 60000,
  autoDeleteSnipeDelaySeconds: 15,
  stealthMode: true,
  ignoreBots: false,
  ignoreOwnMessages: false,
}

class MessageSniperService extends EventEmitter {
  private config: MessageSniperConfig = { ...DEFAULT_CONFIG }
  
  // Active live messages: channelId -> Map<messageId, CachedLiveMessage>
  private activeMessages = new Map<string, Map<string, CachedLiveMessage>>()
  private channelMessageOrder = new Map<string, string[]>()

  // Deleted snipes: channelId -> SnipedMessage[]
  private deletedMessages = new Map<string, SnipedMessage[]>()

  // Edited snipes: channelId -> EditSnipedMessage[]
  private editedMessages = new Map<string, EditSnipedMessage[]>()

  // Ghost pings: Global history (latest first)
  private ghostPings: GhostPingRecord[] = []

  // Reaction snipes: channelId -> ReactionSnipeRecord[]
  private reactionSnipes = new Map<string, ReactionSnipeRecord[]>()

  // Telemetry stats
  private stats: MessageSniperStats = {
    activeBufferedMessages: 0,
    totalDeletedCaptured: 0,
    totalEditedCaptured: 0,
    totalGhostPingsDetected: 0,
    totalReactionsCaptured: 0,
    activeChannelsTracked: 0,
    startedAt: new Date().toISOString(),
  }

  private boundClient: any = null
  private boundListeners: Array<{ event: string; fn: (...args: any[]) => void }> = []
  private saveTimer: ReturnType<typeof setTimeout> | null = null

  constructor() {
    super()
    this.loadPersistence()
    discord.onActiveClientChange((client) => {
      this.attachClient(client)
    })
  }

  private getStorageFilePath(): string {
    return path.join(config.storage.dataPath, 'message-sniper.json')
  }

  private loadPersistence(): void {
    try {
      const fp = this.getStorageFilePath()
      if (fs.existsSync(fp)) {
        const raw = JSON.parse(fs.readFileSync(fp, 'utf-8'))
        this.config = { ...DEFAULT_CONFIG, ...(raw.config || {}) }
        this.ghostPings = Array.isArray(raw.ghostPings) ? raw.ghostPings.slice(0, 100) : []
      }
    } catch (err) {
      logger.warn('MessageSniper', `Erro ao carregar persistência: ${err}`)
    }
  }

  private savePersistence(): void {
    try {
      const fp = this.getStorageFilePath()
      const data = {
        config: this.config,
        ghostPings: this.ghostPings.slice(0, 100),
      }
      fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf-8')
    } catch (err) {
      logger.warn('MessageSniper', `Erro ao salvar persistência: ${err}`)
    }
  }

  private scheduleSave(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer)
    this.saveTimer = setTimeout(() => {
      this.savePersistence()
      this.saveTimer = null
    }, 2000)
  }

  public getConfig(): MessageSniperConfig {
    return { ...this.config }
  }

  public updateConfig(patch: Partial<MessageSniperConfig>): MessageSniperConfig {
    this.config = { ...this.config, ...patch }
    this.scheduleSave()
    logger.info('MessageSniper', 'Configurações de Message Sniper atualizadas')
    return this.getConfig()
  }

  public getStats(): MessageSniperStats {
    let activeBuffered = 0
    for (const channelMap of this.activeMessages.values()) {
      activeBuffered += channelMap.size
    }
    return {
      ...this.stats,
      activeBufferedMessages: activeBuffered,
      activeChannelsTracked: this.activeMessages.size,
      totalGhostPingsDetected: this.ghostPings.length,
    }
  }

  private attachClient(client: any): void {
    if (this.boundClient && this.boundListeners.length > 0) {
      for (const { event, fn } of this.boundListeners) {
        try {
          this.boundClient.off(event, fn)
        } catch {}
      }
      this.boundListeners = []
    }

    if (!client) {
      this.boundClient = null
      return
    }

    this.boundClient = client

    const onMessageCreate = (message: any) => this.handleMessageCreate(message)
    const onMessageDelete = (message: any) => this.handleMessageDelete(message)
    const onMessageUpdate = (oldMsg: any, newMsg: any) => this.handleMessageUpdate(oldMsg, newMsg)
    const onReactionRemove = (reaction: any, user: any) => this.handleReactionRemove(reaction, user)

    client.on('messageCreate', onMessageCreate)
    client.on('messageDelete', onMessageDelete)
    client.on('messageUpdate', onMessageUpdate)
    client.on('messageReactionRemove', onReactionRemove)

    this.boundListeners = [
      { event: 'messageCreate', fn: onMessageCreate },
      { event: 'messageDelete', fn: onMessageDelete },
      { event: 'messageUpdate', fn: onMessageUpdate },
      { event: 'messageReactionRemove', fn: onReactionRemove },
    ]

    logger.info('MessageSniper', `Sniping engine conectado para usuário: ${client.user?.username}`)
  }

  private extractAuthor(rawAuthor: any): SnipedAuthor {
    if (!rawAuthor) {
      return {
        id: '0',
        username: 'Desconhecido',
        discriminator: '0000',
        globalName: null,
        avatarUrl: null,
        bot: false,
      }
    }

    let avatarUrl: string | null = null
    try {
      if (typeof rawAuthor.displayAvatarURL === 'function') {
        avatarUrl = rawAuthor.displayAvatarURL({ dynamic: true, size: 128 })
      } else if (rawAuthor.avatar && rawAuthor.id) {
        avatarUrl = `https://cdn.discordapp.com/avatars/${rawAuthor.id}/${rawAuthor.avatar}.${rawAuthor.avatar.startsWith('a_') ? 'gif' : 'png'}?size=128`
      }
    } catch {}

    return {
      id: rawAuthor.id || '0',
      username: rawAuthor.username || 'Desconhecido',
      discriminator: rawAuthor.discriminator || '0000',
      globalName: rawAuthor.globalName || rawAuthor.displayName || null,
      avatarUrl,
      bot: Boolean(rawAuthor.bot),
    }
  }

  private extractAttachments(rawAttachments: any): SnipedAttachment[] {
    if (!rawAttachments) return []
    const list: any[] = Array.isArray(rawAttachments)
      ? rawAttachments
      : typeof rawAttachments.values === 'function'
      ? Array.from(rawAttachments.values())
      : []

    return list.map((att: any) => {
      const url = att.url || att.attachment || ''
      const name = att.name || 'arquivo'
      const contentType = att.contentType || ''
      const ext = name.toLowerCase().split('.').pop() || ''

      const isImage =
        Boolean(contentType.startsWith('image/')) ||
        ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)
      const isVideo =
        Boolean(contentType.startsWith('video/')) ||
        ['mp4', 'webm', 'mov', 'mkv'].includes(ext)
      const isAudio =
        Boolean(contentType.startsWith('audio/')) ||
        ['mp3', 'ogg', 'wav', 'm4a', 'flac'].includes(ext)

      return {
        id: att.id || `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name,
        url,
        proxyUrl: att.proxyURL || undefined,
        size: Number(att.size) || 0,
        height: att.height || undefined,
        width: att.width || undefined,
        contentType: contentType || undefined,
        isImage,
        isVideo,
        isAudio,
      }
    })
  }

  private extractEmbeds(rawEmbeds: any): SnipedEmbed[] {
    if (!Array.isArray(rawEmbeds)) return []
    return rawEmbeds.map((emb: any) => ({
      title: emb.title || undefined,
      description: emb.description || undefined,
      url: emb.url || undefined,
      color: emb.color || undefined,
      author: emb.author
        ? {
            name: emb.author.name || undefined,
            url: emb.author.url || undefined,
            iconURL: emb.author.iconURL || emb.author.icon_url || undefined,
          }
        : undefined,
      footer: emb.footer
        ? {
            text: emb.footer.text || undefined,
            iconURL: emb.footer.iconURL || emb.footer.icon_url || undefined,
          }
        : undefined,
      thumbnail: emb.thumbnail
        ? {
            url: emb.thumbnail.url || undefined,
            proxyURL: emb.thumbnail.proxyURL || emb.thumbnail.proxy_url || undefined,
            width: emb.thumbnail.width || undefined,
            height: emb.thumbnail.height || undefined,
          }
        : undefined,
      image: emb.image
        ? {
            url: emb.image.url || undefined,
            proxyURL: emb.image.proxyURL || emb.image.proxy_url || undefined,
            width: emb.image.width || undefined,
            height: emb.image.height || undefined,
          }
        : undefined,
      fields: Array.isArray(emb.fields)
        ? emb.fields.map((f: any) => ({
            name: f.name || '',
            value: f.value || '',
            inline: Boolean(f.inline),
          }))
        : undefined,
      timestamp: emb.timestamp ? new Date(emb.timestamp).toISOString() : undefined,
    }))
  }

  private extractStickers(rawStickers: any): Array<{ id: string; name: string; url: string }> {
    if (!rawStickers) return []
    const list: any[] = Array.isArray(rawStickers)
      ? rawStickers
      : typeof rawStickers.values === 'function'
      ? Array.from(rawStickers.values())
      : []

    return list.map((stk: any) => ({
      id: stk.id || '',
      name: stk.name || 'sticker',
      url: stk.url || (stk.id ? `https://media.discordapp.net/stickers/${stk.id}.png` : ''),
    }))
  }

  private extractMentions(message: any): {
    users: string[]
    roles: string[]
    everyone: boolean
    here: boolean
  } {
    const users = new Set<string>()
    const roles = new Set<string>()

    if (message.mentions) {
      if (message.mentions.users) {
        if (typeof message.mentions.users.keys === 'function') {
          for (const u of message.mentions.users.keys()) users.add(u)
        } else if (Array.isArray(message.mentions.users)) {
          for (const u of message.mentions.users) users.add(u.id || u)
        }
      }
      if (message.mentions.roles) {
        if (typeof message.mentions.roles.keys === 'function') {
          for (const r of message.mentions.roles.keys()) roles.add(r)
        } else if (Array.isArray(message.mentions.roles)) {
          for (const r of message.mentions.roles) roles.add(r.id || r)
        }
      }
    }

    const content = message.content || ''
    const userMatch = content.match(/<@!?(\d+)>/g)
    if (userMatch) {
      for (const m of userMatch) {
        const id = m.replace(/[<@!>]/g, '')
        users.add(id)
      }
    }

    const roleMatch = content.match(/<@&(\d+)>/g)
    if (roleMatch) {
      for (const m of roleMatch) {
        const id = m.replace(/[<@&>]/g, '')
        roles.add(id)
      }
    }

    const everyone = content.includes('@everyone') || Boolean(message.mentions?.everyone)
    const here = content.includes('@here')

    return {
      users: Array.from(users),
      roles: Array.from(roles),
      everyone,
      here,
    }
  }

  private extractReference(message: any): SnipedReference | null {
    if (!message.reference && !message.messageReference) return null
    const ref = message.reference || message.messageReference
    return {
      messageId: ref.messageId || ref.message_id || '',
      channelId: ref.channelId || ref.channel_id || message.channel?.id || '',
      guildId: ref.guildId || ref.guild_id || message.guild?.id || undefined,
    }
  }

  private snapshotLiveMessage(message: any): CachedLiveMessage {
    const author = this.extractAuthor(message.author)
    const attachments = this.extractAttachments(message.attachments)
    const embeds = this.extractEmbeds(message.embeds)
    const stickers = this.extractStickers(message.stickers)
    const mentions = this.extractMentions(message)
    const reference = this.extractReference(message)

    return {
      id: message.id,
      channelId: message.channel?.id || '0',
      channelName: message.channel?.name || 'DM',
      guildId: message.guild?.id || null,
      guildName: message.guild?.name || null,
      author,
      content: message.content || '',
      cleanContent: message.cleanContent || message.content || '',
      createdTimestamp: message.createdTimestamp || Date.now(),
      attachments,
      embeds,
      stickers,
      mentions,
      reference,
      pinned: Boolean(message.pinned),
    }
  }

  private handleMessageCreate(message: any): void {
    if (!this.config.enabled || !message?.id || !message?.channel?.id) return

    if (this.config.ignoreBots && message.author?.bot) return
    if (this.config.ignoreOwnMessages && this.boundClient?.user?.id === message.author?.id) return

    const channelId = message.channel.id
    if (!this.activeMessages.has(channelId)) {
      this.activeMessages.set(channelId, new Map())
      this.channelMessageOrder.set(channelId, [])
    }

    const channelMap = this.activeMessages.get(channelId)!
    const channelOrder = this.channelMessageOrder.get(channelId)!

    const snapshot = this.snapshotLiveMessage(message)
    channelMap.set(message.id, snapshot)
    channelOrder.push(message.id)

    // Enforce ring-buffer cap per channel
    const maxMessages = Math.max(10, this.config.maxChannelMessages || 50)
    while (channelOrder.length > maxMessages) {
      const oldestId = channelOrder.shift()!
      channelMap.delete(oldestId)
    }

    // Enforce global tracked channel pool cap (max 500 active channels)
    if (this.activeMessages.size > 500) {
      const firstKey = this.activeMessages.keys().next().value
      if (firstKey) {
        this.activeMessages.delete(firstKey)
        this.channelMessageOrder.delete(firstKey)
      }
    }
  }

  private handleMessageDelete(message: any): void {
    if (!this.config.enabled || !message) return

    const channelId = message.channelId || message.channel?.id
    if (!channelId) return

    const messageId = message.id
    const cachedLive = this.activeMessages.get(channelId)?.get(messageId)

    const now = Date.now()
    let sniped: SnipedMessage

    if (cachedLive) {
      const deletedAfterMs = Math.max(0, now - cachedLive.createdTimestamp)
      sniped = {
        id: cachedLive.id,
        channelId: cachedLive.channelId,
        channelName: cachedLive.channelName,
        guildId: cachedLive.guildId,
        guildName: cachedLive.guildName,
        author: cachedLive.author,
        content: cachedLive.content,
        cleanContent: cachedLive.cleanContent,
        createdTimestamp: cachedLive.createdTimestamp,
        deletedTimestamp: now,
        deletedAfterMs,
        attachments: cachedLive.attachments,
        embeds: cachedLive.embeds,
        stickers: cachedLive.stickers,
        mentions: cachedLive.mentions,
        reference: cachedLive.reference,
        pinned: cachedLive.pinned,
      }
    } else {
      // Message was uncached in our buffer (e.g. sent before client connected)
      const author = this.extractAuthor(message.author)
      const attachments = this.extractAttachments(message.attachments)
      const embeds = this.extractEmbeds(message.embeds)
      const stickers = this.extractStickers(message.stickers)
      const mentions = this.extractMentions(message)
      const reference = this.extractReference(message)
      const createdTimestamp = message.createdTimestamp || now

      sniped = {
        id: messageId,
        channelId,
        channelName: message.channel?.name || 'Canal',
        guildId: message.guild?.id || null,
        guildName: message.guild?.name || null,
        author,
        content: message.content || '',
        cleanContent: message.cleanContent || message.content || '',
        createdTimestamp,
        deletedTimestamp: now,
        deletedAfterMs: Math.max(0, now - createdTimestamp),
        attachments,
        embeds,
        stickers,
        mentions,
        reference,
        pinned: Boolean(message.pinned),
      }
    }

    // Save to channel's deleted list
    if (!this.deletedMessages.has(channelId)) {
      this.deletedMessages.set(channelId, [])
    }
    const channelDeleted = this.deletedMessages.get(channelId)!
    channelDeleted.unshift(sniped)

    const maxDeleted = Math.max(5, this.config.maxDeletedPerChannel || 25)
    if (channelDeleted.length > maxDeleted) {
      channelDeleted.splice(maxDeleted)
    }

    this.stats.totalDeletedCaptured++
    broadcastWSEvent('sniper:deleted', sniped)
    this.emit('message:deleted', sniped)

    // Ghost ping detection
    this.checkAndProcessGhostPing(sniped)
  }

  private checkAndProcessGhostPing(sniped: SnipedMessage): void {
    if (!this.config.ghostPingDetection) return

    const myId = this.boundClient?.user?.id
    if (!myId) return

    // Do not flag ghost pings sent by oneself
    if (sniped.author.id === myId) return

    // Check if latency threshold is respected
    if (
      this.config.ghostPingMaxLatencyMs > 0 &&
      sniped.deletedAfterMs > this.config.ghostPingMaxLatencyMs
    ) {
      return
    }

    const mentionsMe =
      sniped.mentions.users.includes(myId) ||
      sniped.content.includes(`<@${myId}>`) ||
      sniped.content.includes(`<@!${myId}>`)

    const mentionsEveryone = sniped.mentions.everyone || sniped.mentions.here

    if (mentionsMe || mentionsEveryone) {
      const record: GhostPingRecord = {
        id: `gp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
        messageId: sniped.id,
        channelId: sniped.channelId,
        channelName: sniped.channelName,
        guildId: sniped.guildId,
        guildName: sniped.guildName,
        author: sniped.author,
        content: sniped.content,
        createdTimestamp: sniped.createdTimestamp,
        deletedTimestamp: sniped.deletedTimestamp,
        deletedAfterMs: sniped.deletedAfterMs,
        targets: sniped.mentions,
        attachments: sniped.attachments,
      }

      this.ghostPings.unshift(record)
      if (this.ghostPings.length > 100) this.ghostPings.pop()

      this.stats.totalGhostPingsDetected++
      this.scheduleSave()

      logger.warn(
        'MessageSniper',
        `👻 GHOST PING DETECTADO: ${sniped.author.username} em #${sniped.channelName || sniped.channelId} (deletado após ${(sniped.deletedAfterMs / 1000).toFixed(1)}s)`,
      )

      broadcastWSEvent('sniper:ghost-ping', record)
      this.emit('ghost-ping', record)

      // Forward to webhook if configured
      if (this.config.webhookUrl) {
        this.forwardGhostPingToWebhook(record).catch(() => {})
      }
    }
  }

  private async forwardGhostPingToWebhook(gp: GhostPingRecord): Promise<void> {
    if (!this.config.webhookUrl) return
    try {
      const payload = {
        username: 'PhantomClear Ghost Ping Detector',
        avatar_url: 'https://i.imgur.com/hTacae5.png',
        embeds: [
          {
            title: '👻 Ghost Ping Detectado!',
            color: 0xff3366,
            fields: [
              { name: 'Infrator', value: `**${gp.author.username}** (\`${gp.author.id}\`)`, inline: true },
              { name: 'Canal', value: `<#${gp.channelId}> (${gp.guildName || 'DM'})`, inline: true },
              {
                name: 'Latência de Deleção',
                value: `Deletado após **${(gp.deletedAfterMs / 1000).toFixed(1)}s**`,
                inline: true,
              },
              {
                name: 'Conteúdo Original',
                value: gp.content ? `>>> ${gp.content.slice(0, 1000)}` : '*[Sem texto / Apenas mídia]*',
                inline: false,
              },
            ],
            footer: { text: `PhantomClear V2 • Message ID: ${gp.messageId}` },
            timestamp: new Date(gp.deletedTimestamp).toISOString(),
          },
        ],
      }

      await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } catch (err) {
      logger.error('MessageSniper', `Falha ao enviar webhook de ghost ping: ${err}`)
    }
  }

  private handleMessageUpdate(oldMsg: any, newMsg: any): void {
    if (!this.config.enabled || !newMsg) return

    const channelId = newMsg.channelId || newMsg.channel?.id
    if (!channelId) return

    const messageId = newMsg.id
    const cachedLive = this.activeMessages.get(channelId)?.get(messageId)

    const originalContent = cachedLive?.content || oldMsg?.content || ''
    const newContent = newMsg.content || ''

    // Only record if content was actually altered (ignore embed additions/reactions)
    if (!originalContent || originalContent === newContent) {
      // Still update live buffer with new attributes
      if (cachedLive) {
        cachedLive.content = newContent
        cachedLive.cleanContent = newMsg.cleanContent || newContent
        cachedLive.embeds = this.extractEmbeds(newMsg.embeds)
      }
      return
    }

    const now = Date.now()
    const author = this.extractAuthor(newMsg.author || cachedLive?.author)
    const attachments = this.extractAttachments(newMsg.attachments || cachedLive?.attachments)
    const embeds = this.extractEmbeds(newMsg.embeds)
    const createdTimestamp = cachedLive?.createdTimestamp || newMsg.createdTimestamp || now
    const editDeltaMs = Math.max(0, now - createdTimestamp)

    if (!this.editedMessages.has(channelId)) {
      this.editedMessages.set(channelId, [])
    }
    const channelEdited = this.editedMessages.get(channelId)!

    let existing = channelEdited.find((e) => e.id === messageId)
    if (existing) {
      existing.history.push({ content: existing.newContent, timestamp: existing.editedTimestamp })
      existing.newContent = newContent
      existing.editedTimestamp = now
      existing.editDeltaMs = editDeltaMs
      existing.embeds = embeds
    } else {
      existing = {
        id: messageId,
        channelId,
        channelName: newMsg.channel?.name || cachedLive?.channelName || 'Canal',
        guildId: newMsg.guild?.id || cachedLive?.guildId || null,
        guildName: newMsg.guild?.name || cachedLive?.guildName || null,
        author,
        originalContent,
        newContent,
        history: [{ content: originalContent, timestamp: createdTimestamp }],
        createdTimestamp,
        editedTimestamp: now,
        editDeltaMs,
        attachments,
        embeds,
      }
      channelEdited.unshift(existing)
    }

    const maxEdited = Math.max(5, this.config.maxEditedPerChannel || 25)
    if (channelEdited.length > maxEdited) {
      channelEdited.splice(maxEdited)
    }

    // Update active cache
    if (cachedLive) {
      cachedLive.content = newContent
      cachedLive.cleanContent = newMsg.cleanContent || newContent
      cachedLive.embeds = embeds
    }

    this.stats.totalEditedCaptured++
    broadcastWSEvent('sniper:edited', existing)
    this.emit('message:edited', existing)
  }

  private handleReactionRemove(reaction: any, user: any): void {
    if (!this.config.enabled || !reaction) return

    const channelId = reaction.message?.channelId || reaction.message?.channel?.id
    if (!channelId) return

    const emojiData = reaction.emoji
      ? {
          name: reaction.emoji.name || '❓',
          id: reaction.emoji.id || null,
          animated: Boolean(reaction.emoji.animated),
          url: reaction.emoji.url || (reaction.emoji.id ? `https://cdn.discordapp.com/emojis/${reaction.emoji.id}.${reaction.emoji.animated ? 'gif' : 'png'}` : undefined),
        }
      : { name: '❓', id: null }

    const record: ReactionSnipeRecord = {
      id: `rs_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      messageId: reaction.message?.id || '0',
      channelId,
      guildId: reaction.message?.guild?.id || null,
      user: this.extractAuthor(user),
      emoji: emojiData,
      timestamp: Date.now(),
    }

    if (!this.reactionSnipes.has(channelId)) {
      this.reactionSnipes.set(channelId, [])
    }
    const channelReactions = this.reactionSnipes.get(channelId)!
    channelReactions.unshift(record)
    if (channelReactions.length > 20) channelReactions.pop()

    this.stats.totalReactionsCaptured++
    broadcastWSEvent('sniper:reaction', record)
    this.emit('reaction:removed', record)
  }

  // --- QUERY INTERFACES ---

  public getSnipedMessage(channelId: string, index: number = 1): { message: SnipedMessage | null; total: number } {
    const list = this.deletedMessages.get(channelId) || []
    const idx = Math.max(1, index) - 1
    const message = list[idx] || null
    return { message, total: list.length }
  }

  public getSnipedMessages(channelId: string): SnipedMessage[] {
    return this.deletedMessages.get(channelId) || []
  }

  public getEditSnipedMessage(channelId: string, index: number = 1): { message: EditSnipedMessage | null; total: number } {
    const list = this.editedMessages.get(channelId) || []
    const idx = Math.max(1, index) - 1
    const message = list[idx] || null
    return { message, total: list.length }
  }

  public getEditSnipedMessages(channelId: string): EditSnipedMessage[] {
    return this.editedMessages.get(channelId) || []
  }

  public getGhostPings(limit: number = 20): GhostPingRecord[] {
    return this.ghostPings.slice(0, Math.min(100, limit))
  }

  public getGhostPing(index: number = 1): { record: GhostPingRecord | null; total: number } {
    const idx = Math.max(1, index) - 1
    const record = this.ghostPings[idx] || null
    return { record, total: this.ghostPings.length }
  }

  public getReactionSniped(channelId: string, index: number = 1): { record: ReactionSnipeRecord | null; total: number } {
    const list = this.reactionSnipes.get(channelId) || []
    const idx = Math.max(1, index) - 1
    const record = list[idx] || null
    return { record, total: list.length }
  }

  public clearSnipes(channelId?: string, type: 'all' | 'deletes' | 'edits' | 'ghostpings' = 'all'): { cleared: boolean; details: string } {
    if (channelId) {
      if (type === 'all' || type === 'deletes') {
        this.deletedMessages.delete(channelId)
      }
      if (type === 'all' || type === 'edits') {
        this.editedMessages.delete(channelId)
      }
      if (type === 'all') {
        this.reactionSnipes.delete(channelId)
      }
      broadcastWSEvent('sniper:cleared', { channelId, type })
      return { cleared: true, details: `Snipes limpos para o canal ${channelId} (${type})` }
    }

    if (type === 'all') {
      this.deletedMessages.clear()
      this.editedMessages.clear()
      this.reactionSnipes.clear()
      this.ghostPings = []
      this.scheduleSave()
      broadcastWSEvent('sniper:cleared', { global: true, type: 'all' })
      return { cleared: true, details: 'Todos os snipes globais foram purgados' }
    }

    if (type === 'ghostpings') {
      this.ghostPings = []
      this.scheduleSave()
      broadcastWSEvent('sniper:cleared', { global: true, type: 'ghostpings' })
      return { cleared: true, details: 'Histórico de Ghost Pings purgado' }
    }

    return { cleared: false, details: 'Operação não executada' }
  }

  // --- DISCORD CHAT FORMATTING SUITE ---

  public formatSnipedMessage(sniped: SnipedMessage, index: number, total: number): string {
    const createdSec = Math.floor(sniped.createdTimestamp / 1000)
    const authorTag = sniped.author.discriminator !== '0000' && sniped.author.discriminator !== '0'
      ? `${sniped.author.username}#${sniped.author.discriminator}`
      : `@${sniped.author.username}`
    const elapsedSec = (sniped.deletedAfterMs / 1000).toFixed(1)

    const lines: string[] = [
      `🗑️ **Sniped Message** \`[${index}/${total}]\``,
      `👤 **Autor:** **${authorTag}** (\`${sniped.author.id}\`)`,
      `⏱️ **Enviada:** <t:${createdSec}:R> • **Deletada após:** \`${elapsedSec}s\``,
    ]

    if (sniped.reference?.snippet || sniped.reference?.authorTag) {
      lines.push(`↩️ *Em resposta a:* **${sniped.reference.authorTag || 'Mensagem'}**`)
    }

    lines.push('')

    if (sniped.content && sniped.content.trim().length > 0) {
      lines.push('💬 **Conteúdo:**')
      const quoted = sniped.content.split('\n').map((l) => `> ${l}`).join('\n')
      lines.push(quoted)
    } else {
      lines.push('*[Nenhum conteúdo de texto]*')
    }

    if (sniped.attachments.length > 0) {
      lines.push('')
      lines.push(`📎 **Anexos (${sniped.attachments.length}):**`)
      for (const att of sniped.attachments) {
        const sizeKb = (att.size / 1024).toFixed(1)
        const dim = att.width && att.height ? ` (${att.width}x${att.height})` : ''
        lines.push(`• [${att.name}](${att.url}) - \`${sizeKb} KB\`${dim}`)
      }
    }

    if (sniped.embeds.length > 0) {
      lines.push('')
      lines.push(`📋 **Embeds (${sniped.embeds.length}):**`)
      for (const emb of sniped.embeds.slice(0, 3)) {
        if (emb.title) lines.push(`• **${emb.title}**`)
        if (emb.description) lines.push(`  > ${emb.description.slice(0, 200)}...`)
        if (emb.image?.url) lines.push(`  🖼️ [Imagem do Embed](${emb.image.url})`)
      }
    }

    if (sniped.stickers.length > 0) {
      lines.push('')
      lines.push(`🎨 **Figurinhas:** ${sniped.stickers.map((s) => `[${s.name}](${s.url})`).join(', ')}`)
    }

    return lines.join('\n')
  }

  public formatEditSnipedMessage(edited: EditSnipedMessage, index: number, total: number): string {
    const origSec = Math.floor(edited.createdTimestamp / 1000)
    const editSec = Math.floor(edited.editedTimestamp / 1000)
    const authorTag = edited.author.discriminator !== '0000' && edited.author.discriminator !== '0'
      ? `${edited.author.username}#${edited.author.discriminator}`
      : `@${edited.author.username}`
    const elapsedSec = (edited.editDeltaMs / 1000).toFixed(1)

    const lines: string[] = [
      `✏️ **Edit Sniped Message** \`[${index}/${total}]\``,
      `👤 **Autor:** **${authorTag}** (\`${edited.author.id}\`)`,
      `⏱️ **Original:** <t:${origSec}:T> • **Editada:** <t:${editSec}:R> (\`+${elapsedSec}s\`)`,
      '',
      '🔴 **Antes:**',
      edited.originalContent ? edited.originalContent.split('\n').map((l) => `> ${l}`).join('\n') : '*[Vazio]*',
      '',
      '🟢 **Depois:**',
      edited.newContent ? edited.newContent.split('\n').map((l) => `> ${l}`).join('\n') : '*[Vazio]*',
    ]

    if (edited.history.length > 1) {
      lines.push('')
      lines.push(`📜 *Total de revisões capturadas: ${edited.history.length + 1}*`)
    }

    return lines.join('\n')
  }

  public formatGhostPing(gp: GhostPingRecord, index: number, total: number): string {
    const createdSec = Math.floor(gp.createdTimestamp / 1000)
    const authorTag = gp.author.discriminator !== '0000' && gp.author.discriminator !== '0'
      ? `${gp.author.username}#${gp.author.discriminator}`
      : `@${gp.author.username}`
    const elapsedSec = (gp.deletedAfterMs / 1000).toFixed(1)

    const targetTypes: string[] = []
    if (gp.targets.everyone) targetTypes.push('@everyone')
    if (gp.targets.here) targetTypes.push('@here')
    if (gp.targets.users.length > 0) targetTypes.push(`${gp.targets.users.length} usuário(s)`)
    if (gp.targets.roles.length > 0) targetTypes.push(`${gp.targets.roles.length} cargo(s)`)

    const lines: string[] = [
      `👻 **Ghost Ping Detectado** \`[${index}/${total}]\``,
      `👤 **Infrator:** **${authorTag}** (\`${gp.author.id}\`)`,
      `🎯 **Alvos:** \`${targetTypes.join(', ') || 'Você'}\``,
      `⏱️ **Enviado:** <t:${createdSec}:R> • **Deletado após:** \`${elapsedSec}s\``,
      `📍 **Canal:** <#${gp.channelId}> (${gp.guildName || 'DM'})`,
      '',
      '💬 **Mensagem:**',
      gp.content ? gp.content.split('\n').map((l) => `> ${l}`).join('\n') : '*[Sem texto]*',
    ]

    if (gp.attachments.length > 0) {
      lines.push('')
      lines.push(`📎 **Anexos (${gp.attachments.length}):** ${gp.attachments.map((a) => `[${a.name}](${a.url})`).join(', ')}`)
    }

    return lines.join('\n')
  }

  public formatReactionSnipe(record: ReactionSnipeRecord, index: number, total: number): string {
    const timeSec = Math.floor(record.timestamp / 1000)
    const userTag = record.user.discriminator !== '0000' && record.user.discriminator !== '0'
      ? `${record.user.username}#${record.user.discriminator}`
      : `@${record.user.username}`

    const emojiDisplay = record.emoji.id
      ? `<:${record.emoji.name}:${record.emoji.id}> (\`:${record.emoji.name}:\`)`
      : record.emoji.name

    return [
      `🎭 **Reaction Sniped** \`[${index}/${total}]\``,
      `👤 **Usuário:** **${userTag}** (\`${record.user.id}\`)`,
      `🏷️ **Reação Removida:** ${emojiDisplay}`,
      `⏱️ **Removida:** <t:${timeSec}:R>`,
      `📍 **Mensagem ID:** \`${record.messageId}\``,
    ].join('\n')
  }
}

export const messageSniper = new MessageSniperService()
