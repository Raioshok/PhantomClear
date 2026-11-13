import { Router } from 'express'
import { z } from 'zod'
import { validate } from '../../middleware'
import { asyncHandler } from '../_shared'
import { scheduler } from './scheduler.service'

const router = Router()

router.get('/scheduler/jobs', asyncHandler(async (_req, res) => {
  res.json({ success: true, data: scheduler.getJobs() })
}))

const createJobSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['message', 'command', 'status', 'cleanup']),
  targetId: z.string().min(1),
  content: z.string().min(1).max(2000),
  intervalMinutes: z.number().int().min(1).max(10080),
  active: z.boolean().default(true),
})

router.post('/scheduler/jobs', validate(createJobSchema), asyncHandler(async (req, res) => {
  const job = scheduler.createJob(req.body)
  res.status(201).json({ success: true, data: job })
}))

router.patch('/scheduler/jobs/:id', validate(z.object({ active: z.boolean() })), asyncHandler(async (req, res) => {
  const job = scheduler.toggleJob(req.params.id, req.body.active)
  res.json({ success: true, data: job })
}))

router.delete('/scheduler/jobs/:id', asyncHandler(async (req, res) => {
  const ok = scheduler.deleteJob(req.params.id)
  res.json({ success: ok })
}))

router.post('/scheduler/jobs/:id/run', asyncHandler(async (req, res) => {
  const ok = await scheduler.runJobNow(req.params.id)
  res.json({ success: ok })
}))

export const schedulerRoutes = router
