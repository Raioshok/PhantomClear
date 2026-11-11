/**
 * Rotas de configurações do painel
 * @returns {Router} Leitura, atualização e reset das configurações
 */
import { Router } from 'express'
import { storage } from '../services/storage.service'
import { stats } from '../services/stats.service'
import { z } from 'zod'
import { validate } from '../middleware/validation.middleware'

const router = Router()

const updateSettingsSchema = z.object({
  rpc: z.object({
    applicationId: z.string().optional(),
    detalhes: z.string().optional(),
    estado: z.string().optional(),
    nome: z.string().optional(),
    imagemUrl: z.string().optional(),
    botoes: z.array(z.object({ label: z.string(), url: z.string() })).optional(),
    desativado: z.boolean().optional(),
  }).partial().optional(),
  corPainel: z.string().optional(),
  tema: z.string().optional(),
  delay: z.number().min(0.1).optional(),
  aguardarFetch: z.boolean().optional(),
  aparencia: z.object({
    bloomIntensidade: z.enum(['desligado', 'sutil', 'normal', 'intenso']).optional(),
    estiloCards: z.enum(['flat', 'glass', 'bordered']).optional(),
    tamanhoFonte: z.enum(['pequeno', 'normal', 'grande']).optional(),
    mostrarGrade: z.boolean().optional(),
  }).partial().optional(),
  general: z.object({
    language: z.string().optional(),
    notifications: z.boolean().optional(),
    minimizeToTray: z.boolean().optional(),
    logLevel: z.enum(['debug', 'info', 'warn', 'error']).optional(),
  }).partial().optional(),
  storage: z.object({
    backupsDir: z.string().optional(),
    logsDir: z.string().optional(),
  }).partial().optional(),
}).passthrough()

/**
 * Retorna as configurações atuais do painel
 * @returns {Object} Configurações completas
 */
router.get('/', (_req, res) => {
  const settings = storage.getSettings()
  res.json({ success: true, data: settings, timestamp: new Date().toISOString() })
})

/**
 * Atualiza parcialmente as configurações
 * @returns {Object} Configurações atualizadas
 */
router.patch('/', validate(updateSettingsSchema), (req, res) => {
  const updated = storage.saveSettings(req.body)
  res.json({ success: true, data: updated, timestamp: new Date().toISOString() })
})

/**
 * Limpa todos os dados armazenados (reset total)
 * @returns {Object} Resultado da limpeza
 */
router.post('/clear-all', (_req, res) => {
  try {
    const result = storage.clearAllData()
    stats.load()
    res.json({ success: true, data: result, timestamp: new Date().toISOString() })
  } catch (err) {
    res.status(500).json({ success: false, error: `Erro ao limpar dados: ${err}` })
  }
})

export default router
