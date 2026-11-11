import { Router } from 'express'
import { z } from 'zod'
import { validate } from '../../middleware'
import { asyncHandler, requireConnected } from '../_shared'
import { limparDmsAbertas } from './limpar-dms-abertas.service'

const router = Router()

const limparDmsAbertasSchema = z.object({
  tokenId: z.string(),
  delay: z.number().min(100).default(700),
  fazerBackup: z.boolean().default(false),
  salvarMidiaLocal: z.boolean().default(false),
  fecharApos: z.boolean().default(false),
  channelIds: z.array(z.string()).optional(),
})

router.get('/limpar-dms-abertas/channels', asyncHandler(async (_req, res) => {
  const { discord } = await import('../../services/discord.service')
  const { storage } = await import('../../services/storage.service')
  const token = discord.getActiveToken() || storage.getTokens()[0]?.token

  if (!token) {
    throw Object.assign(new Error('Nenhuma conta conectada'), { statusCode: 400 })
  }

  const dms: Array<{ id: string; recipientId: string; username: string; globalName: string | null; avatar: string | null; lastMessageId: string }> = []

  // Try direct Discord REST API first
  try {
    const rawChannels = await discord.request<any[]>('/users/@me/channels', token)
    if (Array.isArray(rawChannels)) {
      for (const ch of rawChannels) {
        if (ch.type === 1 || ch.type === 'DM') {
          const rec = ch.recipients && ch.recipients[0] ? ch.recipients[0] : null
          dms.push({
            id: ch.id,
            recipientId: rec?.id || '',
            username: rec?.username || 'Desconhecido',
            globalName: rec?.global_name || null,
            avatar: rec?.avatar ? `https://cdn.discordapp.com/avatars/${rec.id}/${rec.avatar}.png` : null,
            lastMessageId: ch.last_message_id || '',
          })
        }
      }
    }
  } catch {}

  // Fallback to client cache
  if (dms.length === 0) {
    const client = discord.getActiveClient()
    if (client && client.channels?.cache) {
      const cached = client.channels.cache
        .filter((c: any) => c.type === 'DM' || c.type === 1)
        .map((c: any) => {
          const recipient = c.recipient
          return {
            id: c.id,
            recipientId: recipient?.id || '',
            username: recipient?.username || 'Desconhecido',
            globalName: recipient?.globalName || null,
            avatar: recipient?.avatar ? `https://cdn.discordapp.com/avatars/${recipient.id}/${recipient.avatar}.png` : null,
            lastMessageId: c.lastMessageId || '',
          }
        })
      dms.push(...cached)
    }
  }

  res.json({ success: true, data: dms })
}))

router.post('/limpar-dms-abertas', validate(limparDmsAbertasSchema), asyncHandler(async (req, res) => {
  await requireConnected(req.body.tokenId)
  const result = await limparDmsAbertas(req.body)
  res.status(201).json({ success: true, data: result, timestamp: new Date().toISOString() })
}))

export default router
