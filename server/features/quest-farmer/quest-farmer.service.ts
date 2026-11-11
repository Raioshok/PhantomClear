import { discord } from '../../services/discord.service'
import { storage } from '../../services/storage.service'
import { taskManager } from '../../services/task-manager.service'
import { stats } from '../../services/stats.service'
import { sleep } from '../../utils/helpers'
import { logger } from '../../core/logger'
import { broadcastWSEvent } from '../../core/websocket'

export interface QuestItem {
  id: string
  name: string
  description?: string
  applicationId: string
  applicationName: string
  icon?: string
  expiresAt: string
  enrolled: boolean
  completed: boolean
  claimed: boolean
  progressPercent: number
  targetMinutes: number
}

class QuestFarmerService {
  async getQuests(): Promise<QuestItem[]> {
    let token = discord.getActiveToken()
    if (!token) {
      const stored = storage.getTokens()
      if (stored.length > 0) token = stored[0].token
    }

    if (!token) return []

    try {
      const res = await discord.request<any>('/quests/@me', token)
      const rawQuests: any[] = res?.quests || []

      return rawQuests.map((q) => {
        const config = q.config || {}
        const messages = config.messages || {}
        const app = config.application || {}
        const userStatus = q.user_status || {}

        const targetSeconds = config.stream_duration_seconds || 900 // default 15 min
        const progressSeconds = userStatus.progress?.playtime?.value || userStatus.progress?.stream?.value || 0
        const progressPercent = Math.min(100, Math.round((progressSeconds / targetSeconds) * 100))

        return {
          id: q.id,
          name: messages.quest_name || app.name || 'Discord Quest',
          description: messages.game_title || 'Complete para resgatar Orbs e decorações',
          applicationId: app.id || '',
          applicationName: app.name || 'Game',
          icon: app.icon ? `https://cdn.discordapp.com/app-icons/${app.id}/${app.icon}.png` : undefined,
          expiresAt: config.expires_at || '',
          enrolled: Boolean(userStatus.enrolled_at),
          completed: Boolean(userStatus.completed_at || progressPercent >= 100),
          claimed: Boolean(userStatus.claimed_at),
          progressPercent,
          targetMinutes: Math.round(targetSeconds / 60),
        }
      })
    } catch (err: any) {
      logger.warn('QuestFarmer', `Falha ao buscar quests: ${err.message || err}`)
      return []
    }
  }

  async enrollQuest(questId: string): Promise<boolean> {
    let token = discord.getActiveToken()
    if (!token) {
      const stored = storage.getTokens()
      if (stored.length > 0) token = stored[0].token
    }
    if (!token) return false

    try {
      await discord.request(`/quests/${questId}/enroll`, token, {
        method: 'POST',
        body: JSON.stringify({ location: 0 }),
      })
      logger.info('QuestFarmer', `Inscrito na Quest: ${questId}`)
      return true
    } catch (err: any) {
      logger.warn('QuestFarmer', `Erro ao se inscrever na quest ${questId}: ${err.message || err}`)
      return false
    }
  }

  async claimQuest(questId: string): Promise<boolean> {
    let token = discord.getActiveToken()
    if (!token) {
      const stored = storage.getTokens()
      if (stored.length > 0) token = stored[0].token
    }
    if (!token) return false

    try {
      await discord.request(`/quests/${questId}/claim`, token, {
        method: 'POST',
        body: JSON.stringify({ platform: 0 }),
      })
      logger.success('QuestFarmer', `Recompensa/Orbs resgatados para quest: ${questId}`)
      broadcastWSEvent('quest-farmer:claimed', { questId })
      return true
    } catch (err: any) {
      logger.warn('QuestFarmer', `Erro ao resgatar recompensa ${questId}: ${err.message || err}`)
      return false
    }
  }

  async startFarming(selectedQuestIds?: string[]): Promise<{ taskId: string }> {
    let token = discord.getActiveToken()
    if (!token) {
      const stored = storage.getTokens()
      if (stored.length > 0) token = stored[0].token
    }
    if (!token) {
      throw Object.assign(new Error('Nenhuma conta conectada para farmar quests.'), { statusCode: 400 })
    }

    const allQuests = await this.getQuests()
    const targetQuests = (selectedQuestIds && selectedQuestIds.length > 0)
      ? allQuests.filter((q) => selectedQuestIds.includes(q.id))
      : allQuests.filter((q) => !q.claimed)

    if (targetQuests.length === 0) {
      throw Object.assign(new Error('Nenhuma quest disponível para farmar no momento.'), { statusCode: 400 })
    }

    const task = taskManager.createTask('quest-farmer' as any, {
      totalQuests: targetQuests.length,
    })
    const controller = taskManager.startTask(task.id)
    if (!controller) throw new Error('Falha ao iniciar tarefa de farm de quests.')

    ;(async () => {
      // 1. Auto-enroll in all pending target quests
      for (const q of targetQuests) {
        if (!q.enrolled) {
          await this.enrollQuest(q.id)
          await sleep(1000)
        }
      }

      const client = discord.getActiveClient()
      const totalSteps = 30 // 30 intervals of 30 seconds = 15 minutes max
      let step = 0

      while (step < totalSteps && !taskManager.isAborted(task.id)) {
        step++
        const percent = Math.min(100, Math.round((step / totalSteps) * 100))

        // Emulate game play presence for target quest applications
        for (const q of targetQuests) {
          if (taskManager.isAborted(task.id)) break

          if (client && client.isReady() && client.user && q.applicationId) {
            try {
              await client.user.setPresence({
                status: 'online',
                activities: [
                  {
                    name: q.applicationName,
                    type: 'PLAYING',
                    applicationId: q.applicationId,
                  },
                ],
              })
            } catch {}
          }

          // Send heartbeat to Discord Quest endpoint
          try {
            await discord.request(`/quests/${q.id}/heartbeat`, token, {
              method: 'POST',
              body: JSON.stringify({ stream_key: null, terminal: false }),
            })
          } catch {}

          await sleep(2000)
        }

        taskManager.updateProgress(
          task.id,
          step,
          totalSteps,
          `Farmando Quests Discord: ${percent}% concluído (~${Math.round((totalSteps - step) * 0.5)} min restantes)`,
          'running'
        )

        broadcastWSEvent('quest-farmer:progress', {
          step,
          totalSteps,
          percent,
        })

        await sleep(28000)
      }

      // 3. Claim completed quests
      for (const q of targetQuests) {
        await this.claimQuest(q.id)
        await sleep(1500)
      }

      taskManager.completeTask(task.id)
      const duration = Math.max(1, Math.floor((Date.now() - new Date(task.startedAt || Date.now()).getTime()) / 1000))
      stats.recordAction('call-utils', duration, { action: 'quest-farmer', questsCount: targetQuests.length })
      logger.success('QuestFarmer', `Farm de Quests finalizado com sucesso!`)
    })().catch(() => {})

    return { taskId: task.id }
  }
}

export const questFarmer = new QuestFarmerService()
