export interface SnipedAttachment {
  id: string
  name: string
  url: string
  proxyUrl?: string
  size: number
  height?: number
  width?: number
  contentType?: string
  isImage: boolean
  isVideo: boolean
  isAudio: boolean
}

export interface SnipedEmbed {
  title?: string
  description?: string
  url?: string
  color?: number
  author?: { name?: string; url?: string; iconURL?: string }
  footer?: { text?: string; iconURL?: string }
  thumbnail?: { url?: string; proxyURL?: string; width?: number; height?: number }
  image?: { url?: string; proxyURL?: string; width?: number; height?: number }
  fields?: Array<{ name: string; value: string; inline?: boolean }>
  timestamp?: string
}

export interface SnipedAuthor {
  id: string
  username: string
  discriminator: string
  globalName?: string | null
  avatarUrl?: string | null
  bot: boolean
}

export interface SnipedReference {
  messageId: string
  channelId: string
  guildId?: string
  authorId?: string
  authorTag?: string
  snippet?: string
}

export interface SnipedMessage {
  id: string
  channelId: string
  channelName?: string
  guildId?: string | null
  guildName?: string | null
  author: SnipedAuthor
  content: string
  cleanContent?: string
  createdTimestamp: number
  deletedTimestamp: number
  deletedAfterMs: number
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

export interface EditSnipedMessage {
  id: string
  channelId: string
  channelName?: string
  guildId?: string | null
  guildName?: string | null
  author: SnipedAuthor
  originalContent: string
  newContent: string
  history: Array<{ content: string; timestamp: number }>
  createdTimestamp: number
  editedTimestamp: number
  editDeltaMs: number
  attachments: SnipedAttachment[]
  embeds: SnipedEmbed[]
}

export interface GhostPingRecord {
  id: string
  messageId: string
  channelId: string
  channelName?: string
  guildId?: string | null
  guildName?: string | null
  author: SnipedAuthor
  content: string
  createdTimestamp: number
  deletedTimestamp: number
  deletedAfterMs: number
  targets: {
    users: string[]
    roles: string[]
    everyone: boolean
    here: boolean
  }
  attachments: SnipedAttachment[]
}

export interface ReactionSnipeRecord {
  id: string
  messageId: string
  channelId: string
  guildId?: string | null
  user: SnipedAuthor
  emoji: {
    name: string
    id: string | null
    animated?: boolean
    url?: string
  }
  timestamp: number
}

export interface MessageSniperConfig {
  enabled: boolean
  maxChannelMessages: number
  maxDeletedPerChannel: number
  maxEditedPerChannel: number
  ghostPingDetection: boolean
  ghostPingAlertToChat: boolean
  ghostPingMaxLatencyMs: number
  webhookUrl?: string
  autoDeleteSnipeDelaySeconds: number
  stealthMode: boolean
  ignoreBots: boolean
  ignoreOwnMessages: boolean
}

export interface MessageSniperStats {
  activeBufferedMessages: number
  totalDeletedCaptured: number
  totalEditedCaptured: number
  totalGhostPingsDetected: number
  totalReactionsCaptured: number
  activeChannelsTracked: number
  startedAt: string
}
