import { Router } from 'express'
import { z } from 'zod'
import { validate } from '../../middleware'
import { asyncHandler } from '../_shared'
import { questFarmer } from './quest-farmer.service'

const router = Router()

router.get('/quest-farmer/quests', asyncHandler(async (_req, res) => {
  const quests = await questFarmer.getQuests()
  res.json({ success: true, data: quests })
}))

router.post('/quest-farmer/enroll', validate(z.object({ questId: z.string() })), asyncHandler(async (req, res) => {
  const success = await questFarmer.enrollQuest(req.body.questId)
  res.json({ success })
}))

router.post('/quest-farmer/claim', validate(z.object({ questId: z.string() })), asyncHandler(async (req, res) => {
  const success = await questFarmer.claimQuest(req.body.questId)
  res.json({ success })
}))

router.post('/quest-farmer/start', validate(z.object({ questIds: z.array(z.string()).optional() })), asyncHandler(async (req, res) => {
  const result = await questFarmer.startFarming(req.body.questIds)
  res.status(202).json({ success: true, data: result })
}))

export const questFarmerRoutes = router
