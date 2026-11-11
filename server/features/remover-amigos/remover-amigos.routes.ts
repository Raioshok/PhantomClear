import { Router } from 'express'
import { z } from 'zod'
import { validate } from '../../middleware'
import { asyncHandler, requireConnected } from '../_shared'
import { removerAmigos } from './remover-amigos.service'

const router = Router()

const removerAmigosSchema = z.object({
  tokenId: z.string(),
  delay: z.number().min(100).default(1000),
  userIds: z.array(z.string()).optional(),
})

router.get('/remover-amigos/friends', asyncHandler(async (_req, res) => {
  const { discord } = await import('../../services/discord.service')
  const { storage } = await import('../../services/storage.service')
  const token = discord.getActiveToken() || storage.getTokens()[0]?.token

  if (!token) {
    throw Object.assign(new Error('Nenhuma conta conectada'), { statusCode: 400 })
  }

  const friends: Array<{ id: string; username: string; discriminator: string; globalName: string | null; avatar: string | null }> = []

  // Try direct Discord REST API first (accurate user metadata)
  try {
    const rawRelationships = await discord.request<any[]>('/users/@me/relationships', token)
    if (Array.isArray(rawRelationships)) {
      for (const rel of rawRelationships) {
        if (rel.type === 1 && rel.user) {
          friends.push({
            id: rel.user.id || rel.id,
            username: rel.user.username || 'Usuário',
            discriminator: rel.user.discriminator || '0',
            globalName: rel.user.global_name || null,
            avatar: rel.user.avatar ? `https://cdn.discordapp.com/avatars/${rel.user.id}/${rel.user.avatar}.png` : null,
          })
        }
      }
    }
  } catch {}

  // Fallback to client cache if REST returned empty
  if (friends.length === 0) {
    const client = discord.getActiveClient()
    if (client && client.relationships?.cache) {
      for (const [userId, type] of client.relationships.cache.entries()) {
        if (type === 1) {
          const user = client.users.cache.get(userId)
          friends.push({
            id: userId,
            username: user?.username || 'Usuário',
            discriminator: user?.discriminator || '0',
            globalName: user?.globalName || null,
            avatar: user?.avatar ? `https://cdn.discordapp.com/avatars/${userId}/${user.avatar}.png` : null,
          })
        }
      }
    }
  }

  res.json({ success: true, data: friends })
}))

router.post('/remover-amigos', validate(removerAmigosSchema), asyncHandler(async (req, res) => {
  await requireConnected(req.body.tokenId)
  const result = await removerAmigos(req.body)
  res.status(201).json({ success: true, data: result, timestamp: new Date().toISOString() })
}))

export default router
