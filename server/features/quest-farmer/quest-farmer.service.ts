import { randomUUID } from 'crypto'
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
  targetSeconds: number
  doneSeconds: number
  orbsReward: number
  taskType: string
}

export interface BountyItem {
  creativeId: string
  advertiserName: string
  productName: string
  endsAt: string
  orbs: number
  claimed: boolean
  decisionData: any
}

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) discord/1.0.9215 Chrome/138.0.7204.251 Electron/37.6.0 Safari/537.36'

const MOBILE_USER_AGENT = 'Discord-Android/343012;RNA'

const DESKTOP_SUPER_PROPS = {
  os: 'Windows',
  browser: 'Discord Client',
  release_channel: 'stable',
  client_version: '1.0.9215',
  os_version: '10.0.19045',
  os_arch: 'x64',
  app_arch: 'x64',
  system_locale: 'en-US',
  has_client_mods: false,
  browser_user_agent: USER_AGENT,
  browser_version: '37.6.0',
  os_sdk_version: '19045',
  client_build_number: 471091,
  native_build_number: 72186,
  client_event_source: null,
  client_app_state: 'focused',
}

const MOBILE_SUPER_PROPS = {
  os: 'Android',
  browser: 'Discord Android',
  release_channel: 'googleRelease',
  client_version: '343.12 - rn',
  os_version: '36',
  os_arch: 'arm64',
  app_arch: 'arm64',
  system_locale: 'en-US',
  has_client_mods: false,
  browser_user_agent: '',
  browser_version: '',
  os_sdk_version: '33',
  client_build_number: 6312,
  native_build_number: 72186,
  client_event_source: null,
  client_app_state: 'active',
  client_platform: 'android',
  client_os: 'Android',
  client_device: 'X6837',
  design_id: 2,
}

function getSuperPropsHeader(mobile = false): string {
  const props = mobile
    ? {
        ...MOBILE_SUPER_PROPS,
        client_launch_id: randomUUID(),
        launch_signature: randomUUID(),
        client_heartbeat_session_id: randomUUID(),
        device_vendor_id: randomUUID(),
      }
    : {
        ...DESKTOP_SUPER_PROPS,
        client_launch_id: randomUUID(),
        launch_signature: randomUUID(),
        client_heartbeat_session_id: randomUUID(),
      }
  return Buffer.from(JSON.stringify(props)).toString('base64')
}

class QuestFarmerService {
  private installationId = randomUUID()
  private storedCookies = ''

  private getAuthToken(): string {
    let token = discord.getActiveToken()
    if (!token) {
      const stored = storage.getTokens()
      if (stored.length > 0) token = stored[0].token
    }
    if (!token) {
      throw Object.assign(new Error('Nenhuma conta Discord conectada.'), { statusCode: 400 })
    }
    return token
  }

  private buildHeaders(token: string, mobile = false): Record<string, string> {
    const headers: Record<string, string> = {
      Authorization: token,
      'User-Agent': mobile ? MOBILE_USER_AGENT : USER_AGENT,
      'x-super-properties': getSuperPropsHeader(mobile),
      'x-installation-id': this.installationId,
      'x-discord-locale': 'en-US',
      'x-discord-timezone': 'America/Sao_Paulo',
      'content-type': 'application/json',
      accept: '*/*',
      referer: 'https://discord.com/quest-home',
      origin: 'https://discord.com',
    }
    if (this.storedCookies) {
      headers.cookie = this.storedCookies
    }
    return headers
  }

