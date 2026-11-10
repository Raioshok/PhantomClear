import { Router } from 'express'
import { z } from 'zod'
import { validate } from '../../middleware'
import { asyncHandler } from '../_shared'
import { autoResponder } from './auto-responder.service'

const router = Router()

router.get('/auto-responder/config', asyncHandler(async (_req, res) => {
  res.json({ success: true, data: autoResponder.getConfig() })
}))

const configSchema = z.object({
  autoReplyEnabled: z.boolean().optional(),
  replyMessage: z.string().min(1).max(2000).optional(),
  onlyDMs: z.boolean().optional(),
  cooldownMinutes: z.number().int().min(1).max(1440).optional(),
  nitroSnifferEnabled: z.boolean().optional(),
})

router.post('/auto-responder/config', validate(configSchema), asyncHandler(async (req, res) => {
  const updated = autoResponder.updateConfig(req.body)
  res.json({ success: true, data: updated })
}))

router.get('/auto-responder/logs', asyncHandler(async (_req, res) => {
  res.json({ success: true, data: autoResponder.getLogs() })
}))

export const autoResponderRoutes = router
