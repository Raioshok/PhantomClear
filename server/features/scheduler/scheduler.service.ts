import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { discord } from '../../services/discord.service'
import { config } from '../../config'
import { logger } from '../../core/logger'
import { broadcastWSEvent } from '../../core/websocket'

export interface ScheduledJob {
  id: string
  name: string
  type: 'message' | 'command' | 'status' | 'cleanup'
  targetId: string // Channel ID, Guild ID, or User ID
  content: string  // Text to send, command to run, or status to set
  intervalMinutes: number // e.g. 15, 60, 120
  active: boolean
  lastRunAt: string | null
  nextRunAt: string | null
  runCount: number
  createdAt: string
}

class SchedulerService {
  private jobs: ScheduledJob[] = []
  private timers = new Map<string, NodeJS.Timeout>()
  private filePath: string

  constructor() {
    this.filePath = path.join(config.storage.dataPath, 'scheduler.json')
    this.loadJobs()
  }

  private loadJobs() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8')
        this.jobs = JSON.parse(raw)
      } else {
        this.jobs = []
      }
    } catch {
      this.jobs = []
    }

    // Auto-restart active jobs
    for (const job of this.jobs) {
      if (job.active) {
        this.armJob(job)
      }
    }
  }

  private saveJobs() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.jobs, null, 2), 'utf-8')
    } catch (err: any) {
      logger.error('Scheduler', `Falha ao salvar agendamentos: ${err.message}`)
    }
  }

  getJobs(): ScheduledJob[] {
    return [...this.jobs]
  }

  createJob(data: Omit<ScheduledJob, 'id' | 'lastRunAt' | 'nextRunAt' | 'runCount' | 'createdAt'>): ScheduledJob {
    const job: ScheduledJob = {
      ...data,
      id: randomUUID(),
      lastRunAt: null,
      nextRunAt: null,
      runCount: 0,
      createdAt: new Date().toISOString(),
    }

    this.jobs.push(job)
    this.saveJobs()

    if (job.active) {
      this.armJob(job)
    }

    logger.success('Scheduler', `Novo agendamento criado: ${job.name} (a cada ${job.intervalMinutes}m)`)
    broadcastWSEvent('scheduler:updated', this.getJobs())
    return job
  }

  toggleJob(id: string, active: boolean): ScheduledJob {
    const job = this.jobs.find((j) => j.id === id)
    if (!job) throw Object.assign(new Error('Agendamento não encontrado'), { statusCode: 404 })

    job.active = active
    if (!active) {
      this.disarmJob(id)
      job.nextRunAt = null
    } else {
      this.armJob(job)
    }

    this.saveJobs()
    broadcastWSEvent('scheduler:updated', this.getJobs())
    return job
  }

  deleteJob(id: string): boolean {
    this.disarmJob(id)
    const initialLen = this.jobs.length
    this.jobs = this.jobs.filter((j) => j.id !== id)
    this.saveJobs()
    broadcastWSEvent('scheduler:updated', this.getJobs())
    return this.jobs.length < initialLen
  }

  async runJobNow(id: string): Promise<boolean> {
    const job = this.jobs.find((j) => j.id === id)
    if (!job) return false
    return this.executeJob(job)
  }

  private disarmJob(id: string) {
    const timer = this.timers.get(id)
    if (timer) {
      clearTimeout(timer)
      this.timers.delete(id)
    }
  }

  private armJob(job: ScheduledJob) {
    this.disarmJob(job.id)
    if (!job.active) return

    const delayMs = Math.max(1, job.intervalMinutes) * 60 * 1000
    job.nextRunAt = new Date(Date.now() + delayMs).toISOString()
    this.saveJobs()

    const timer = setTimeout(async () => {
      await this.executeJob(job)
      // Re-arm for next loop
      if (job.active) {
        this.armJob(job)
      }
    }, delayMs)

    this.timers.set(job.id, timer)
  }

  private async executeJob(job: ScheduledJob): Promise<boolean> {
    const client = discord.getActiveClient()
    if (!client || !client.isReady()) {
      logger.warn('Scheduler', `Não foi possível executar job ${job.name}: cliente Discord offline`)
      return false
    }

    try {
      job.lastRunAt = new Date().toISOString()
      job.runCount++

      if (job.type === 'message' || job.type === 'command') {
        const channel = client.channels.cache.get(job.targetId) || (await client.channels.fetch(job.targetId).catch(() => null))
        if (channel && typeof channel.send === 'function') {
          await channel.send(job.content)
          logger.success('Scheduler', `Job ${job.name}: mensagem enviada com sucesso no canal ${job.targetId}`)
        } else {
          throw new Error('Canal não acessível')
        }
      } else if (job.type === 'status') {
        await client.user.setActivity(job.content, { type: 'PLAYING' })
        logger.success('Scheduler', `Job ${job.name}: status atualizado para "${job.content}"`)
      }

      this.saveJobs()
      broadcastWSEvent('scheduler:executed', { id: job.id, name: job.name, runCount: job.runCount })
      return true
    } catch (err: any) {
      logger.error('Scheduler', `Erro ao executar job ${job.name}: ${err.message}`)
      return false
    }
  }
}

export const scheduler = new SchedulerService()
