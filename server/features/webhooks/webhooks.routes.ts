import { Router } from 'express'
import { z } from 'zod'
import { validate } from '../../middleware'
import { asyncHandler } from '../_shared'
import { testWebhook, sendWebhookMessage, startWebhookSpam } from './webhooks.service'

const router = Router()

const testSchema = z.object({
  webhookUrl: z.string().url(),
})

router.post('/webhooks/test', validate(testSchema), asyncHandler(async (req, res) => {
  const info = await testWebhook(req.body.webhookUrl)
  res.json({ success: true, data: info })
}))

const sendSchema = z.object({
  webhookUrl: z.string().url(),
  content: z.string().optional(),
  username: z.string().optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  embeds: z.array(z.any()).optional(),
})

router.post('/webhooks/send', validate(sendSchema), asyncHandler(async (req, res) => {
  const result = await sendWebhookMessage(req.body)
  res.json({ success: true, data: result })
}))

const spamSchema = sendSchema.extend({
  count: z.number().int().min(1).max(500),
  delay: z.number().int().min(50).max(10000),
})

router.post('/webhooks/spam', validate(spamSchema), asyncHandler(async (req, res) => {
  const result = await startWebhookSpam(req.body)
  res.status(202).json({ success: true, data: result })
}))

export const webhooksRoutes = router
