import { Router } from 'express'
import { z } from 'zod'
import { validate } from '../../middleware'
import { asyncHandler } from '../_shared'
import { questFarmer } from './quest-farmer.service'
import { discord } from '../../services/discord.service'
import { storage } from '../../services/storage.service'

const router = Router()

router.get('/quest-farmer/data', asyncHandler(async (_req, res) => {
  const [quests, bounties, orbBalance] = await Promise.all([
    questFarmer.getQuests(),
    questFarmer.getBounties(),
    questFarmer.getOrbBalance(),
  ])

  const activeAcc = discord.getActiveAccount()
  let accountData: { id: string; username: string; avatar: string | null } | null = null

  if (activeAcc) {
    accountData = {
      id: activeAcc.id,
      username: activeAcc.username,
      avatar: activeAcc.avatarUrl,
    }
  } else {
    const stored = storage.getTokens()
    const first = stored.find(t => t.status === 'valid') || stored[0]
    if (first?.user) {
      accountData = {
        id: first.user.id,
        username: first.user.username,
        avatar: first.user.avatar ? `https://cdn.discordapp.com/avatars/${first.user.id}/${first.user.avatar}.png` : null,
      }
    }
  }

  res.json({
    success: true,
    data: {
      quests,
      bounties,
      orbBalance,
      account: accountData,
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
