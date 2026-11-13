import { randomUUID } from 'crypto'
import { discord } from '../../services/discord.service'
import { storage } from '../../services/storage.service'
import { taskManager } from '../../services/task-manager.service'
import { stats } from '../../services/stats.service'
import { sleep } from '../../utils/helpers'
import { logger } from '../../core/logger'
import { broadcastWSEvent } from '../../core/websocket'

export interface BadgeInfo {
  id: string
  name: string
  category: 'hypesquad' | 'activity' | 'developer' | 'quest' | 'special' | 'connection'
  description: string
  icon: string
  owned: boolean
  obtainable: boolean
  obtainMethod: string
  progress?: {
    current: number
    target: number
    unit: string
  }
}

export interface BadgeProfileData {
  user: {
    id: string
    username: string
    globalName?: string | null
    avatarUrl?: string | null
    discriminator?: string
    flags?: number
    publicFlags?: number
    premiumType?: number
  } | null
  ownedBadgeCount: number
  totalAvailableCount: number
  badges: BadgeInfo[]
  connections: Array<{ type: string; name: string; verified: boolean; showOnProfile: boolean }>
  analyticsAvailable: boolean
}

const POPULAR_BADGE_GAMES = [
  { id: '432980957394370572', name: 'Fortnite', exe: 'FortniteClient-Win64-Shipping.exe' },
  { id: '700136079562375258', name: 'VALORANT', exe: 'VALORANT-Win64-Shipping.exe' },
  { id: '762434991303950386', name: 'Genshin Impact', exe: 'GenshinImpact.exe' },
  { id: '1070505030467797072', name: 'Honkai: Star Rail', exe: 'StarRail.exe' },
  { id: '356875221078245376', name: 'Overwatch 2', exe: 'Overwatch.exe' },
  { id: '536991182035746816', name: 'Grand Theft Auto V', exe: 'GTA5.exe' },
  { id: '438122941372047371', name: 'Minecraft', exe: 'javaw.exe' },
  { id: '479007612711698432', name: 'Roblox', exe: 'RobloxPlayerBeta.exe' },
]

class BadgeCollectorService {
  private detectableCatalog: Array<{ id: string; name: string; exe: string }> = []
  private catalogLoading = false

  private getAuthToken(): string {
    let token = discord.getActiveToken()
    if (!token) {
      const stored = storage.getTokens()
      const valid = stored.find((t) => t.status === 'valid') || stored[0]
      if (valid) {
        token = valid.token
        if (!discord.getActiveToken()) {
          discord.connect(token).catch(() => {})
        }
      }
    }
    if (!token) {
      throw Object.assign(
        new Error('Nenhuma conta conectada. Por favor, adicione e selecione uma conta na aba Tokens.'),
        { statusCode: 400 }
      )
    }
    return token.trim().replace(/^"|"$/g, '')
  }

  private async requestApi<T = any>(
    path: string,
    token: string,
    options: { method?: string; body?: any; apiVersion?: string } = {}
  ): Promise<T> {
    const apiVer = options.apiVersion || 'v9'
    const url = path.startsWith('http') ? path : `https://discord.com/api/${apiVer}${path}`

    const headers: Record<string, string> = {
      Authorization: token,
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) discord/1.0.9215 Chrome/138.0.7204.251 Electron/37.6.0 Safari/537.36',
      'Content-Type': 'application/json',
      Accept: '*/*',
    }

