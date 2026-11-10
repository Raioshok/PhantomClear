import { taskManager } from '../../services/task-manager.service'
import { sleep } from '../../utils/helpers'
import { logger } from '../../core/logger'

export interface WebhookEmbed {
  title?: string
  description?: string
  color?: number
  url?: string
  footer?: { text: string; icon_url?: string }
  image?: { url: string }
  thumbnail?: { url: string }
  fields?: Array<{ name: string; value: string; inline?: boolean }>
}

export interface WebhookSendPayload {
  webhookUrl: string
  content?: string
  username?: string
  avatarUrl?: string
  embeds?: WebhookEmbed[]
}

export interface WebhookSpamPayload extends WebhookSendPayload {
  count: number
  delay: number
}

export async function testWebhook(webhookUrl: string): Promise<{
  valid: boolean
  id?: string
  name?: string
  channel_id?: string
  guild_id?: string
  avatar?: string
}> {
  try {
    const res = await fetch(webhookUrl)
    if (!res.ok) return { valid: false }
    const data = await res.json() as any
    return {
      valid: true,
      id: data.id,
      name: data.name,
      channel_id: data.channel_id,
      guild_id: data.guild_id,
      avatar: data.avatar,
    }
  } catch {
    return { valid: false }
  }
}

export async function sendWebhookMessage(payload: WebhookSendPayload): Promise<{ success: boolean; status: number }> {
  const body: any = {}
  if (payload.content) body.content = payload.content
  if (payload.username) body.username = payload.username
  if (payload.avatarUrl) body.avatar_url = payload.avatarUrl
  if (payload.embeds && payload.embeds.length > 0) body.embeds = payload.embeds

  const res = await fetch(payload.webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`Webhook respondeu com erro ${res.status}: ${errText}`)
  }

  return { success: true, status: res.status }
}

export async function startWebhookSpam(payload: WebhookSpamPayload): Promise<{ taskId: string; count: number }> {
  const test = await testWebhook(payload.webhookUrl)
  if (!test.valid) {
    throw Object.assign(new Error('URL de Webhook inválida ou inacessível.'), { statusCode: 400 })
  }

  const task = taskManager.createTask('webhook-spam', {
    count: payload.count,
    delay: payload.delay,
    webhookName: test.name,
  })
  const controller = taskManager.startTask(task.id)
  if (!controller) throw new Error('Falha ao iniciar task')

  ;(async () => {
    let sent = 0
    taskManager.updateProgress(task.id, 0, payload.count, `0/${payload.count} mensagens enviadas`, 'running')

    for (let i = 0; i < payload.count; i++) {
      if (taskManager.isAborted(task.id)) break

      try {
        await sendWebhookMessage(payload)
        sent++
      } catch (err) {
        logger.warn('Webhooks', `Erro ao disparar webhook: ${err}`)
      }

      taskManager.updateProgress(task.id, sent, payload.count, `${sent}/${payload.count} mensagens enviadas`, 'running')
      await sleep(payload.delay)
    }

    taskManager.completeTask(task.id)
    logger.info('Webhooks', `Spam finalizado: ${sent} mensagens enviadas`)
  })().catch(() => {})

  return { taskId: task.id, count: payload.count }
}
