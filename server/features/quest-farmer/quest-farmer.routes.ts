import { Router } from 'express'
import { z } from 'zod'
import { validate } from '../../middleware'
import { asyncHandler } from '../_shared'
import { questFarmer } from './quest-farmer.service'

const router = Router()

router.get('/quest-farmer/data', asyncHandler(async (_req, res) => {
  const [quests, bounties, orbBalance] = await Promise.all([
    questFarmer.getQuests(),
    questFarmer.getBounties(),
    questFarmer.getOrbBalance(),
  ])
  res.json({
    success: true,
    data: {
      quests,
      bounties,
      orbBalance,
    },
  })
}))

router.post('/quest-farmer/enroll', validate(z.object({ questId: z.string() })), asyncHandler(async (req, res) => {
  const success = await questFarmer.enrollQuest(req.body.questId)
  res.json({ success })
}))

router.post('/quest-farmer/claim', validate(z.object({ questId: z.string() })), asyncHandler(async (req, res) => {
  const success = await questFarmer.claimQuestReward(req.body.questId)
  res.json({ success })
}))

router.post('/quest-farmer/start', asyncHandler(async (_req, res) => {
  const result = await questFarmer.startFastAutoFarm()
  res.status(202).json({ success: true, data: result })
}))

export const questFarmerRoutes = router
