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
  const client = discord.getActiveClient()
  if (!client || !client.isReady()) {
    throw Object.assign(new Error('Nenhuma conta conectada'), { statusCode: 400 })
  }

  const dms = client.channels.cache
    .filter((c: any) => c.type === 'DM' || c.type === 1)
    .map((c: any) => {
      const recipient = c.recipient
      return {
        id: c.id,
        recipientId: recipient?.id,
        username: recipient?.username || 'Desconhecido',
        globalName: recipient?.globalName || null,
        avatar: recipient?.avatar || null,
        lastMessageId: c.lastMessageId,
      }
    })

  res.json({ success: true, data: dms })
}))

router.post('/limpar-dms-abertas', validate(limparDmsAbertasSchema), asyncHandler(async (req, res) => {
  await requireConnected(req.body.tokenId)
  const result = await limparDmsAbertas(req.body)
  res.status(201).json({ success: true, data: result, timestamp: new Date().toISOString() })
}))

export default router
