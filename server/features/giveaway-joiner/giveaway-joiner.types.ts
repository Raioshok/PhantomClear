export interface GiveawayLog {
  id: string
  guildId?: string
  guildName?: string
  channelId: string
  channelName?: string
  messageId: string
  botName: string
  prize?: string
  entryType: 'button' | 'reaction'
  status: 'entered' | 'skipped' | 'failed' | 'honeypot_avoided'
  details: string
  latencyMs: number
  timestamp: string
}

export interface AutoReactorRule {
  id: string
  name: string
  targetUserId?: string
  targetGuildId?: string
  targetChannelId?: string
  keyword?: string
  emoji: string
  enabled: boolean
  createdAt: string
}

export interface GiveawayJoinerConfig {
  enabled: boolean
  reactionJoinEnabled: boolean
  buttonJoinEnabled: boolean
  minDelayMs: number
  maxDelayMs: number
  antiHoneypot: boolean
  webhookUrl?: string
  whitelistGuilds: string[]
  blacklistGuilds: string[]
}
