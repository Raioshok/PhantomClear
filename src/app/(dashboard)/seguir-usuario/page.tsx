import { useState } from "react"
import {
  Footprints,
  Play,
  Square,
  MicOff,
  VolumeX,
  Server,
  User,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Compass,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { GuildPicker } from "@/components/guild-picker"
import { useTokens } from "@/hooks/use-tokens"
import { useTasks } from "@/hooks/use-tasks"
import { api } from "@/lib/api-client"

export default function PaginaSeguirUsuario() {
  const { activeToken } = useTokens()
  const { tasks, cancelTask } = useTasks()

  const [targetId, setTargetId] = useState("")
  const [guildId, setGuildId] = useState("")
  const [selfMute, setSelfMute] = useState(false)
  const [selfDeaf, setSelfDeaf] = useState(false)
  const [stayOnDisconnect, setStayOnDisconnect] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Find active follow-member task if running
  const activeTask = tasks.find(
    (t) => t.tool === "call-utils" && t.status === "running" && (t.config as any)?.subAction === "follow-member"
  )

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanId = targetId.replace(/[^0-9]/g, "").trim()
    if (!cleanId) {
      setError("Por favor insira um ID de usuário válido.")
      return
    }

    if (!activeToken) {
      setError("Nenhuma conta Discord conectada.")
      return
    }

    setLoading(true)
    setError("")

    try {
      await api.runTool("call-utils", {
        tokenId: activeToken.id,
        action: "follow-member",
        anchorUserId: cleanId,
        guildId: guildId || undefined,
        selfMute,
        selfDeaf,
        flags: {
          persistentNick: stayOnDisconnect,
        },
      })
    } catch (err: any) {
      setError(err.message || "Erro ao iniciar perseguição de membro.")
    } finally {
      setLoading(false)
    }
  }

  const handleStop = async () => {
    if (!activeTask) return
    setLoading(true)
    try {
      await cancelTask(activeTask.id)
    } catch (err: any) {
      setError(err.message || "Erro ao parar perseguição.")
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
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-lg shadow-cyan-500/10">
              <Footprints className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Seguir Membro (Voice Follower)</h1>
                <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-cyan-400 uppercase">
                  Voice Stalker 24/7
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Persegue um membro por ID: entra e muda automaticamente para qualquer call de voz que o usuário entrar em tempo real.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {activeTask ? (
              <Button
                variant="destructive"
                onClick={handleStop}
                disabled={loading}
                className="gap-2 shadow-lg shadow-destructive/20 font-medium"
              >
                <Square className="h-4 w-4" /> Parar de Seguir
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Estado do Follower</p>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    activeTask ? "bg-emerald-400 animate-pulse" : "bg-muted-foreground/40"
                  }`}
                />
                <p className="text-lg font-bold font-mono text-foreground">
                  {activeTask ? "SEGUINDO MEMBRO" : "EM ESPERA"}
                </p>
              </div>
            </div>
            <Activity className="h-5 w-5 text-primary" />
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Transições Seguidas</p>
              <p className="text-2xl font-black font-mono text-cyan-400 mt-0.5">
                {activeTask?.progress || 0}
              </p>
            </div>
            <CheckCircle2 className="h-5 w-5 text-cyan-400" />
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Escopo de Servidores</p>
              <p className="text-lg font-bold font-mono text-foreground mt-0.5">
                {guildId ? "SERVIDOR ALVO" : "TODOS OS MÚTUOS"}
              </p>
            </div>
            <Compass className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      {/* Main Form & Live Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Column */}
        <Card className="lg:col-span-2 border-border/60 bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <User className="h-4 w-4 text-cyan-400" /> Configuração do Alvo
            </CardTitle>
            <CardDescription>
              Informe o ID do membro que o seu selfbot deve perseguir entre canais de voz.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleStart} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">ID do Membro Alvo</label>
                <Input
                  placeholder="Ex: 729104819284719284 (ou mencione o usuário)"
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  disabled={Boolean(activeTask)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Server className="h-3.5 w-3.5 text-primary" /> Filtrar por Servidor (Opcional)
                </label>
                <GuildPicker
                  value={guildId}
                  onChange={setGuildId}
                  disabled={Boolean(activeTask)}
                />
                <span className="text-[11px] text-muted-foreground">
                  Se não selecionar nenhum servidor, o selfbot seguirá o membro em qualquer servidor mútuo onde ele entrar em call!
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-border/40">
                <div className="flex items-center justify-between p-2 rounded-xl border border-border/50 bg-secondary/15">
                  <div>
                    <p className="text-xs font-semibold text-foreground">Auto-Mutar</p>
                    <p className="text-[10px] text-muted-foreground">Entra mutado</p>
                  </div>
                  <Switch
                    checked={selfMute}
                    onCheckedChange={setSelfMute}
                    disabled={Boolean(activeTask)}
                  />
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl border border-border/50 bg-secondary/15">
                  <div>
                    <p className="text-xs font-semibold text-foreground">Auto-Ensurdecer</p>
                    <p className="text-[10px] text-muted-foreground">Entra ensurdecido</p>
                  </div>
                  <Switch
                    checked={selfDeaf}
                    onCheckedChange={setSelfDeaf}
                    disabled={Boolean(activeTask)}
                  />
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl border border-border/50 bg-secondary/15">
                  <div>
                    <p className="text-xs font-semibold text-foreground">Ficar na Call</p>
                    <p className="text-[10px] text-muted-foreground">Se ele sair, não desconectar</p>
                  </div>
                  <Switch
                    checked={stayOnDisconnect}
                    onCheckedChange={setStayOnDisconnect}
                    disabled={Boolean(activeTask)}
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-400">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex justify-end pt-2">
                {activeTask ? (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleStop}
                    disabled={loading}
                    className="w-full sm:w-auto font-medium"
                  >
                    <Square className="h-4 w-4 mr-2" /> Parar de Seguir
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={loading || !targetId.trim()}
                    className="w-full sm:w-auto font-medium bg-cyan-600 hover:bg-cyan-700 text-white"
                  >
                    <Play className="h-4 w-4 mr-2" /> Iniciar Perseguição
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Live HUD Column */}
        <Card className="border-border/60 bg-card/60 backdrop-blur-sm flex flex-col">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Footprints className="h-4 w-4 text-cyan-400" /> Status da Perseguição
            </CardTitle>
            <CardDescription>Telemetria em tempo real no Gateway.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            {activeTask ? (
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4 space-y-3 font-mono text-xs">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold">
                    {(activeTask.config as any)?.targetTag?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-sm">
                      {(activeTask.config as any)?.targetTag || "Membro Alvo"}
                    </p>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      ID: {(activeTask.config as any)?.targetUserId}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/40 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-sans">Status Atual:</span>
                    <span className="text-emerald-400 font-bold">SEGUINDO ATIVO</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-sans">Mutações de Call:</span>
                    <span className="text-cyan-400 font-bold">{activeTask.progress || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-sans">Canal Atual:</span>
                    <span className="text-foreground truncate max-w-[150px]">
                      {(activeTask as any).currentChannel || "Em chamada"}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/40 text-[11px] text-muted-foreground font-sans">
                  Use também no chat do Discord com o comando <code className="text-cyan-400 font-mono font-semibold">;follow @user</code> e pare com <code className="text-cyan-400 font-mono font-semibold">;rfollow</code>.
                </div>
              </div>
            ) : (
              <div className="flex h-44 flex-col items-center justify-center text-muted-foreground text-center p-4">
                <Footprints className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-xs">
                  Nenhum membro sendo seguido no momento. Informe o ID do membro ao lado e clique em Iniciar.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
