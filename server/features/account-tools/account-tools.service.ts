import { discord } from '../../services/discord.service'
import { taskManager } from '../../services/task-manager.service'
import { sleep } from '../../utils/helpers'
import { logger } from '../../core/logger'

export interface RelationshipItem {
  id: string
  username: string
  discriminator: string
  avatar: string | null
  globalName?: string | null
  type: number // 1: Friend, 2: Blocked, 3: Incoming, 4: Outgoing
}

export async function getRelationshipsList(): Promise<{
  incoming: RelationshipItem[]
  outgoing: RelationshipItem[]
  friends: RelationshipItem[]
  blocked: RelationshipItem[]
}> {
  const client = discord.getActiveClient()
  if (!client || !client.isReady()) {
    throw Object.assign(new Error('Nenhuma conta conectada'), { statusCode: 400 })
  }

  const incoming: RelationshipItem[] = []
  const outgoing: RelationshipItem[] = []
  const friends: RelationshipItem[] = []
  const blocked: RelationshipItem[] = []

  // relationships.cache is a Collection<Snowflake, number>
  for (const [userId, type] of client.relationships.cache.entries()) {
    const user = client.users.cache.get(userId)
    const item: RelationshipItem = {
      id: userId,
      username: user?.username || 'Usuário Desconhecido',
      discriminator: user?.discriminator || '0',
      avatar: user?.avatar || null,
      globalName: user?.globalName || null,
      type: type as number,
    }

    if (type === 3) incoming.push(item)
    else if (type === 4) outgoing.push(item)
    else if (type === 1) friends.push(item)
    else if (type === 2) blocked.push(item)
  }

  return { incoming, outgoing, friends, blocked }
}

export async function acceptAllIncoming(delay = 1000): Promise<{ taskId: string; total: number }> {
  const client = discord.getActiveClient()
  if (!client || !client.isReady()) {
    throw Object.assign(new Error('Nenhuma conta conectada'), { statusCode: 400 })
  }

  const incomingIds: string[] = []
  for (const [userId, type] of client.relationships.cache.entries()) {
    if (type === 3) incomingIds.push(userId)
  }

  if (incomingIds.length === 0) {
    throw Object.assign(new Error('Nenhuma solicitação de amizade pendente para aceitar'), { statusCode: 400 })
  }

  const task = taskManager.createTask('accept-requests', { total: incomingIds.length })
  const controller = taskManager.startTask(task.id)
  if (!controller) throw new Error('Falha ao iniciar task')

  ;(async () => {
    let accepted = 0
    taskManager.updateProgress(task.id, 0, incomingIds.length, `Aceitando solicitações: 0/${incomingIds.length}`, 'running')
    for (const uid of incomingIds) {
      if (taskManager.isAborted(task.id)) break
      try {
        await client.api.users['@me'].relationships[uid].put({
          data: {},
          DiscordContext: { location: 'Friends' },
        })
        accepted++
      } catch (err) {
        logger.warn('AccountTools', `Falha ao aceitar ${uid}: ${err}`)
      }
      taskManager.updateProgress(task.id, accepted, incomingIds.length, `Aceitando solicitações: ${accepted}/${incomingIds.length}`, 'running')
      await sleep(delay)
    }
    taskManager.completeTask(task.id)
  })().catch(() => {})

  return { taskId: task.id, total: incomingIds.length }
}

export async function cancelAllOutgoing(delay = 800): Promise<{ taskId: string; total: number }> {
  const client = discord.getActiveClient()
  if (!client || !client.isReady()) {
    throw Object.assign(new Error('Nenhuma conta conectada'), { statusCode: 400 })
  }

  const outgoingIds: string[] = []
  for (const [userId, type] of client.relationships.cache.entries()) {
    if (type === 4) outgoingIds.push(userId)
  }

  if (outgoingIds.length === 0) {
    throw Object.assign(new Error('Nenhuma solicitação enviada pendente'), { statusCode: 400 })
  }

  const task = taskManager.createTask('cancel-outgoing-requests', { total: outgoingIds.length })
  const controller = taskManager.startTask(task.id)
  if (!controller) throw new Error('Falha ao iniciar task')

  ;(async () => {
    let cancelled = 0
    taskManager.updateProgress(task.id, 0, outgoingIds.length, `Cancelando solicitações enviadas: 0/${outgoingIds.length}`, 'running')
    for (const uid of outgoingIds) {
      if (taskManager.isAborted(task.id)) break
      try {
        await client.api.users['@me'].relationships[uid].delete({
          DiscordContext: { location: 'Friends' },
        })
        cancelled++
      } catch (err) {
        logger.warn('AccountTools', `Falha ao cancelar ${uid}: ${err}`)
      }
      taskManager.updateProgress(task.id, cancelled, outgoingIds.length, `Cancelando solicitações enviadas: ${cancelled}/${outgoingIds.length}`, 'running')
      await sleep(delay)
    }
    taskManager.completeTask(task.id)
  })().catch(() => {})

  return { taskId: task.id, total: outgoingIds.length }
}

export async function setHypeSquadHouse(houseId: number): Promise<{ success: boolean; houseId: number }> {
  const client = discord.getActiveClient()
  if (!client || !client.isReady()) {
    throw Object.assign(new Error('Nenhuma conta conectada'), { statusCode: 400 })
  }

  if (houseId === 0) {
    // Leave HypeSquad
    await client.api.hypesquad.online.delete()
    logger.info('AccountTools', 'Saiu da HypeSquad')
    return { success: true, houseId: 0 }
  }

  if (![1, 2, 3].includes(houseId)) {
    throw Object.assign(new Error('Casa inválida. 1=Bravery, 2=Brilliance, 3=Balance'), { statusCode: 400 })
  }

  await client.api.hypesquad.online.post({
    data: { house_id: houseId },
  })
  logger.info('AccountTools', `HypeSquad alterada para Casa ${houseId}`)
  return { success: true, houseId }
}
