import { useState, useEffect } from "react"
import {
  Shield,
  Award,
  Sparkles,
  Loader2,
  CheckCircle2,
  Check,
  RotateCw,
  ExternalLink,
  Flame,
  Gamepad2,
  Code2,
  Gift,
  Tv,
  Coins,
  Link2,
  Layers,
  StopCircle,
  Play,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useTokens } from "@/hooks/use-tokens"
import { useActiveTask } from "@/hooks/use-tasks"
import { useWSEvent } from "@/hooks/use-websocket"
import { api } from "@/lib/api-client"
import type { WSToolProgress, WSToolCompleted, WSToolError } from "@/types/websocket"

const POPULAR_GAMES = [
  { id: '432980957394370572', name: 'Fortnite' },
  { id: '700136079562375258', name: 'VALORANT' },
  { id: '762434991303950386', name: 'Genshin Impact' },
  { id: '1070505030467797072', name: 'Honkai: Star Rail' },
  { id: '536991182035746816', name: 'Grand Theft Auto V' },
  { id: '438122941372047371', name: 'Minecraft' },
  { id: '479007612711698432', name: 'Roblox' },
]

export default function PaginaBadgeCollector() {
  const { activeToken, tokens, switchAccount } = useTokens()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [hypesquadLoading, setHypesquadLoading] = useState<number | null>(null)
  const [leavingHypesquad, setLeavingHypesquad] = useState(false)

  // Hours farm state
  const [selectedHours, setSelectedHours] = useState<number>(1000)
  const [selectedGameId, setSelectedGameId] = useState<string>(POPULAR_GAMES[0].id)
  const [farmingHours, setFarmingHours] = useState(false)

  // Variety farm state
  const [farmingVariety, setFarmingVariety] = useState(false)

  // Progress tracking
  const [progressMsg, setProgressMsg] = useState("")
  const [percent, setPercent] = useState(0)

  const { isRunning: isTaskRunning, activeTask, cancel } = useActiveTask('badge-collector')

  useEffect(() => {
    if (!activeToken && tokens.length > 0) {
      switchAccount(tokens[0].id).catch(() => {})
    }
  }, [activeToken, tokens, switchAccount])

  useEffect(() => {
    loadProfile()
  }, [activeToken])

  useEffect(() => {
    if (isTaskRunning && activeTask) {
      if (activeTask.total > 0) {
        setPercent(Math.round((activeTask.progress / activeTask.total) * 100))
      }
      setProgressMsg(activeTask.phase || "Farm de insígnias em andamento...")
    } else if (!isTaskRunning) {
      setFarmingHours(false)
      setFarmingVariety(false)
    }
  }, [isTaskRunning, activeTask])

  const loadProfile = async () => {
    setLoading(true)
    try {
      const res = await api.getBadgeProfile()
      if (res.data) {
        setProfile(res.data)
      }
    } catch {}
    finally {
      setLoading(false)
    }
  }

  useWSEvent<WSToolProgress>("tool:progress", (ev) => {
    if (activeTask && ev.taskId === activeTask.id) {
      setProgressMsg(ev.message)
      if (ev.total > 0) {
        setPercent(Math.round((ev.progress / ev.total) * 100))
      }
    }
  })

  useWSEvent("badge-collector:updated", () => {
    loadProfile()
  })

  useWSEvent<WSToolCompleted>("tool:completed", (ev) => {
    if (activeTask && ev.taskId === activeTask.id) {
      setFarmingHours(false)
      setFarmingVariety(false)
      setProgressMsg("Concluído! As sessões foram registradas no Discord.")
      setTimeout(() => {
        setPercent(0)
        setProgressMsg("")
      }, 4000)
      loadProfile()
    }
  })

  const handleSetHypeSquad = async (houseId: 1 | 2 | 3) => {
    setHypesquadLoading(houseId)
    try {
      await api.setHypeSquad(houseId)
      await loadProfile()
    } catch {}
    finally {
      setHypesquadLoading(null)
    }
  }

  const handleLeaveHypeSquad = async () => {
    setLeavingHypesquad(true)
    try {
      await api.leaveHypeSquad()
      await loadProfile()
    } catch {}
    finally {
      setLeavingHypesquad(false)
    }
  }

  const handleStartHoursFarm = async () => {
    setFarmingHours(true)
    setProgressMsg(`Iniciando envio de ${selectedHours}h para /science...`)
    setPercent(2)
    try {
      await api.farmPlaytime(selectedHours, selectedGameId)
    } catch (e: any) {
      setFarmingHours(false)
      setProgressMsg(`Erro: ${e.message}`)
    }
  }

  const handleStartVarietyFarm = async () => {
    setFarmingVariety(true)
    setProgressMsg("Iniciando envio de 100 jogos únicos para /science...")
    setPercent(2)
    try {
      await api.farmVariety()
    } catch (e: any) {
      setFarmingVariety(false)
      setProgressMsg(`Erro: ${e.message}`)
    }
  }

  const handleStopFarm = async () => {
    cancel()
    setFarmingHours(false)
    setFarmingVariety(false)
    setPercent(0)
    setProgressMsg("Farm parado.")
  }

  const user = profile?.user
  const badges: any[] = profile?.badges || []
  const connections: any[] = profile?.connections || []

  const activeHypeBadge = badges.find((b) => b.category === 'hypesquad' && b.owned)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Badge Collector & Profile Enhancer
          </h1>
          <p className="text-sm text-muted-foreground">
            Desbloqueie e colete insígnias oficiais do Discord (HypeSquad, Game Time, Variety, Active Developer e Quests).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border/60 bg-card/60 text-xs">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="h-4 w-4 rounded-full" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
              <span className="font-semibold text-foreground">@{user.username}</span>
            </div>
          ) : null}

          <Button variant="outline" size="sm" onClick={loadProfile} disabled={loading} className="gap-1.5 text-xs">
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCw className="h-3 w-3" />}
            Atualizar
          </Button>
        </div>
      </div>

      {/* Progress banner if any farm is active */}
      {(isTaskRunning || farmingHours || farmingVariety) && (
        <Card className="border-primary/30 bg-primary/10 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-primary flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              {progressMsg || "Enviando telemetria ao endpoint /science do Discord..."}
            </span>
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-primary">{percent}%</span>
              <Button size="sm" variant="destructive" onClick={handleStopFarm} className="h-6 text-[10px] px-2">
                <StopCircle size={12} className="mr-1" /> Parar
              </Button>
            </div>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-black/40">
            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${percent}%` }} />
          </div>
        </Card>
      )}

      {/* Section 1: HypeSquad Houses (Instant 1-Click) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Shield className="h-4 w-4 text-purple-400" /> Casas HypeSquad (Desbloqueio Imediato)
            </h2>
            <p className="text-xs text-muted-foreground">
              Troque ou colete sua insígnia da HypeSquad instantaneamente com 1 clique (sem questionários).
            </p>
          </div>

          {activeHypeBadge && (
            <Button
              size="sm"
              variant="outline"
              disabled={leavingHypesquad}
              onClick={handleLeaveHypeSquad}
              className="text-xs h-7 text-rose-400 hover:text-rose-300 border-rose-500/20 hover:bg-rose-500/10"
            >
              {leavingHypesquad ? <Loader2 className="h-3 w-3 animate-spin" /> : "Remover HypeSquad"}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Bravery */}
          <Card
            className={`border transition-all ${
              activeHypeBadge?.id === 'hypesquad_bravery'
                ? 'border-purple-500 ring-2 ring-purple-500/30 bg-purple-500/10'
                : 'border-purple-500/30 bg-purple-500/5 hover:border-purple-500/60'
            }`}
          >
            <CardHeader className="p-4 pb-3 flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-3">
                <img
                  src="https://cdn.discordapp.com/badge-icons/8a88d63823d8a71cd5e390baa45efa02.png"
                  alt="Bravery"
                  className="h-10 w-10 object-contain drop-shadow"
                />
                <div>
                  <CardTitle className="text-sm font-bold text-purple-300">House of Bravery</CardTitle>
                  <CardDescription className="text-xs">Casa da Coragem e Audácia</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 pt-0 space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Insígnia roxa lendária para membros corajosos que lideram a linha de frente.
              </p>

              <Button
                size="sm"
                disabled={hypesquadLoading !== null}
                onClick={() => handleSetHypeSquad(1)}
                className={`w-full text-xs font-semibold h-8 ${
                  activeHypeBadge?.id === 'hypesquad_bravery'
                    ? 'bg-purple-600 text-white cursor-default'
                    : 'bg-purple-600/80 hover:bg-purple-600 text-white cursor-pointer'
                }`}
              >
                {hypesquadLoading === 1 ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : activeHypeBadge?.id === 'hypesquad_bravery' ? (
                  <span className="flex items-center gap-1.5"><Check size={14} /> Ativo no Perfil</span>
                ) : (
                  "Ativar Bravery"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Brilliance */}
          <Card
            className={`border transition-all ${
              activeHypeBadge?.id === 'hypesquad_brilliance'
                ? 'border-orange-500 ring-2 ring-orange-500/30 bg-orange-500/10'
                : 'border-orange-500/30 bg-orange-500/5 hover:border-orange-500/60'
            }`}
          >
            <CardHeader className="p-4 pb-3 flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-3">
                <img
                  src="https://cdn.discordapp.com/badge-icons/011940fd013da3f7fb926e4a1cd2e618.png"
                  alt="Brilliance"
                  className="h-10 w-10 object-contain drop-shadow"
                />
                <div>
                  <CardTitle className="text-sm font-bold text-orange-300">House of Brilliance</CardTitle>
                  <CardDescription className="text-xs">Casa do Brilho e Disciplina</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 pt-0 space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Insígnia laranja/coral reservada para mentes estratégicas e determinadas.
              </p>

              <Button
                size="sm"
                disabled={hypesquadLoading !== null}
                onClick={() => handleSetHypeSquad(2)}
                className={`w-full text-xs font-semibold h-8 ${
                  activeHypeBadge?.id === 'hypesquad_brilliance'
                    ? 'bg-orange-600 text-white cursor-default'
                    : 'bg-orange-600/80 hover:bg-orange-600 text-white cursor-pointer'
                }`}
              >
                {hypesquadLoading === 2 ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : activeHypeBadge?.id === 'hypesquad_brilliance' ? (
                  <span className="flex items-center gap-1.5"><Check size={14} /> Ativo no Perfil</span>
                ) : (
                  "Ativar Brilliance"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Balance */}
          <Card
            className={`border transition-all ${
              activeHypeBadge?.id === 'hypesquad_balance'
                ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-500/10'
                : 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/60'
            }`}
          >
            <CardHeader className="p-4 pb-3 flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-3">
                <img
                  src="https://cdn.discordapp.com/badge-icons/3aa41de486fa12454c3761e8e223442e.png"
                  alt="Balance"
                  className="h-10 w-10 object-contain drop-shadow"
                />
                <div>
                  <CardTitle className="text-sm font-bold text-emerald-300">House of Balance</CardTitle>
                  <CardDescription className="text-xs">Casa do Equilíbrio e Harmonia</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 pt-0 space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Insígnia verde/turquesa dos guardiões da estabilidade e sabedoria coletiva.
              </p>

              <Button
                size="sm"
                disabled={hypesquadLoading !== null}
                onClick={() => handleSetHypeSquad(3)}
                className={`w-full text-xs font-semibold h-8 ${
                  activeHypeBadge?.id === 'hypesquad_balance'
                    ? 'bg-emerald-600 text-white cursor-default'
                    : 'bg-emerald-600/80 hover:bg-emerald-600 text-white cursor-pointer'
                }`}
              >
                {hypesquadLoading === 3 ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : activeHypeBadge?.id === 'hypesquad_balance' ? (
                  <span className="flex items-center gap-1.5"><Check size={14} /> Ativo no Perfil</span>
                ) : (
                  "Ativar Balance"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Section 2: Activity & Game Badges (BadgeFarmer Engine) */}
      <div className="space-y-4 pt-2">
        <div>
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Flame className="h-4 w-4 text-amber-400" /> Insígnias de Atividade & Jogos (BadgeFarmer Pipeline)
          </h2>
          <p className="text-xs text-muted-foreground">
            Farma milhares de horas e variedade de jogos no backend <code>/science</code> do Discord. O pipeline noturno credita as insígnias em 24h a 48h.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Game Hours Farm Card */}
          <Card className="border-border/80 bg-card/60 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                  <Gamepad2 size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Horas Jogadas (Tier Eternal)</h3>
                  <p className="text-xs text-muted-foreground">Adicione até 5.000 horas em qualquer jogo</p>
                </div>
              </div>

              <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                Playtime Farm
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Escolha a Meta de Horas:</label>
              <div className="grid grid-cols-4 gap-2">
                {[100, 500, 1000, 5000].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setSelectedHours(h)}
                    className={`rounded-xl border py-1.5 text-xs font-mono font-bold transition-all ${
                      selectedHours === h
                        ? 'border-amber-400 bg-amber-400/15 text-amber-300'
                        : 'border-border/60 bg-secondary/30 text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    {h.toLocaleString()}h
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Selecione o Jogo Alvo:</label>
              <select
                value={selectedGameId}
                onChange={(e) => setSelectedGameId(e.target.value)}
                className="w-full rounded-xl border border-border bg-secondary/50 px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
              >
                {POPULAR_GAMES.map((g) => (
                  <option key={g.id} value={g.id} className="bg-background text-foreground">
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <Button
              onClick={handleStartHoursFarm}
              disabled={isTaskRunning || farmingHours}
              className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs h-8 gap-2 cursor-pointer"
            >
              <Zap size={14} /> Iniciar Farm de {selectedHours.toLocaleString()}h
            </Button>
          </Card>

          {/* Variety Farm Card */}
          <Card className="border-border/80 bg-card/60 p-4 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Variedade de 100 Jogos (Universalist)</h3>
                    <p className="text-xs text-muted-foreground">Credita 100 títulos oficiais no seu histórico</p>
                  </div>
                </div>

                <span className="text-[10px] uppercase font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                  Variety Farm
                </span>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Emite sessões curtas de 2 minutos distribuídas em 100 jogos verificados do catálogo oficial do Discord. Ativa a insígnia de diversidade no perfil de jogador.
              </p>
            </div>

            <Button
              onClick={handleStartVarietyFarm}
              disabled={isTaskRunning || farmingVariety}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs h-8 gap-2 cursor-pointer mt-2"
            >
              <Layers size={14} /> Farmar 100 Jogos Únicos
            </Button>
          </Card>
        </div>
      </div>

      {/* Section 3: Active Developer & Quests */}
      <div className="space-y-4 pt-2">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Code2 className="h-4 w-4 text-emerald-400" /> Desenvolvedor Ativo & Insígnia de Quest
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Active Dev Card */}
          <Card className="border-emerald-500/30 bg-emerald-500/5 p-4 flex flex-col justify-between space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <img
                  src="https://cdn.discordapp.com/badge-icons/6bd8e66ba6b0026a59e67304099382c7.png"
                  alt="Active Dev"
                  className="h-10 w-10 object-contain drop-shadow"
                />
                <div>
                  <h3 className="text-sm font-bold text-emerald-300">Active Developer Badge</h3>
                  <p className="text-xs text-muted-foreground">Insígnia oficial de desenvolvedor</p>
                </div>
              </div>

              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Portal Discord
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              O programa foi oficialmente encerrado pelo Discord no final de 2025. Contas antigas que já possuíam o badge o mantêm em seu perfil.
            </p>

            <a
              href="https://support-dev.discord.com/hc/en-us/articles/10113997751447-Active-Developer-Badge"
              target="_blank"
              rel="noreferrer"
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold h-8 transition-colors"
            >
              <span>Ver Status Oficial na Suporte Dev</span>
              <ExternalLink size={12} />
            </a>
          </Card>

          {/* Quest Champion */}
          <Card className="border-border/80 bg-card/60 p-4 flex flex-col justify-between space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <img
                  src="https://cdn.discordapp.com/badge-icons/7d9ae358c8c5e118768335dbe68b4fb8.png"
                  alt="Quest Badge"
                  className="h-10 w-10 object-contain drop-shadow"
                />
                <div>
                  <h3 className="text-sm font-bold text-foreground">Quest Champion Badge</h3>
                  <p className="text-xs text-muted-foreground">Concedida ao resgatar recompensas de quests</p>
                </div>
              </div>

              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                Quest Farmer
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Basta concluir qualquer missão na aba Quest Farmer para liberar instantaneamente os pontos e decorações no seu perfil.
            </p>

            <a
              href="/quest-farmer"
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground text-xs font-semibold h-8 transition-colors"
            >
              <span>Abrir Quest & Orbs Farmer</span>
              <ExternalLink size={12} />
            </a>
          </Card>
        </div>
      </div>

      {/* Section 4: Public Connections Badges */}
      {connections.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Link2 className="h-4 w-4 text-primary" /> Conexões Públicas de Perfil ({connections.length})
              </h2>
              <p className="text-xs text-muted-foreground">
                Ative ou oculte as insígnias de contas vinculadas (Steam, GitHub, Spotify, etc.) no seu perfil público.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {connections.map((c, i) => (
              <div key={i} className="flex items-center justify-between gap-2.5 rounded-xl border border-border/80 bg-card/60 p-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center text-xs uppercase font-bold text-muted-foreground">
                    {c.type.slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{c.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">{c.type}</p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    if (c.id) {
                      await api.updateConnectionVisibility(c.type, c.id, !c.showOnProfile)
                      await loadProfile()
                    }
                  }}
                  className={`h-6 text-[10px] px-2 rounded-lg ${
                    c.showOnProfile
                      ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
                      : 'border-border text-muted-foreground'
                  }`}
                >
                  {c.showOnProfile ? 'Visível' : 'Oculto'}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
