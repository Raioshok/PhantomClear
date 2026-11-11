import { discord } from '../../services/discord.service'
import { taskManager } from '../../services/task-manager.service'
import { sleep } from '../../utils/helpers'
import { logger } from '../../core/logger'
import { stats } from '../../services/stats.service'
import type { RemoverServidoresConfig } from '../../../src/types/tools'

/**
 * Sai de todos os servidores da conta conectada com delay configurável
 */
export async function removerServidores(cfg: RemoverServidoresConfig) {
  const client = discord.getActiveClient()
  const currentUserId = client.user?.id

  let servidores = client.guilds.cache.map((g: any) => g)

  // 1. Filter by specific guild IDs if provided
  if (cfg.guildIds && cfg.guildIds.length > 0) {
    const set = new Set(cfg.guildIds)
    servidores = servidores.filter((g: any) => set.has(g.id))
  }

  // 2. Protect owned servers by default
  const protectOwned = cfg.ignoreOwned !== false
  if (protectOwned) {
    servidores = servidores.filter((g: any) => {
      const isOwner = Boolean(g.ownerId === currentUserId || g.owner)
      if (isOwner) {
        logger.info('RemoverServidores', `Protegendo servidor próprio: "${g.name}" (${g.id})`)
      }
      return !isOwner
    })
  }

  if (servidores.length === 0) {
    throw Object.assign(new Error('Nenhum servidor elegível para sair (servidores próprios protegidos).'), { statusCode: 400 })
  }

  const task = taskManager.createTask('remover-servidores', {
    ...(cfg as unknown as Record<string, unknown>),
    totalServidores: servidores.length,
  })
  const controller = taskManager.startTask(task.id)
  if (!controller) throw new Error('Falha ao iniciar task')

  executarRemocaoServidores(task.id, servidores, cfg).catch(() => {})

  return { taskId: task.id, totalServidores: servidores.length }
}

async function executarRemocaoServidores(
  taskId: string,
  servidores: any[],
  cfg: RemoverServidoresConfig,
) {
  const startTime = Date.now()
  try {
    let removidos = 0

    taskManager.updateProgress(taskId, 0, servidores.length, `0/${servidores.length} servidores removidos`, 'deleting')

    for (const servidor of servidores) {
      if (taskManager.isAborted(taskId)) {
        taskManager.failTask(taskId, `Cancelado (${removidos}/${servidores.length} removidos)`)
        return
      }

      await sleep(cfg.delay)

      try {
        await servidor.leave()
        removidos++
      } catch {
        removidos++
      }

      taskManager.updateProgress(
        taskId, removidos, servidores.length,
        `${removidos}/${servidores.length} servidores removidos`,
        'deleting',
      )
    }

    const duration = Math.floor((Date.now() - startTime) / 1000)
    stats.recordAction('remover-servidores', duration, {
      serversLeft: removidos,
      totalServers: servidores.length,
    })

    taskManager.completeTask(taskId)
    logger.success('RemoverServidores', `${removidos} servidores removidos`)
  } catch (err) {
    taskManager.failTask(taskId, String(err))
    logger.error('RemoverServidores', `Erro: ${err}`)
  }
}
