import { useState, useEffect } from "react"
import {
  Rocket,
  Clock,
  Sparkles,
  Play,
  Square,
  AlertTriangle,
  CheckCircle2,
  Server,
  Hash,
  RotateCw,
  Shuffle,
  ShieldAlert,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { GuildPicker } from "@/components/guild-picker"
import { ChannelPicker } from "@/components/channel-picker"
import { useTokens } from "@/hooks/use-tokens"
import { useWSEvent } from "@/hooks/use-websocket"
import { api } from "@/lib/api-client"

interface AutoBumpStatus {
  active: boolean
  guildId: string | null
  guildName: string | null
  channelId: string | null
  channelName: string | null
  lastBumpAt: string | null
  nextBumpAt: string | null
  totalBumps: number
  lastStatus: "success" | "failed" | "cooldown" | "idle"
  lastMessage: string
}

export default function PaginaAutoBump() {
  const { activeToken } = useTokens()
  const [guildId, setGuildId] = useState("")
  const [channelId, setChannelId] = useState("")
  const [intervalMinutes, setIntervalMinutes] = useState(120)
  const [jitterMinutes, setJitterMinutes] = useState(2)
  const [mode, setMode] = useState<"slash" | "text">("slash")
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<AutoBumpStatus>({
    active: false,
    guildId: null,
    guildName: null,
    channelId: null,
    channelName: null,
    lastBumpAt: null,
    nextBumpAt: null,
    totalBumps: 0,
    lastStatus: "idle",
    lastMessage: "Nenhum bump executado ainda.",
  })
  const [countdown, setCountdown] = useState<string>("--:--")

  useWSEvent<AutoBumpStatus>("autobump:status", (newStatus) => {
    setStatus(newStatus)
  })

  useWSEvent<{ total: number; channelId: string; timestamp: string }>("autobump:bumped", (data) => {
    setStatus((prev) => ({
      ...prev,
      totalBumps: data.total,
      lastBumpAt: data.timestamp,
      lastStatus: "success",
      lastMessage: "Comando /bump disparado com sucesso!",
    }))
  })

  useEffect(() => {
    loadStatus()
  }, [activeToken])

  // Countdown timer calculation
  useEffect(() => {
    if (!status.active || !status.nextBumpAt) {
      setCountdown("--:--")
      return
    }

    const interval = setInterval(() => {
      const diff = new Date(status.nextBumpAt!).getTime() - Date.now()
      if (diff <= 0) {
        setCountdown("Executando...")
        return
      }
      const mins = Math.floor(diff / 60000)
      const secs = Math.floor((diff % 60000) / 1000)
      setCountdown(`${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`)
    }, 1000)

    return () => clearInterval(interval)
  }, [status.active, status.nextBumpAt])

  const loadStatus = async () => {
    try {
      const res = await api.getAutoBumpStatus()
      if (res.data) {
        setStatus(res.data)
        if (res.data.guildId) setGuildId(res.data.guildId)
        if (res.data.channelId) setChannelId(res.data.channelId)
      }
      const cfg = await api.getAutoBumpConfig()
      if (cfg.data) {
        if (cfg.data.intervalMinutes) setIntervalMinutes(cfg.data.intervalMinutes)
        if (cfg.data.jitterMinutes) setJitterMinutes(cfg.data.jitterMinutes)
        if (cfg.data.mode) setMode(cfg.data.mode)
      }
    } catch {}
  }

  const handleStart = async () => {
    if (!channelId) return
    setLoading(true)
    try {
      const res = await api.startAutoBump({
        guildId,
        channelId,
        intervalMinutes: Number(intervalMinutes) || 120,
        jitterMinutes: Number(jitterMinutes) || 2,
        mode,
      })
      if (res.data) setStatus(res.data)
    } catch (err: any) {
      alert(err.message || "Erro ao iniciar AutoBumper")
    } finally {
      setLoading(false)
    }
  }

  const handleStop = async () => {
    setLoading(true)
    try {
      const res = await api.stopAutoBump()
      if (res.data) setStatus(res.data)
    } catch (err: any) {
      alert(err.message || "Erro ao parar AutoBumper")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-r from-card/80 via-card/50 to-primary/5 p-6 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary shadow-lg shadow-primary/10">
              <Rocket className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Disboard AutoBumper</h1>
                <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary uppercase">
                  Bumping Autônomo
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Bumping periódico 24/7 de servidores no Disboard via slash command nativo (/bump) com jitter anti-detecção.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {status.active ? (
              <Button
                variant="destructive"
                onClick={handleStop}
                disabled={loading}
                className="gap-2 shadow-lg shadow-destructive/20 font-medium"
              >
                <Square className="h-4 w-4" /> Parar Bumper
              </Button>
            ) : (
              <Button
                onClick={handleStart}
                disabled={loading || !channelId}
                className="gap-2 shadow-lg shadow-primary/20 font-medium bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Play className="h-4 w-4" /> Iniciar Bumper
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Estado do Motor</p>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    status.active ? "bg-emerald-400 animate-pulse" : "bg-muted-foreground/40"
                  }`}
                />
                <p className="text-lg font-bold font-mono text-foreground">
                  {status.active ? "ATIVO" : "PARADO"}
                </p>
              </div>
            </div>
            <Sparkles className="h-5 w-5 text-primary" />
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Próximo Bump Em</p>
              <p className="text-2xl font-black font-mono text-primary mt-0.5">{countdown}</p>
            </div>
            <Clock className="h-5 w-5 text-primary" />
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total de Bumps</p>
              <p className="text-2xl font-black font-mono text-emerald-400 mt-0.5">{status.totalBumps}</p>
            </div>
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Modo de Envio</p>
              <p className="text-lg font-bold font-mono text-foreground mt-0.5 uppercase">
                {mode === "slash" ? "Slash (/bump)" : "Texto (!d bump)"}
              </p>
            </div>
            <Shuffle className="h-5 w-5 text-amber-400" />
          </CardContent>
        </Card>
      </div>

      {/* Main Configuration & Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Column */}
        <Card className="lg:col-span-2 border-border/60 bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Server className="h-4 w-4 text-primary" /> Parâmetros de Bumping
            </CardTitle>
            <CardDescription>
              Configure o servidor alvo e o canal onde o bot Disboard responde a comandos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Servidor Alvo</label>
                <GuildPicker
                  value={guildId}
                  onChange={(val) => {
                    setGuildId(val)
                    setChannelId("")
                  }}
                  disabled={status.active}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Canal de Comandos / Bump</label>
                <ChannelPicker
                  guildId={guildId}
                  value={channelId}
                  onChange={setChannelId}
                  disabled={status.active || !guildId}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Intervalo Base (minutos)</label>
                <Input
                  type="number"
                  min={1}
                  max={1440}
                  value={intervalMinutes}
                  onChange={(e) => setIntervalMinutes(Number(e.target.value))}
                  disabled={status.active}
                  className="font-mono"
                />
                <span className="text-[11px] text-muted-foreground">Padrão Disboard: 120 minutos (2h).</span>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Jitter Aleatório (minutos)</label>
                <Input
                  type="number"
                  min={0}
                  max={60}
                  value={jitterMinutes}
                  onChange={(e) => setJitterMinutes(Number(e.target.value))}
                  disabled={status.active}
                  className="font-mono"
                />
                <span className="text-[11px] text-muted-foreground">Variação orgânica anti-detecção.</span>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Formato do Comando</label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as "slash" | "text")}
                  disabled={status.active}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="slash">Slash (/bump via interaction)</option>
                  <option value="text">Texto (!d bump)</option>
                </select>
                <span className="text-[11px] text-muted-foreground">Slash recomendado para discrição.</span>
              </div>
            </div>

            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3 mt-4">
              <ShieldAlert className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Proteção de Cooldown Nativa:</strong> O PhantomClear V2 utiliza o ID de aplicação oficial do Disboard (<code className="text-primary font-mono font-semibold">302050872383242240</code>) e constrói a interação no Gateway de forma idêntica ao cliente oficial do Discord.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Status Column */}
        <Card className="border-border/60 bg-card/60 backdrop-blur-sm flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Hash className="h-4 w-4 text-primary" /> Status da Sessão
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={loadStatus} className="h-8 w-8 p-0">
                <RotateCw className="h-3.5 w-3.5" />
              </Button>
            </div>
            <CardDescription>Resumo em tempo real do pipeline.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            <div className="rounded-xl border border-border/60 bg-secondary/20 p-3 space-y-2 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Último Status:</span>
                <span
                  className={`font-bold uppercase ${
                    status.lastStatus === "success"
                      ? "text-emerald-400"
                      : status.lastStatus === "failed"
                      ? "text-rose-400"
                      : "text-muted-foreground"
                  }`}
                >
                  {status.lastStatus}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Último Disparo:</span>
                <span className="text-foreground">
                  {status.lastBumpAt ? new Date(status.lastBumpAt).toLocaleTimeString() : "Nenhum"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Próximo Disparo:</span>
                <span className="text-primary font-bold">
                  {status.nextBumpAt ? new Date(status.nextBumpAt).toLocaleTimeString() : "--:--"}
                </span>
              </div>

              <div className="pt-2 border-t border-border/40">
                <p className="text-[11px] text-muted-foreground font-sans">Mensagem do Motor:</p>
                <p className="text-xs text-foreground font-mono mt-0.5 break-words">
                  {status.lastMessage}
                </p>
              </div>
            </div>

            {status.lastStatus === "failed" && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-400">
                <AlertTriangle size={14} className="shrink-0" />
                <span>Verifique se o Discord Client está conectado e se o canal é acessível.</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
