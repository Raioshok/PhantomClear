import { Router } from 'express'
import { messageSniper } from './message-sniper.service'
import { asyncHandler } from '../_shared'

const router = Router()

router.get('/message-sniper/config', asyncHandler(async (_req, res) => {
  const config = messageSniper.getConfig()
  res.json({ success: true, data: config })
}))

router.post('/message-sniper/config', asyncHandler(async (req, res) => {
  const patch = req.body || {}
  const updated = messageSniper.updateConfig(patch)
  res.json({ success: true, data: updated })
}))

router.get('/message-sniper/stats', asyncHandler(async (_req, res) => {
  const stats = messageSniper.getStats()
  res.json({ success: true, data: stats })
}))

router.get('/message-sniper/channels/:channelId/deleted', asyncHandler(async (req, res) => {
  const { channelId } = req.params
  const index = req.query.index ? parseInt(req.query.index as string, 10) : undefined

  if (index !== undefined && !isNaN(index)) {
    const result = messageSniper.getSnipedMessage(channelId, index)
    res.json({ success: true, data: result.message, total: result.total, index })
  } else {
    const list = messageSniper.getSnipedMessages(channelId)
    res.json({ success: true, data: list, total: list.length })
  }
}))

router.get('/message-sniper/channels/:channelId/edited', asyncHandler(async (req, res) => {
  const { channelId } = req.params
  const index = req.query.index ? parseInt(req.query.index as string, 10) : undefined

  if (index !== undefined && !isNaN(index)) {
    const result = messageSniper.getEditSnipedMessage(channelId, index)
    res.json({ success: true, data: result.message, total: result.total, index })
  } else {
    const list = messageSniper.getEditSnipedMessages(channelId)
    res.json({ success: true, data: list, total: list.length })
  }
}))

router.get('/message-sniper/channels/:channelId/reactions', asyncHandler(async (req, res) => {
  const { channelId } = req.params
  const index = req.query.index ? parseInt(req.query.index as string, 10) : 1
  const result = messageSniper.getReactionSniped(channelId, index)
  res.json({ success: true, data: result.record, total: result.total })
}))

router.get('/message-sniper/ghostpings', asyncHandler(async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50
  const index = req.query.index ? parseInt(req.query.index as string, 10) : undefined

  if (index !== undefined && !isNaN(index)) {
    const result = messageSniper.getGhostPing(index)
    res.json({ success: true, data: result.record, total: result.total, index })
  } else {
    const list = messageSniper.getGhostPings(limit)
    res.json({ success: true, data: list, total: list.length })
  }
}))

router.delete('/message-sniper/clear', asyncHandler(async (req, res) => {
  const channelId = (req.query.channelId as string) || req.body?.channelId
  const type = ((req.query.type as string) || req.body?.type || 'all') as 'all' | 'deletes' | 'edits' | 'ghostpings'

  const result = messageSniper.clearSnipes(channelId, type)
  res.json({ success: true, ...result })
}))

export { router as messageSniperRoutes }
