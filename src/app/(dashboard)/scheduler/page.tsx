import { useState, useEffect } from "react"
import {
  CalendarClock,
  Plus,
  Play,
  Trash2,
  RotateCw,
  MessageSquare,
  Terminal,
  Activity,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  Server,
  Hash,
  AlertTriangle,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { GuildPicker } from "@/components/guild-picker"
import { ChannelPicker } from "@/components/channel-picker"
import { useTokens } from "@/hooks/use-tokens"
import { useWSEvent } from "@/hooks/use-websocket"
import { api } from "@/lib/api-client"

interface ScheduledJob {
  id: string
  name: string
  type: "message" | "command" | "slash" | "status" | "cleanup"
  guildId?: string
  targetId: string
  content: string
  botId?: string
  intervalMinutes: number
  active: boolean
  lastRunAt: string | null
  nextRunAt: string | null
  runCount: number
  lastStatus?: "success" | "failed"
  lastError?: string
  createdAt: string
}

export default function PaginaScheduler() {
  const { activeToken } = useTokens()
  const [jobs, setJobs] = useState<ScheduledJob[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  // Form State
  const [name, setName] = useState("")
  const [type, setType] = useState<"message" | "command" | "slash" | "status" | "cleanup">("slash")
  const [guildId, setGuildId] = useState("")
  const [targetId, setTargetId] = useState("")
  const [content, setContent] = useState("")
  const [botId, setBotId] = useState("")
  const [intervalMinutes, setIntervalMinutes] = useState(60)

  useWSEvent<ScheduledJob[]>("scheduler:updated", (updatedJobs) => {
    setJobs(updatedJobs)
  })

  useWSEvent<{ id: string; name: string; runCount: number }>("scheduler:executed", (evt) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === evt.id
          ? { ...j, runCount: evt.runCount, lastRunAt: new Date().toISOString(), lastStatus: "success" }
          : j
      )
    )
  })

  useEffect(() => {
    loadJobs()
  }, [activeToken])

  const loadJobs = async () => {
    setLoading(true)
    try {
      const res = await api.getScheduledJobs()
      if (res.data) setJobs(res.data)
    } catch {} finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !content) return

    if ((type === "message" || type === "command" || type === "slash") && !targetId) {
      alert("Por favor selecione um servidor e um canal alvo.")
      return
    }

    try {
      await api.createScheduledJob({
        name,
        type,
        guildId: guildId || undefined,
        targetId: targetId || "channel_default",
        content,
        botId: botId || undefined,
        intervalMinutes: Number(intervalMinutes) || 60,
        active: true,
      })
      setModalOpen(false)
      setName("")
      setContent("")
      setTargetId("")
      setGuildId("")
      setBotId("")
      loadJobs()
    } catch (err: any) {
      alert(err.message || "Erro ao criar agendamento")
    }
  }

  const handleToggle = async (id: string, active: boolean) => {
    try {
      await api.toggleScheduledJob(id, active)
      setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, active } : j)))
    } catch {}
  }

  const handleDelete = async (id: string) => {
    try {
      await api.deleteScheduledJob(id)
      setJobs((prev) => prev.filter((j) => j.id !== id))
    } catch {}
  }

  const handleRunNow = async (id: string) => {
    try {
      await api.runScheduledJobNow(id)
      loadJobs()
    } catch {}
  }

  const activeCount = jobs.filter((j) => j.active).length
  const totalExecutions = jobs.reduce((acc, j) => acc + (j.runCount || 0), 0)

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-r from-card/80 via-card/50 to-primary/5 p-6 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary shadow-lg shadow-primary/10">
              <CalendarClock className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Command & Task Scheduler</h1>
                <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary uppercase">
                  Cron Engine V2
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Automatize disparos de Slash Commands (/), Prefix Commands (;), mensagens de servidor e status com seletor visual de servidores.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setModalOpen(true)}
              className="gap-2 shadow-lg shadow-primary/20 font-medium bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" /> Novo Agendamento
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Tarefas Ativas</p>
              <p className="text-2xl font-black font-mono text-primary mt-0.5">
                {activeCount} / {jobs.length}
              </p>
            </div>
            <Activity className="h-5 w-5 text-primary" />
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total de Disparos</p>
              <p className="text-2xl font-black font-mono text-emerald-400 mt-0.5">{totalExecutions}</p>
            </div>
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Suporte a Comandos</p>
              <p className="text-sm font-bold font-mono text-foreground mt-0.5 uppercase">
                Slash (/) & Prefix (;)
              </p>
            </div>
            <Zap className="h-5 w-5 text-amber-400" />
          </CardContent>
        </Card>
      </div>

      {/* Jobs List */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" /> Agendamentos Configurados
              </CardTitle>
              <CardDescription>
                Tarefas que rodam automaticamente em segundo plano mesmo minimizado.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadJobs} className="gap-1.5 text-xs">
              <RotateCw className="h-3 w-3" /> Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="flex h-44 flex-col items-center justify-center text-muted-foreground">
              <CalendarClock className="h-8 w-8 text-muted-foreground/30 mb-2" />
              Nenhum agendamento cadastrado. Clique em "Novo Agendamento" para começar!
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border/60 bg-secondary/15 p-4 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 mt-0.5 ${
                        job.type === "slash"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : job.type === "message"
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          : job.type === "command"
                          ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      }`}
                    >
                      {job.type === "slash" ? (
                        <Zap className="h-5 w-5" />
                      ) : job.type === "message" ? (
                        <MessageSquare className="h-5 w-5" />
                      ) : job.type === "command" ? (
                        <Terminal className="h-5 w-5" />
                      ) : (
                        <Sparkles className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-foreground text-sm">{job.name}</h4>
                        <span className="rounded-md bg-secondary/50 px-2 py-0.5 text-[10px] font-mono text-muted-foreground uppercase font-bold">
                          {job.type}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">
                          a cada {job.intervalMinutes}m
                        </span>
                        {job.lastStatus && (
                          <span
                            className={`rounded px-1.5 py-0.2 text-[9px] font-mono uppercase font-bold ${
                              job.lastStatus === "success"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-rose-500/20 text-rose-400"
                            }`}
                          >
                            {job.lastStatus}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-mono text-primary/80 mt-1 bg-background/60 px-2 py-1 rounded-md border border-border/40 inline-block">
                        {job.type === "slash" && !job.content.startsWith("/") ? `/${job.content}` : job.content}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground mt-2">
                        <span>Alvo: <code className="font-mono text-foreground font-semibold">{job.targetId}</code></span>
                        <span>Disparos: <strong>{job.runCount}</strong></span>
                        {job.lastRunAt && (
                          <span>Último: {new Date(job.lastRunAt).toLocaleTimeString()}</span>
                        )}
                        {job.nextRunAt && job.active && (
                          <span>Próximo: {new Date(job.nextRunAt).toLocaleTimeString()}</span>
                        )}
                        {job.lastError && (
                          <span className="text-rose-400 font-sans">Erro: {job.lastError}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRunNow(job.id)}
                      className="gap-1.5 text-xs h-8"
                    >
                      <Play className="h-3 w-3 text-emerald-400" /> Disparar Agora
                    </Button>
                    <Switch
                      checked={job.active}
                      onCheckedChange={(val) => handleToggle(job.id, val)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(job.id)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-rose-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border/80 bg-card p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-border/40">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-primary" /> Novo Agendamento
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
                ✕
              </Button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Nome Identificador</label>
                <Input
                  placeholder="Ex: Auto-Daily UnbelievaBoat, Mensagem Periódica, etc."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Tipo de Ação</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="slash">Slash Command (/)</option>
                    <option value="command">Prefix Command (;)</option>
                    <option value="message">Mensagem Simples</option>
                    <option value="status">Atualizar Status</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Intervalo (Minutos)</label>
                  <Input
                    type="number"
                    min={1}
                    max={10080}
                    value={intervalMinutes}
                    onChange={(e) => setIntervalMinutes(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              {/* Server & Channel Picker */}
              {(type === "message" || type === "command" || type === "slash") && (
                <div className="space-y-3 pt-1 border-t border-border/40">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Server className="h-3.5 w-3.5 text-primary" /> Servidor Alvo
                    </label>
                    <GuildPicker
                      value={guildId}
                      onChange={(val) => {
                        setGuildId(val)
                        setTargetId("")
                      }}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Hash className="h-3.5 w-3.5 text-primary" /> Canal Alvo
                    </label>
                    <ChannelPicker
                      guildId={guildId}
                      value={targetId}
                      onChange={setTargetId}
                      disabled={!guildId}
                    />
                  </div>
                </div>
              )}

              {/* Slash Command Options */}
              {type === "slash" && (
                <div className="space-y-3 pt-1 border-t border-border/40">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-amber-400" /> Comando Slash (ex: /bump, /daily, /work)
                    </label>
                    <Input
                      placeholder="bump ou daily ou work"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">
                      ID do Bot / Aplicação (Opcional)
                    </label>
                    <Input
                      placeholder="Deixe em branco para auto-detectar o bot no canal"
                      value={botId}
                      onChange={(e) => setBotId(e.target.value)}
                    />
                    <span className="text-[11px] text-muted-foreground">
                      O PhantomClear inspeciona os comandos registrados no canal para achar o ID correto automaticamente.
                    </span>
                  </div>
                </div>
              )}

              {/* Content for message/prefix/status */}
              {type !== "slash" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    {type === "status" ? "Novo Status" : type === "command" ? "Comando com Prefixo" : "Mensagem a Enviar"}
                  </label>
                  <textarea
                    placeholder={
                      type === "command"
                        ? "Ex: ;cl (para limpar canal) ou ;farm"
                        : type === "status"
                        ? "Ex: Jogando PhantomClear V2"
                        : "Digite a mensagem que será enviada periodicamente..."
                    }
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                    rows={3}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-primary text-primary-foreground font-medium">
                  Salvar e Iniciar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
