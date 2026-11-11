import { Router } from 'express'
import { z } from 'zod'
import { validate } from '../../middleware'
import { asyncHandler, requireConnected } from '../_shared'
import { removerServidores } from './remover-servidores.service'

const router = Router()

const removerServidoresSchema = z.object({
  tokenId: z.string(),
  delay: z.number().min(100).default(1000),
  guildIds: z.array(z.string()).optional(),
  ignoreOwned: z.boolean().default(true),
})

router.get('/remover-servidores/guilds', asyncHandler(async (_req, res) => {
  const { discord } = await import('../../services/discord.service')
  const client = discord.getActiveClient()
  if (!client || !client.isReady()) {
    throw Object.assign(new Error('Nenhuma conta conectada'), { statusCode: 400 })
  }

  const currentUserId = client.user?.id
  const guilds = client.guilds.cache.map((g: any) => ({
    id: g.id,
    name: g.name,
    icon: g.icon,
    memberCount: g.memberCount || 0,
    isOwner: Boolean(g.ownerId === currentUserId || g.owner),
  }))

  res.json({ success: true, data: guilds })
}))

router.post('/remover-servidores', validate(removerServidoresSchema), asyncHandler(async (req, res) => {
  await requireConnected(req.body.tokenId)
  const result = await removerServidores(req.body)
  res.status(201).json({ success: true, data: result, timestamp: new Date().toISOString() })
}))

export default router
