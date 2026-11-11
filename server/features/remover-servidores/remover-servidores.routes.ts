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
  const { storage } = await import('../../services/storage.service')
  const token = discord.getActiveToken() || storage.getTokens()[0]?.token

  if (!token) {
    throw Object.assign(new Error('Nenhuma conta conectada'), { statusCode: 400 })
  }

  const client = discord.getActiveClient()
  const currentUserId = client?.user?.id || (storage.getTokens().find((t) => t.token === token)?.id)

  const guilds: Array<{ id: string; name: string; icon: string | null; memberCount: number; isOwner: boolean }> = []

  // Try direct Discord REST API first
  try {
    const rawGuilds = await discord.request<any[]>('/users/@me/guilds?with_counts=true', token)
    if (Array.isArray(rawGuilds)) {
      for (const g of rawGuilds) {
        guilds.push({
          id: g.id,
          name: g.name,
          icon: g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null,
          memberCount: g.approximate_member_count || g.memberCount || 0,
          isOwner: Boolean(g.owner === true || g.ownerId === currentUserId),
        })
      }
    }
  } catch {}

  // Fallback to client cache
  if (guilds.length === 0 && client && client.guilds?.cache) {
    const cached = client.guilds.cache.map((g: any) => ({
      id: g.id,
      name: g.name,
      icon: g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null,
      memberCount: g.memberCount || 0,
      isOwner: Boolean(g.ownerId === currentUserId || g.owner),
    }))
    guilds.push(...cached)
  }

  res.json({ success: true, data: guilds })
}))

router.post('/remover-servidores', validate(removerServidoresSchema), asyncHandler(async (req, res) => {
  await requireConnected(req.body.tokenId)
  const result = await removerServidores(req.body)
  res.status(201).json({ success: true, data: result, timestamp: new Date().toISOString() })
}))

export default router