  private async requestApi<T = any>(
    path: string,
    token: string,
    options: { method?: string; body?: any; mobile?: boolean } = {}
  ): Promise<T> {
    const url = path.startsWith('http') ? path : `https://discord.com/api/v9${path}`
    const headers = this.buildHeaders(token, options.mobile)

    const res = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    })

    const setCookie = res.headers.get('set-cookie')
    if (setCookie) this.storedCookies = setCookie

    if (!res.ok && res.status !== 204) {
      const errText = await res.text().catch(() => '')
      throw new Error(`Discord API ${res.status}: ${errText}`)
    }

    if (res.status === 204) return null as T
    return (await res.json()) as T
  }

  async getOrbBalance(): Promise<number> {
    try {
      const token = this.getAuthToken()
      const data = await this.requestApi('/users/@me/virtual-currency/balance', token, { mobile: true })
      return data?.balance || 0
    } catch {
      return 0
    }
  }

  async getQuests(): Promise<QuestItem[]> {
    try {
      const token = this.getAuthToken()
      const data = await this.requestApi('/quests/@me', token)
      const rawQuests: any[] = data?.quests || []

      return rawQuests.map((q) => {
        const config = q.config || {}
        const messages = config.messages || {}
        const app = config.application || {}
        const userStatus = q.user_status || {}

        const tasks = config.task_config?.tasks || config.task_config_v2?.tasks || {}
        const taskKey = Object.keys(tasks)[0] || 'PLAY_ON_DESKTOP'
        const targetSeconds = tasks[taskKey]?.target || config.stream_duration_seconds || 900
        const doneSeconds = userStatus.progress?.[taskKey]?.value || 0
        const progressPercent = Math.min(100, Math.round((doneSeconds / targetSeconds) * 100))

        let orbsReward = 0
        const rewards = config.rewards_config?.rewards || []
        for (const r of rewards) {
          if (r.orb_quantity) orbsReward += r.orb_quantity
        }

        return {
          id: q.id,
          name: messages.quest_name || app.name || 'Discord Quest',
          description: messages.game_title || 'Complete para resgatar Orbs e cosméticos',
          applicationId: app.id || tasks[taskKey]?.applications?.[0]?.id || '',
          applicationName: app.name || 'Game',
          icon: app.icon ? `https://cdn.discordapp.com/app-icons/${app.id}/${app.icon}.png` : undefined,
          expiresAt: config.expires_at || '',
          enrolled: Boolean(userStatus.enrolled_at),
          completed: Boolean(userStatus.completed_at || progressPercent >= 100),
          claimed: Boolean(userStatus.claimed_at),
          progressPercent,
          targetSeconds,
          doneSeconds,
          orbsReward,
          taskType: taskKey,
        }
      })
    } catch (err: any) {
      logger.warn('QuestFarmer', `Falha ao carregar quests: ${err.message}`)
      return []
    }
  }

  async getBounties(): Promise<BountyItem[]> {
    try {
      const token = this.getAuthToken()
      const adSessionId = randomUUID()
      const heartbeatSessionId = randomUUID()
      const url = `/quests/get-decisions?placement=4&client_ad_session_id=${adSessionId}&client_heartbeat_session_id=${heartbeatSessionId}&num_decisions_requested=5`
      const data = await this.requestApi(url, token, { mobile: true })
      const rawDecisions: any[] = data?.decisions || []

      const seen = new Set<string>()
      const bounties: BountyItem[] = []

      for (const d of rawDecisions) {
        const creative = d.creative?.creative_content
        const creativeId = creative?.id
        if (creativeId && !seen.has(creativeId)) {
          seen.add(creativeId)
          bounties.push({
            creativeId,
            advertiserName: creative?.advertiser_name || 'Discord Sponsor',
            productName: creative?.product_name || 'Bounty Quest',
            endsAt: d.creative?.ends_at || '',
            orbs: 50,
            claimed: false,
            decisionData: {
              ...d,
              adSessionId,
              heartbeatSessionId,
            },
          })
        }
      }
      return bounties
    } catch (err: any) {
      logger.warn('QuestFarmer', `Falha ao carregar bounties: ${err.message}`)
      return []
    }
  }

  async claimBounty(bounty: BountyItem): Promise<boolean> {
    const token = this.getAuthToken()
    try {
      const decision = bounty.decisionData
      await this.requestApi(`/quests/creatives/${bounty.creativeId}/claim-reward`, token, {
        method: 'POST',
        mobile: true,
        body: {
          decision_metadata_sealed: decision.metadata_sealed,
          traffic_metadata_sealed: decision.traffic_metadata_sealed,
          client_ad_session_id: decision.adSessionId,
          client_heartbeat_session_id: decision.heartbeatSessionId,
        },
      })
      logger.success('QuestFarmer', `Bounty resgatada! +50 Orbs creditados.`)
      broadcastWSEvent('quest-farmer:bounty-claimed', { creativeId: bounty.creativeId })
      return true
    } catch (err: any) {
      logger.error('QuestFarmer', `Falha ao resgatar bounty: ${err.message}`)
      return false
    }
  }

  async enrollQuest(questId: string): Promise<boolean> {
    const token = this.getAuthToken()
    try {
      await this.requestApi(`/quests/${questId}/enroll`, token, {
        method: 'POST',
        body: { location: 11, is_targeted: false, metadata_raw: null },
      })
      logger.info('QuestFarmer', `Inscrito na Quest: ${questId}`)
      return true
    } catch (err: any) {
      logger.warn('QuestFarmer', `Erro ao inscrever quest: ${err.message}`)
      return false
    }
  }

  async claimQuestReward(questId: string): Promise<boolean> {
    const token = this.getAuthToken()
    try {
      await this.requestApi(`/quests/${questId}/claim`, token, {
        method: 'POST',
        body: { platform: 0 },
      })
      logger.success('QuestFarmer', `Recompensa de Quest reivindicada com sucesso!`)
      broadcastWSEvent('quest-farmer:claimed', { questId })
      return true
    } catch (err: any) {
      logger.warn('QuestFarmer', `Falha ao resgatar recompensa da quest ${questId}: ${err.message}`)
      return false
    }
  }

  async startFastAutoFarm(): Promise<{ taskId: string; questsCount: number; bountiesCount: number }> {
    const token = this.getAuthToken()

    const [quests, bounties] = await Promise.all([this.getQuests(), this.getBounties()])

    const pendingQuests = quests.filter((q) => !q.claimed)
    const task = taskManager.createTask('quest-farmer' as any, {
      total: pendingQuests.length + bounties.length,
    })
    const controller = taskManager.startTask(task.id)
    if (!controller) throw new Error('Falha ao registrar tarefa de farm')

    ;(async () => {
      let step = 0
      const totalSteps = (bounties.length > 0 ? bounties.length : 1) + (pendingQuests.length > 0 ? pendingQuests.length * 4 : 1)

      // Phase 1: Claim Bounties (Instant 50 Orbs each!)
      if (bounties.length > 0) {
        taskManager.updateProgress(task.id, step, totalSteps, `Resgatando ${bounties.length} Bounties de Orbs...`, 'running')
        for (const b of bounties) {
          if (taskManager.isAborted(task.id)) break
          await this.claimBounty(b)
          step++
          taskManager.updateProgress(task.id, step, totalSteps, `Bounty resgatada: +50 Orbs (${step}/${bounties.length})`, 'running')
          await sleep(2000)
        }
      }

      // Phase 2: Complete and Fast-Forward Quests (~1-2 minutes per quest!)
      for (const q of pendingQuests) {
        if (taskManager.isAborted(task.id)) break

        // Auto-enroll if needed
        if (!q.enrolled) {
          await this.enrollQuest(q.id)
          await sleep(1500)
        }

        taskManager.updateProgress(task.id, step, totalSteps, `Farmando: ${q.name} (${q.taskType})...`, 'running')

        const isVideo = q.taskType.includes('WATCH_VIDEO')
        const target = q.targetSeconds || 900
        let currentProgress = q.doneSeconds || 0

        // FAST FORWARD PROGRESS LOOP (accelerated chunks with natural jitter)
        while (currentProgress < target && !taskManager.isAborted(task.id)) {
          if (isVideo) {
            // Video fast progress chunks (7-10s per step)
            currentProgress = Math.min(target, currentProgress + 10 + Math.random() * 2)
            try {
              const res = await this.requestApi(`/quests/${q.id}/video-progress`, token, {
                method: 'POST',
                body: { timestamp: Number(currentProgress.toFixed(6)) },
              })
              if (res?.completed_at) break
            } catch {}
            await sleep(3500)
          } else {
            // Heartbeat spoofing with executable metadata
            currentProgress = Math.min(target, currentProgress + 60) // 1 minute progress jump
            try {
              const res = await this.requestApi(`/quests/${q.id}/heartbeat`, token, {
                method: 'POST',
                body: {
                  application_id: q.applicationId || '432980957394370572',
                  terminal: currentProgress >= target,
                  executable_path: 'game/game.exe',
                },
              })
              if (res?.completed_at) break
            } catch {}
            await sleep(4000)
          }

          const pct = Math.min(100, Math.round((currentProgress / target) * 100))
          broadcastWSEvent('quest-farmer:progress', {
            questId: q.id,
            percent: pct,
            currentProgress,
            target,
          })
        }

        // Finalize & claim
        await sleep(1500)
        await this.claimQuestReward(q.id)
        step++
        taskManager.updateProgress(task.id, step, totalSteps, `Quest ${q.name} completada e recompensas resgatadas!`, 'running')
        await sleep(2000)
      }

      taskManager.completeTask(task.id)
      const duration = Math.max(1, Math.floor((Date.now() - new Date(task.startedAt || Date.now()).getTime()) / 1000))
      stats.recordAction('call-utils', duration, { action: 'quest-fast-farm', count: pendingQuests.length + bounties.length })
      logger.success('QuestFarmer', `Auto-Farm rápido de Quests e Orbs concluído!`)
    })().catch((err) => {
      logger.error('QuestFarmer', `Erro no farm de quests: ${err.message}`)
      taskManager.failTask(task.id, err.message)
    })

    return { taskId: task.id, questsCount: pendingQuests.length, bountiesCount: bounties.length }
  }
}

export const questFarmer = new QuestFarmerService()
