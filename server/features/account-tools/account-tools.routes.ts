import { Router } from 'express'
import { z } from 'zod'
import { validate } from '../../middleware'
import { asyncHandler } from '../_shared'
import {
  getRelationshipsList,
  acceptAllIncoming,
  cancelAllOutgoing,
  setHypeSquadHouse,
} from './account-tools.service'

const router = Router()

router.get('/account/relationships', asyncHandler(async (_req, res) => {
  const result = await getRelationshipsList()
  res.json({ success: true, data: result })
}))

router.post('/account/relationships/accept-all', asyncHandler(async (req, res) => {
  const delay = typeof req.body?.delay === 'number' ? req.body.delay : 1000
  const result = await acceptAllIncoming(delay)
  res.status(202).json({ success: true, data: result })
}))

router.post('/account/relationships/cancel-outgoing', asyncHandler(async (req, res) => {
  const delay = typeof req.body?.delay === 'number' ? req.body.delay : 800
  const result = await cancelAllOutgoing(delay)
  res.status(202).json({ success: true, data: result })
}))

const hypesquadSchema = z.object({
  houseId: z.number().int().min(0).max(3),
})

router.post('/account/hypesquad', validate(hypesquadSchema), asyncHandler(async (req, res) => {
  const { houseId } = req.body
  const result = await setHypeSquadHouse(houseId)
  res.json({ success: true, data: result })
}))

export const accountToolsRoutes = router
