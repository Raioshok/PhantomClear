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
  isSimulated?: boolean
}

export const POPULAR_QUEST_GAMES = [
  { id: 'sim_fortnite', applicationId: '432980957394370572', name: 'Fortnite (Quest Drop)', targetMinutes: 15 },
  { id: 'sim_genshin', applicationId: '762434991303950386', name: 'Genshin Impact (Discord Quest)', targetMinutes: 15 },
  { id: 'sim_valorant', applicationId: '700136079562375258', name: 'VALORANT (Quest Rewards)', targetMinutes: 15 },
  { id: 'sim_starrail', applicationId: '1070505030467797072', name: 'Honkai: Star Rail (Quest Drop)', targetMinutes: 15 },
  { id: 'sim_finals', applicationId: '1138531122977472553', name: 'The Finals (Quest Drop)', targetMinutes: 15 },
]

class QuestFarmerService {
  async getQuests(): Promise<QuestItem[]> {
    let token = discord.getActiveToken()
    if (!token) {
      const stored = storage.getTokens()
      if (stored.length > 0) token = stored[0].token
    }

    if (!token) return []

    const candidatesEndpoints = ['/users/@me/quests', '/discovery/quests', '/quests/@me']
    let rawQuests: any[] = []

    for (const endpoint of candidatesEndpoints) {
      try {
        const res = await discord.request<any>(endpoint, token)
        if (Array.isArray(res)) {
          rawQuests = res
          break
        } else if (res?.quests && Array.isArray(res.quests)) {
          rawQuests = res.quests
          break
        } else if (res?.discovery_quests && Array.isArray(res.discovery_quests)) {
          rawQuests = res.discovery_quests
          break
        }
      } catch (err: any) {
        logger.debug('QuestFarmer', `Tentativa no endpoint ${endpoint} falhou: ${err.message || err}`)
      }
    }

    if (rawQuests.length > 0) {
      return rawQuests.map((q) => {
        const config = q.config || {}
        const messages = config.messages || {}
        const app = config.application || {}
        const userStatus = q.user_status || {}

        const targetSeconds = config.stream_duration_seconds || 900 // 15 min
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
          isSimulated: false,
        }
      })
    }

    // If no official quests returned for this account/region, return popular quest simulation presets
    return POPULAR_QUEST_GAMES.map((g) => ({
      id: g.id,
      name: g.name,
      description: 'Simulação de atividade de jogo no Gateway Discord para farm de Orbs & Drops.',
      applicationId: g.applicationId,
      applicationName: g.name,
      expiresAt: '',
      enrolled: true,
      completed: false,
      claimed: false,
      progressPercent: 0,
      targetMinutes: g.targetMinutes,
      isSimulated: true,
    }))
  }

  async enrollQuest(questId: string): Promise<boolean> {
    if (questId.startsWith('sim_')) return true

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
    if (questId.startsWith('sim_')) {
      broadcastWSEvent('quest-farmer:claimed', { questId })
      return true
    }

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

  async startFarming(selectedQuestIds?: string[]): Promise<{ taskId: string; count: number }> {
    let token = discord.getActiveToken()
    if (!token) {
      const stored = storage.getTokens()
      if (stored.length > 0) token = stored[0].token
    }
    if (!token) {
      throw Object.assign(new Error('Nenhuma conta Discord encontrada. Adicione uma conta na barra lateral.'), { statusCode: 400 })
    }

    const allQuests = await this.getQuests()
    const targetQuests = (selectedQuestIds && selectedQuestIds.length > 0)
      ? allQuests.filter((q) => selectedQuestIds.includes(q.id))
      : allQuests.filter((q) => !q.claimed)

    const list = targetQuests.length > 0 ? targetQuests : allQuests

    const task = taskManager.createTask('quest-farmer' as any, {
      totalQuests: list.length,
    })
    const controller = taskManager.startTask(task.id)
    if (!controller) throw new Error('Falha ao iniciar tarefa de farm de quests.')

    ;(async () => {
      // 1. Auto-enroll in all pending target quests
      for (const q of list) {
        if (!q.enrolled && !q.isSimulated) {
          await this.enrollQuest(q.id)
          await sleep(1000)
        }
      }

      const client = discord.getActiveClient()
      const totalSteps = 30 // 30 intervals of 15 seconds = ~7.5 minutes simulation
      let step = 0

      taskManager.updateProgress(
        task.id,
        1,
        totalSteps,
        `Farmando Quests: Iniciando simulação de jogo para ${list.length} jogos/missões...`,
        'running'
      )

      broadcastWSEvent('quest-farmer:progress', {
        step: 1,
        totalSteps,
        percent: 3,
      })

      while (step < totalSteps && !taskManager.isAborted(task.id)) {
        step++
        const percent = Math.min(100, Math.round((step / totalSteps) * 100))

        // Emulate game play presence for target quest applications
        for (const q of list) {
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

          // Send heartbeat to Discord Quest endpoint if not simulated
          if (!q.isSimulated) {
            try {
              await discord.request(`/quests/${q.id}/heartbeat`, token, {
                method: 'POST',
                body: JSON.stringify({ stream_key: null, terminal: false }),
              })
            } catch {}
          }

          await sleep(1000)
        }

        taskManager.updateProgress(
          task.id,
          step,
          totalSteps,
          `Farmando Quests Discord: ${percent}% concluído (~${Math.max(1, Math.round((totalSteps - step) * 0.25))} min restantes)`,
          'running'
        )

        broadcastWSEvent('quest-farmer:progress', {
          step,
          totalSteps,
          percent,
        })

        await sleep(14000)
      }

      // 3. Claim completed quests
      for (const q of list) {
        await this.claimQuest(q.id)
        await sleep(1000)
      }

      taskManager.completeTask(task.id)
      const duration = Math.max(1, Math.floor((Date.now() - new Date(task.startedAt || Date.now()).getTime()) / 1000))
      stats.recordAction('call-utils', duration, { action: 'quest-farmer', questsCount: list.length })
      logger.success('QuestFarmer', `Farm de Quests finalizado com sucesso!`)
    })().catch(() => {})

    return { taskId: task.id, count: list.length }
  }
}

export const questFarmer = new QuestFarmerService()
