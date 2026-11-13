import { Router } from 'express'
import { z } from 'zod'
import { validate } from '../../middleware'
import { asyncHandler } from '../_shared'
import { autoBump } from './autobump.service'

const router = Router()

router.get('/autobump/status', asyncHandler(async (_req, res) => {
  res.json({ success: true, data: autoBump.getStatus() })
}))

router.get('/autobump/config', asyncHandler(async (_req, res) => {
  res.json({ success: true, data: autoBump.getConfig() })
}))

const startSchema = z.object({
  guildId: z.string().min(1),
  channelId: z.string().min(1),
  intervalMinutes: z.number().int().min(1).max(1440).optional(),
  jitterMinutes: z.number().int().min(0).max(60).optional(),
  mode: z.enum(['slash', 'text']).optional(),
})

router.post('/autobump/start', validate(startSchema), asyncHandler(async (req, res) => {
  const status = await autoBump.start(req.body)
  res.json({ success: true, data: status })
}))

router.post('/autobump/stop', asyncHandler(async (_req, res) => {
  const status = autoBump.stop()
  res.json({ success: true, data: status })
}))

export const autobumpRoutes = router
