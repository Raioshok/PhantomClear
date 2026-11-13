import { Router } from 'express'
import { z } from 'zod'
import { validate } from '../../middleware'
import { asyncHandler } from '../_shared'
import { giveawayJoiner } from './giveaway-joiner.service'

const router = Router()

router.get('/giveaways/config', asyncHandler(async (_req, res) => {
  res.json({ success: true, data: giveawayJoiner.getConfig() })
}))

const updateConfigSchema = z.object({
  enabled: z.boolean().optional(),
  reactionJoinEnabled: z.boolean().optional(),
  buttonJoinEnabled: z.boolean().optional(),
  minDelayMs: z.number().int().min(0).optional(),
  maxDelayMs: z.number().int().min(0).optional(),
  antiHoneypot: z.boolean().optional(),
  webhookUrl: z.string().optional(),
  whitelistGuilds: z.array(z.string()).optional(),
  blacklistGuilds: z.array(z.string()).optional(),
})

router.post('/giveaways/config', validate(updateConfigSchema), asyncHandler(async (req, res) => {
  const updated = giveawayJoiner.updateConfig(req.body)
  res.json({ success: true, data: updated })
}))

router.get('/giveaways/logs', asyncHandler(async (_req, res) => {
  res.json({ success: true, data: giveawayJoiner.getLogs() })
}))

router.get('/giveaways/rules', asyncHandler(async (_req, res) => {
  res.json({ success: true, data: giveawayJoiner.getRules() })
}))

const createRuleSchema = z.object({
  name: z.string().min(1),
  targetUserId: z.string().optional(),
  targetGuildId: z.string().optional(),
  targetChannelId: z.string().optional(),
  keyword: z.string().optional(),
  emoji: z.string().min(1),
  enabled: z.boolean().default(true),
})

router.post('/giveaways/rules', validate(createRuleSchema), asyncHandler(async (req, res) => {
  const rule = giveawayJoiner.addRule(req.body)
  res.json({ success: true, data: rule })
}))

router.delete('/giveaways/rules/:id', asyncHandler(async (req, res) => {
  const success = giveawayJoiner.deleteRule(req.params.id)
  res.json({ success })
}))

export const giveawayJoinerRoutes = router
