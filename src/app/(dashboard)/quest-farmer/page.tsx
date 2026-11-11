import { useState, useEffect } from "react"
import {
  Gamepad2,
  Sparkles,
  Loader2,
  CheckCircle2,
  Clock,
  Play,
  StopCircle,
  Gift,
  ExternalLink,
  RotateCw,
  Award,
  Flame,
  Shield,
  Layers,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useTokens } from "@/hooks/use-tokens"
import { useActiveTask } from "@/hooks/use-tasks"
import { useWSEvent } from "@/hooks/use-websocket"
import { api } from "@/lib/api-client"
import type { WSToolProgress, WSToolCompleted, WSToolError } from "@/types/websocket"

interface QuestItem {
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

export default function PaginaQuestFarmer() {
  const { activeToken, tokens } = useTokens()
  const [quests, setQuests] = useState<QuestItem[]>([])
  const [loading, setLoading] = useState(false)
  const [farming, setFarming] = useState(false)
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [progressMsg, setProgressMsg] = useState("")
  const [percent, setPercent] = useState(0)

  const { isRunning: isQuestRunning, activeTask: questTask } = useActiveTask('quest-farmer')

  useEffect(() => {
    if (isQuestRunning && questTask) {
      setFarming(true)
      setActiveTaskId(questTask.id)
    }
  }, [isQuestRunning, questTask])

  useEffect(() => {
    loadQuests()
  }, [activeToken])

  const loadQuests = async () => {
    setLoading(true)
    try {
      const res = await api.getQuests()
      if (res.data) setQuests(res.data)
    } catch {} finally {
      setLoading(false)
    }
  }

  useWSEvent<WSToolProgress>("tool:progress", (ev) => {
    if (ev.taskId === activeTaskId) {
      setProgressMsg(ev.message)
      setFarming(true)
    }
  })

  useWSEvent<{ percent: number }>("quest-farmer:progress", (ev) => {
    setPercent(ev.percent)
  })

  useWSEvent("quest-farmer:claimed", () => {
    loadQuests()
  })

  useWSEvent<WSToolCompleted>("tool:completed", (ev) => {
    if (ev.taskId === activeTaskId) {
      setFarming(false)
      setActiveTaskId(null)
      setProgressMsg("Farm de Quests concluído! Recompensas e Orbs resgatados.")
      loadQuests()
    }
  })

  useWSEvent<WSToolError>("tool:error", (ev) => {
    if (ev.taskId === activeTaskId) {
      setFarming(false)
      setActiveTaskId(null)
      setProgressMsg(`Erro no farm: ${ev.error}`)
    }
  })

  const handleStartFarm = async () => {
    setFarming(true)
    setProgressMsg("Iniciando simulação de jogo e envio de heartbeats...")
    try {
      const res = await api.startQuestFarmer()
      if (res.data?.taskId) {
        setActiveTaskId(res.data.taskId)
      }
    } catch (err: any) {
      setFarming(false)
      setProgressMsg(`Falha ao iniciar: ${err.message || 'Erro desconhecido'}`)
    }
  }

  const handleStopFarm = async () => {
    if (!activeTaskId) return
    try {
      await api.cancelTask(activeTaskId)
    } catch {}
    setFarming(false)
    setActiveTaskId(null)
    setProgressMsg("Farm de Quests pausado.")
  }

  const handleEnroll = async (questId: string) => {
    try {
      await api.enrollQuest(questId)
      loadQuests()
    } catch {}
  }

  const handleClaim = async (questId: string) => {
    try {
      await api.claimQuest(questId)
      loadQuests()
    } catch {}
  }

  const enrolledCount = quests.filter((q) => q.enrolled).length
  const completedCount = quests.filter((q) => q.completed).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-400" />
            Discord Quest & Orbs Farmer
          </h1>
          <p className="text-sm text-muted-foreground">
            Farme missões do Discord automaticamente para coletar Quest Orbs, decorações de avatar e recompensas de jogos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadQuests} disabled={loading} className="gap-1.5 text-xs">
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCw className="h-3 w-3" />}
            Atualizar
          </Button>

          {farming ? (
            <Button onClick={handleStopFarm} variant="destructive" className="gap-2 font-semibold text-xs shadow-md">
              <StopCircle className="h-4 w-4" /> Parar Farm ({percent}%)
            </Button>
          ) : (
            <Button
              onClick={handleStartFarm}
              className="bg-amber-500 hover:bg-amber-400 text-black font-semibold gap-2 text-xs shadow-md"
            >
              <Sparkles className="h-4 w-4" /> Auto-Farm Todas as Quests
            </Button>
          )}
        </div>
      </div>

      {farming && (
        <Card className="border-amber-500/30 bg-amber-500/10 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-amber-300 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
              {progressMsg || "Simulando tempo de jogo no Discord Gateway e enviando heartbeats..."}
            </span>
            <span className="font-mono font-bold text-amber-300">{percent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-black/40">
            <div
              className="h-full bg-amber-400 transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
        </Card>
      )}

      {/* Quests List */}
      <div className="space-y-4">
        {quests.length === 0 ? (
          <Card className="p-8 text-center text-xs text-muted-foreground">
            <Gamepad2 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
            Nenhuma missão do Discord ativa no momento para esta conta.
            <p className="text-[11px] text-muted-foreground/70 mt-1">
              O Discord libera novas quests periodicamente na aba Descobrir Missões.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {quests.map((q) => (
              <Card key={q.id} className="border-border/70 bg-card/60 overflow-hidden flex flex-col justify-between">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {q.icon ? (
                        <img src={q.icon} alt={q.name} className="h-10 w-10 rounded-xl object-cover ring-1 ring-border/80" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20">
                          <Gamepad2 className="h-5 w-5" />
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-sm font-bold text-foreground">{q.name}</CardTitle>
                        <CardDescription className="text-xs">{q.applicationName} · {q.targetMinutes} min de jogo</CardDescription>
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        q.claimed
                          ? "bg-emerald-500/20 text-emerald-400"
                          : q.completed
                          ? "bg-amber-500/20 text-amber-400"
                          : q.enrolled
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {q.claimed ? "Resgatado" : q.completed ? "Concluído" : q.enrolled ? "Em Progresso" : "Disponível"}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="p-4 pt-2 space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>Progresso da Quest</span>
                      <span className="font-mono font-semibold text-foreground">{q.progressPercent}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full bg-amber-400 transition-all duration-300"
                        style={{ width: `${q.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-muted-foreground">
                      Expira em: {q.expiresAt ? new Date(q.expiresAt).toLocaleDateString() : 'Em breve'}
                    </span>

                    <div className="flex items-center gap-2">
                      {!q.enrolled && !q.completed && !q.claimed && (
                        <Button size="sm" variant="outline" onClick={() => handleEnroll(q.id)} className="h-7 text-xs">
                          Inscrever-se
                        </Button>
                      )}

                      {q.completed && !q.claimed && (
                        <Button
                          size="sm"
                          onClick={() => handleClaim(q.id)}
                          className="h-7 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs gap-1"
                        >
                          <Gift className="h-3 w-3" /> Resgatar Orbs
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
