import { Router } from 'express'
import { z } from 'zod'
import { validate } from '../../middleware'
import { asyncHandler } from '../_shared'
import { badgeCollector } from './badge-collector.service'

const router = Router()

router.get('/badge-collector/profile', asyncHandler(async (_req, res) => {
  const profile = await badgeCollector.getProfile()
  res.json({ success: true, data: profile })
}))

router.post('/badge-collector/hypesquad', validate(z.object({ houseId: z.union([z.literal(1), z.literal(2), z.literal(3)]) })), asyncHandler(async (req, res) => {
  await badgeCollector.setHypeSquadHouse(req.body.houseId)
  res.json({ success: true })
}))

router.delete('/badge-collector/hypesquad', asyncHandler(async (_req, res) => {
  await badgeCollector.leaveHypeSquad()
  res.json({ success: true })
}))

router.post('/badge-collector/farm-playtime', validate(z.object({
  hours: z.number().min(1).max(10000),
  gameId: z.string().optional(),
})), asyncHandler(async (req, res) => {
  const result = await badgeCollector.farmGameTime(req.body.hours, req.body.gameId)
  res.status(202).json({ success: true, data: result })
}))

router.post('/badge-collector/farm-variety', asyncHandler(async (_req, res) => {
  const result = await badgeCollector.farmVariety()
  res.status(202).json({ success: true, data: result })
}))

export const badgeCollectorRoutes = router