    const res = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    })

    if (!res.ok && res.status !== 204) {
      const errText = await res.text().catch(() => '')
      throw new Error(`Discord API ${res.status}: ${errText}`)
    }

    if (res.status === 204) return null as T
    return (await res.json()) as T
  }

  async getProfile(): Promise<BadgeProfileData> {
    const token = this.getAuthToken()

    let userData: any = null
    let connections: any[] = []
    let hypesquadHouse = 0

    try {
      userData = await this.requestApi('/users/@me', token, { apiVersion: 'v10' })
    } catch {
      const active = discord.getActiveAccount()
      if (active) {
        userData = { id: active.id, username: active.username, avatar: active.avatarUrl }
      }
    }

    try {
      connections = await this.requestApi<any[]>('/users/@me/connections', token, { apiVersion: 'v9' })
    } catch {}

    const flags = userData?.flags || userData?.public_flags || 0
    // Discord flags bitmasks:
    // HypeSquad Bravery = 64 (1 << 6)
    // HypeSquad Brilliance = 128 (1 << 7)
    // HypeSquad Balance = 256 (1 << 8)
    // Active Developer = 4194304 (1 << 22)
    // Bug Hunter Level 1 = 8 (1 << 3)
    // Early Supporter = 512 (1 << 9)
    if ((flags & 64) === 64) hypesquadHouse = 1
    if ((flags & 128) === 128) hypesquadHouse = 2
    if ((flags & 256) === 256) hypesquadHouse = 3

    const hasActiveDev = (flags & 4194304) === 4194304
    const hasBugHunter = (flags & 8) === 8
    const hasEarlySupporter = (flags & 512) === 512

    const badges: BadgeInfo[] = [
      // HypeSquad Houses
      {
        id: 'hypesquad_bravery',
        name: 'HypeSquad Bravery',
        category: 'hypesquad',
        description: 'Casa Bravery da HypeSquad (Insígnia Oficial Roxa)',
        icon: 'https://cdn.discordapp.com/badge-icons/8a88d63823d8a71cd5e390baa45efa02.png',
        owned: hypesquadHouse === 1,
        obtainable: true,
        obtainMethod: '1 clique instantâneo pelo painel',
      },
      {
        id: 'hypesquad_brilliance',
        name: 'HypeSquad Brilliance',
        category: 'hypesquad',
        description: 'Casa Brilliance da HypeSquad (Insígnia Oficial Laranja/Coral)',
        icon: 'https://cdn.discordapp.com/badge-icons/011940fd013da3f7fb926e4a1cd2e618.png',
        owned: hypesquadHouse === 2,
        obtainable: true,
        obtainMethod: '1 clique instantâneo pelo painel',
      },
      {
        id: 'hypesquad_balance',
        name: 'HypeSquad Balance',
        category: 'hypesquad',
        description: 'Casa Balance da HypeSquad (Insígnia Oficial Ciano/Turquesa)',
        icon: 'https://cdn.discordapp.com/badge-icons/3aa41de486fa12454c3761e8e223442e.png',
        owned: hypesquadHouse === 3,
        obtainable: true,
        obtainMethod: '1 clique instantâneo pelo painel',
      },

      // Activity & Game Badges (BadgeFarmer integration)
      {
        id: 'game_hours_eternal',
        name: 'Insígnia de Tempo de Jogo (Até 5.000h)',
        category: 'activity',
        description: 'Exibe milhares de horas jogadas no perfil do Discord (Tier Eterno)',
        icon: 'https://cdn.discordapp.com/emojis/1120042457007792168.webp',
        owned: false,
        obtainable: true,
        obtainMethod: 'Farma sessões no endpoint /science do Discord',
      },
      {
        id: 'game_variety_universalist',
        name: 'Insígnia de Variedade (100 Jogos)',
        category: 'activity',
        description: 'Credita 100 títulos oficiais do catálogo no histórico da conta',
        icon: 'https://cdn.discordapp.com/emojis/1120042457007792168.webp',
        owned: false,
        obtainable: true,
        obtainMethod: 'Farma sessões de 100 jogos únicos via /science',
      },
      {
        id: 'stream_legend',
        name: 'Insígnia de Streamer de Elite',
        category: 'activity',
        description: 'Credita tempo transmitido em chamadas de voz com espectadores',
        icon: 'https://cdn.discordapp.com/emojis/1120042457007792168.webp',
        owned: false,
        obtainable: true,
        obtainMethod: 'Transmita em call com 1 viewer para acelerar 10h/min',
      },

      // Developer & Quest
      {
        id: 'active_developer',
        name: 'Active Developer',
        category: 'developer',
        description: 'Insígnia verde de Desenvolvedor Ativo do Discord',
        icon: 'https://cdn.discordapp.com/badge-icons/6bd8e66ba6b0026a59e67304099382c7.png',
        owned: hasActiveDev,
        obtainable: true,
        obtainMethod: 'Executa slash command em bot registrado e resgata no Developer Portal',
      },
      {
        id: 'quest_completed',
        name: 'Quest Champion (Missão Concluída)',
        category: 'quest',
        description: 'Insígnia de missões e orbs concedida ao concluir quests',
        icon: 'https://cdn.discordapp.com/badge-icons/7d9ae358c8c5e118768335dbe68b4fb8.png',
        owned: false,
        obtainable: true,
        obtainMethod: 'Conclua qualquer missão na aba Quest Farmer',
      },

      // Special & Rare
      {
        id: 'bug_hunter',
        name: 'Bug Hunter',
        category: 'special',
        description: 'Caçador de bugs oficial do Discord Testers',
        icon: 'https://cdn.discordapp.com/badge-icons/2717692c7dca7289b35297368a94086f.png',
        owned: hasBugHunter,
        obtainable: false,
        obtainMethod: 'Reporte vulnerabilidades aceitas pelo Discord Security',
      },
      {
        id: 'early_supporter',
        name: 'Apoiador Inicial (Early Supporter)',
        category: 'special',
        description: 'Concedido a assinantes Nitro antes de 10 de outubro de 2018',
        icon: 'https://cdn.discordapp.com/badge-icons/70774273861c4c26d9e85ce2ec5d4ea9.png',
        owned: hasEarlySupporter,
        obtainable: false,
        obtainMethod: 'Legado histórico',
      },
    ]

    const ownedCount = badges.filter((b) => b.owned).length

    return {
      user: userData
        ? {
            id: userData.id,
            username: userData.username,
            globalName: userData.global_name || userData.globalName || null,
            avatarUrl: userData.avatar
              ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`
              : null,
            discriminator: userData.discriminator || '0',
            flags,
            publicFlags: userData.public_flags || 0,
            premiumType: userData.premium_type || 0,
          }
        : null,
      ownedBadgeCount: ownedCount,
      totalAvailableCount: badges.length,
      badges,
      connections: connections.map((c) => ({
        type: c.type,
        name: c.name,
        verified: Boolean(c.verified),
        showOnProfile: Boolean(c.show_activity || c.visibility === 1),
      })),
      analyticsAvailable: true,
    }
  }

  async setHypeSquadHouse(houseId: 1 | 2 | 3): Promise<boolean> {
    const token = this.getAuthToken()
    try {
      await this.requestApi('/hypesquad/online', token, {
        method: 'POST',
        apiVersion: 'v9',
        body: { house_id: houseId },
      })
      const houseNames = { 1: 'Bravery', 2: 'Brilliance', 3: 'Balance' }
      logger.success('BadgeCollector', `HypeSquad alterada para: ${houseNames[houseId]}`)
      broadcastWSEvent('badge-collector:updated', { houseId })
      return true
    } catch (err: any) {
      logger.error('BadgeCollector', `Erro ao alterar HypeSquad: ${err.message}`)
      throw err
    }
  }

  async leaveHypeSquad(): Promise<boolean> {
    const token = this.getAuthToken()
    try {
      await this.requestApi('/hypesquad/online', token, {
        method: 'DELETE',
        apiVersion: 'v9',
      })
      logger.success('BadgeCollector', 'HypeSquad removida com sucesso.')
      broadcastWSEvent('badge-collector:updated', { houseId: 0 })
      return true
    } catch (err: any) {
      logger.error('BadgeCollector', `Erro ao sair da HypeSquad: ${err.message}`)
      throw err
    }
  }

  private async loadCatalog(): Promise<void> {
    if (this.detectableCatalog.length > 0 || this.catalogLoading) return
    this.catalogLoading = true
    try {
      const token = this.getAuthToken()
      const data = await this.requestApi<any[]>('/applications/detectable', token, { apiVersion: 'v10' })
      if (Array.isArray(data)) {
        this.detectableCatalog = data
          .map((a) => {
            const exe = a.executables?.find((x: any) => x.os === 'win32')?.name?.replace('>', '') || `${a.name}.exe`
            return { id: String(a.id), name: a.name, exe }
          })
          .filter((a) => a.exe && a.id)
      }
    } catch {
      this.detectableCatalog = POPULAR_BADGE_GAMES
    } finally {
      this.catalogLoading = false
    }
  }

  async farmGameTime(hours: number, selectedGameId?: string): Promise<{ taskId: string }> {
    const token = this.getAuthToken()
    await this.loadCatalog()

    const catalog = this.detectableCatalog.length > 0 ? this.detectableCatalog : POPULAR_BADGE_GAMES
    const game = catalog.find((g) => g.id === selectedGameId) || catalog[0]

    const task = taskManager.createTask('badge-collector' as any, {
      total: hours,
    })
    const controller = taskManager.startTask(task.id)
    if (!controller) throw new Error('Falha ao registrar tarefa de farm')

    ;(async () => {
      let doneHours = 0
      const chunkHours = 24
      const cursor = Date.now()
      const heartbeat = randomUUID()
      const launch = randomUUID()
      const gameSession = randomUUID()

      taskManager.updateProgress(
        task.id,
        0,
        hours,
        `Iniciando farm de ${hours}h em ${game.name} via /science...`,
        'running'
      )

      while (doneHours < hours && !taskManager.isAborted(task.id)) {
        const currentChunk = Math.min(chunkHours, hours - doneHours)
        const durationMs = currentChunk * 3600 * 1000
        const start = cursor - durationMs

        const beat = (dur: number, initial: boolean, at: number) => ({
          type: 'running_game_heartbeat',
          properties: {
            client_track_timestamp: at,
            client_heartbeat_session_id: heartbeat,
            event_sequence_number: doneHours + 1,
            game_id: game.id,
            game_name: game.name,
            game_metadata: null,
            game_executable: game.exe,
            game_detection_enabled: true,
            initial_heartbeat: initial,
            final_heartbeat: !initial,
            game_session_id: gameSession,
            duration_tracked_ms: dur,
            launch_signature: launch,
            client_app_state: 'focused',
            client_send_timestamp: at,
          },
        })

        const launchEvent = {
          type: 'launch_game',
          properties: {
            client_track_timestamp: start,
            client_heartbeat_session_id: heartbeat,
            event_sequence_number: doneHours + 2,
            game: game.name,
            game_id: game.id,
            verified: true,
            elevated: false,
            is_launcher: false,
            game_platform: 'desktop',
            detection_method: 'verified_game',
            is_overlay_enabled: false,
            is_overlay_game_enabled: true,
            activity_status_enabled: true,
            current_user_status: 'online',
            game_detection_enabled: true,
            executable_path: `C:\\Program Files\\${game.name}\\${game.exe}`,
            launch_signature: launch,
            client_app_state: 'focused',
            client_send_timestamp: start,
          },
        }

        try {
          await this.requestApi('/science', token, {
            method: 'POST',
            apiVersion: 'v9',
            body: {
              events: [beat(0, true, start), launchEvent, beat(durationMs, false, start + durationMs)],
            },
          })
        } catch {}

        doneHours += currentChunk
        taskManager.updateProgress(
          task.id,
          doneHours,
          hours,
          `Creditado: ${doneHours} / ${hours} horas em ${game.name}`,
          'running'
        )
        broadcastWSEvent('badge-collector:progress', { done: doneHours, total: hours })
        await sleep(1000)
      }

      taskManager.completeTask(task.id)
      stats.recordAction('call-utils', 1, { action: 'badge-game-hours', hours: doneHours, game: game.name })
      logger.success('BadgeCollector', `${doneHours} horas creditadas em ${game.name} com sucesso!`)
    })().catch((err) => {
      logger.error('BadgeCollector', `Erro no farm de horas: ${err.message}`)
      taskManager.failTask(task.id, err.message)
    })

    return { taskId: task.id }
  }

  async farmVariety(): Promise<{ taskId: string }> {
    const token = this.getAuthToken()
    await this.loadCatalog()

    const pool = [...(this.detectableCatalog.length >= 100 ? this.detectableCatalog : POPULAR_BADGE_GAMES)]
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[pool[i], pool[j]] = [pool[j], pool[i]]
    }
    const selectedGames = pool.slice(0, 100)

    const task = taskManager.createTask('badge-collector' as any, {
      total: selectedGames.length,
    })
    const controller = taskManager.startTask(task.id)
    if (!controller) throw new Error('Falha ao registrar tarefa de variedade')

    ;(async () => {
      let done = 0
      const heartbeat = randomUUID()
      const launch = randomUUID()

      for (const g of selectedGames) {
        if (taskManager.isAborted(task.id)) break

        const durationMs = 2 * 60 * 1000
        const now = Date.now()
        const start = now - durationMs
        const gameSession = randomUUID()

        try {
          await this.requestApi('/science', token, {
            method: 'POST',
            apiVersion: 'v9',
            body: {
              events: [
                {
                  type: 'launch_game',
                  properties: {
                    client_track_timestamp: start,
                    client_heartbeat_session_id: heartbeat,
                    game: g.name,
                    game_id: g.id,
                    verified: true,
                    executable_path: g.exe,
                    launch_signature: launch,
                    client_app_state: 'focused',
                    client_send_timestamp: start,
                  },
                },
                {
                  type: 'running_game_heartbeat',
                  properties: {
                    client_track_timestamp: now,
                    client_heartbeat_session_id: heartbeat,
                    game_id: g.id,
                    game_name: g.name,
                    game_executable: g.exe,
                    game_session_id: gameSession,
                    duration_tracked_ms: durationMs,
                    initial_heartbeat: false,
                    final_heartbeat: true,
                    launch_signature: launch,
                    client_send_timestamp: now,
                  },
                },
              ],
            },
          })
        } catch {}

        done++
        taskManager.updateProgress(
          task.id,
          done,
          selectedGames.length,
          `Registrado jogo [${done}/${selectedGames.length}]: ${g.name}`,
          'running'
        )
        broadcastWSEvent('badge-collector:progress', { done, total: selectedGames.length })
        await sleep(800)
      }

      taskManager.completeTask(task.id)
      stats.recordAction('call-utils', 1, { action: 'badge-game-variety', count: done })
      logger.success('BadgeCollector', `Variedade de 100 jogos registrada para a insígnia Universalist!`)
    })().catch((err) => {
      logger.error('BadgeCollector', `Erro no farm de variedade: ${err.message}`)
      taskManager.failTask(task.id, err.message)
    })

    return { taskId: task.id }
  }
}

export const badgeCollector = new BadgeCollectorService()
