import { Router } from 'express'
import { z } from 'zod'
import { validate } from '../../middleware'
import { asyncHandler } from '../_shared'
import { usernameSniper } from './username-sniper.service'

const router = Router()

router.get('/username-sniper/results', asyncHandler(async (_req, res) => {
  res.json({
    success: true,
    data: {
      available: usernameSniper.getAvailable(),
      history: usernameSniper.getHistory(),
    },
  })
}))

const startSchema = z.object({
  preset: z.enum(['3char', '4char', '3letter', '4letter', 'rare-words', 'custom']),
  customList: z.array(z.string()).optional(),
  delay: z.number().int().min(500).max(10000).optional(),
  maxChecks: z.number().int().min(1).max(2000).optional(),
  autoClaim: z.boolean().optional(),
  password: z.string().optional(),
})

router.post('/username-sniper/start', validate(startSchema), asyncHandler(async (req, res) => {
  const result = await usernameSniper.startSniper(req.body)
  res.status(202).json({ success: true, data: result })
}))

export const usernameSniperRoutes = router
