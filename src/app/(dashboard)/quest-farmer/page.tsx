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
  AlertTriangle,
  Zap,
  Coins,
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
  targetSeconds: number
  doneSeconds: number
  orbsReward: number
  taskType: string
}

interface BountyItem {
  creativeId: string
  advertiserName: string
  productName: string
  endsAt: string
  orbs: number
  claimed: boolean
}

export default function PaginaQuestFarmer() {
  const { activeToken, tokens, selectToken } = useTokens()
  const [quests, setQuests] = useState<QuestItem[]>([])
  const [bounties, setBounties] = useState<BountyItem[]>([])
  const [orbBalance, setOrbBalance] = useState<number>(0)

  const [loading, setLoading] = useState(false)
  const [starting, setStarting] = useState(false)
  const [farming, setFarming] = useState(false)
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [progressMsg, setProgressMsg] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [percent, setPercent] = useState(0)

  const { isRunning: isQuestRunning, activeTask: questTask } = useActiveTask('quest-farmer')

  useEffect(() => {
    if (!activeToken && tokens.length > 0) {
      selectToken(tokens[0].id)
    }
  }, [activeToken, tokens, selectToken])

  useEffect(() => {
    if (isQuestRunning && questTask) {
      setFarming(true)
      setActiveTaskId(questTask.id)
      setProgressMsg(questTask.phase || "Auto-Farm rápido de Quests e Orbs em andamento...")
      if (questTask.total > 0) {
        setPercent(Math.round((questTask.progress / questTask.total) * 100))
      }
    }
  }, [isQuestRunning, questTask])

  useEffect(() => {
    loadData()
  }, [activeToken])

  const loadData = async () => {
    setLoading(true)
    setErrorMessage("")
    try {
      const res = await api.getQuestFarmerData()
      if (res.data) {
        if (Array.isArray(res.data.quests)) setQuests(res.data.quests)
        if (Array.isArray(res.data.bounties)) setBounties(res.data.bounties)
        if (typeof res.data.orbBalance === 'number') setOrbBalance(res.data.orbBalance)
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao conectar à API de Quests do Discord.")
    } finally {
      setLoading(false)
    }
  }

  useWSEvent<WSToolProgress>("tool:progress", (ev) => {
    if (ev.taskId === activeTaskId) {
      setProgressMsg(ev.message)
      setFarming(true)
      setStarting(false)
      if (ev.total > 0) {
        setPercent(Math.round((ev.progress / ev.total) * 100))
      }
    }
  })

  useWSEvent<{ percent: number }>("quest-farmer:progress", (ev) => {
    setPercent(ev.percent)
    setFarming(true)
    setStarting(false)
  })

  useWSEvent("quest-farmer:claimed", () => {
    loadData()
  })

  useWSEvent("quest-farmer:bounty-claimed", () => {
    loadData()
  })

  useWSEvent<WSToolCompleted>("tool:completed", (ev) => {
    if (ev.taskId === activeTaskId) {
      setFarming(false)
      setStarting(false)
      setActiveTaskId(null)
      setProgressMsg("Farm concluído! Todas as Quests e Bounties foram concluídas e resgatadas.")
      loadData()
    }
  })

  useWSEvent<WSToolError>("tool:error", (ev) => {
    if (ev.taskId === activeTaskId) {
      setFarming(false)
      setStarting(false)
      setActiveTaskId(null)
      setErrorMessage(`Erro no farm: ${ev.error}`)
      setProgressMsg(`Erro: ${ev.error}`)
    }
  })

  const handleStartFarm = async () => {
    setErrorMessage("")
    setStarting(true)
    setProgressMsg("Iniciando bypass rápido de 2 minutos (Quests + Bounties)...")
    setFarming(true)
    setPercent(5)

    try {
      const res = await api.startQuestFarmer()
      if (res.data?.taskId) {
        setActiveTaskId(res.data.taskId)
        setFarming(true)
      } else {
        setFarming(false)
        setErrorMessage("Não foi possível iniciar a tarefa de farm.")
      }
    } catch (err: any) {
      setFarming(false)
      setErrorMessage(err.message || "Falha ao iniciar o farm.")
      setProgressMsg("")
    } finally {
      setStarting(false)
    }
  }

  const handleStopFarm = async () => {
    if (!activeTaskId) return
    try {
      await api.cancelTask(activeTaskId)
    } catch {}
    setFarming(false)
    setStarting(false)
    setActiveTaskId(null)
    setProgressMsg("Farm pausado.")
  }

  const handleEnroll = async (questId: string) => {
    try {
      await api.enrollQuest(questId)
      loadData()
    } catch {}
  }

  const handleClaim = async (questId: string) => {
    try {
      await api.claimQuest(questId)
      loadData()
    } catch {}
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-400" />
            Discord Quest & Orbs Farmer (Fast-Forward 2 Min)
          </h1>
          <p className="text-sm text-muted-foreground">
            Bypass acelerado que conclui missões em ~2 minutos e resgata Bounties instantâneas de 50 Orbs cada.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeToken ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-[11px] font-semibold text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>@{activeToken.username}</span>
            </div>
          ) : tokens.length > 0 ? (
            <button
              type="button"
              onClick={() => selectToken(tokens[0].id)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-amber-500/30 bg-amber-500/10 text-[11px] font-semibold text-amber-300 hover:bg-amber-500/20 cursor-pointer"
            >
              <span>Conectar @{tokens[0].username}</span>
            </button>
          ) : null}

          <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="gap-1.5 text-xs">
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
              disabled={starting}
              className="bg-amber-500 hover:bg-amber-400 text-black font-semibold gap-2 text-xs shadow-md cursor-pointer"
            >
              {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              {starting ? "Iniciando..." : "Auto-Farm Rápido (2 Minutos)"}
            </Button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Saldo de Quest Orbs</p>
              <p className="text-2xl font-black text-amber-400 font-mono mt-0.5 flex items-center gap-1.5">
                <Coins className="h-5 w-5 text-amber-400" />
                {orbBalance.toLocaleString()} Orbs
              </p>
            </div>
            <Award className="h-6 w-6 text-amber-400/40" />
          </CardContent>
        </Card>

        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Quests Disponíveis</p>
              <p className="text-2xl font-black text-primary font-mono mt-0.5">{quests.length}</p>
            </div>
            <Gamepad2 className="h-6 w-6 text-primary/40" />
          </CardContent>
        </Card>

        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Bounties Imediatas (50 Orbs)</p>
              <p className="text-2xl font-black text-emerald-400 font-mono mt-0.5">{bounties.length}</p>
            </div>
            <Gift className="h-6 w-6 text-emerald-400/40" />
          </CardContent>
        </Card>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-semibold text-rose-300">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {farming && (
        <Card className="border-amber-500/30 bg-amber-500/10 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-amber-300 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
              {progressMsg || "Enviando heartbeats acelerados e resgatando Orbs..."}
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

      {/* Quests Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Gamepad2 className="h-4 w-4 text-primary" /> Missões Oficiais do Discord ({quests.length})
          </h2>
        </div>

        {quests.length === 0 ? (
          <Card className="p-8 text-center text-xs text-muted-foreground">
            <Gamepad2 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
            Nenhuma missão do Discord encontrada no momento.
            <div className="mt-2">
              <Button onClick={loadData} size="sm" variant="outline" className="text-xs">
                Recarregar Quests
              </Button>
            </div>
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
                        <CardDescription className="text-xs">
                          {q.applicationName} · {Math.round(q.targetSeconds / 60)} min ({q.orbsReward > 0 ? `+${q.orbsReward} Orbs` : 'Recompensa'})
                        </CardDescription>
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
                      {q.expiresAt ? `Expira: ${new Date(q.expiresAt).toLocaleDateString()}` : 'Ativo'}
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

      {/* Bounties Section */}
      {bounties.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Gift className="h-4 w-4 text-emerald-400" /> Bounties Patrocinadas (+50 Orbs Imediatos)
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {bounties.map((b) => (
              <Card key={b.creativeId} className="border-emerald-500/30 bg-emerald-500/5 p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-foreground">{b.advertiserName}</p>
                  <p className="text-[11px] text-muted-foreground">{b.productName}</p>
                  <span className="inline-block mt-1 font-mono text-xs font-bold text-emerald-400">
                    +50 Quest Orbs
                  </span>
                </div>
                <Button
                  size="sm"
                  onClick={handleStartFarm}
                  className="h-8 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs"
                >
                  Resgatar
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
