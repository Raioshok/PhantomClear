import { Router } from 'express'
import { z } from 'zod'
import { validate } from '../../middleware'
import { asyncHandler } from '../_shared'
import { statusRotator } from './status-rotator.service'

const router = Router()

router.get('/status-rotator', asyncHandler(async (_req, res) => {
  res.json({ success: true, data: statusRotator.getConfig() })
}))

const updateSchema = z.object({
  enabled: z.boolean().optional(),
  intervalSeconds: z.number().int().min(10).optional(),
  statuses: z.array(z.object({
    text: z.string().min(1).max(128),
    emoji: z.string().optional(),
    status: z.enum(['online', 'idle', 'dnd', 'invisible']).optional(),
  })).optional(),
  rotateBio: z.boolean().optional(),
  bios: z.array(z.string()).optional(),
})

router.post('/status-rotator', validate(updateSchema), asyncHandler(async (req, res) => {
  const updated = statusRotator.updateConfig(req.body)
  res.json({ success: true, data: updated })
}))

export const statusRotatorRoutes = router
