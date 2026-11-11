import { useState, useEffect, useRef } from "react"
import {
  LogOut,
  Loader2,
  Play,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Shield,
  Crown,
  Search,
  CheckSquare,
  Square,
  Users,
  StopCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTokens } from "@/hooks/use-tokens"
import { api } from "@/lib/api-client"
import { useWSEvent } from "@/hooks/use-websocket"
import type { WSToolProgress, WSToolCompleted, WSToolError } from "@/types/websocket"

interface GuildItem {
  id: string
  name: string
  icon: string | null
  memberCount: number
  isOwner: boolean
}

type Phase = "idle" | "running" | "completed" | "error"

export default function PaginaSairServidores() {
  const { activeToken } = useTokens()
  const [configDelay, setConfigDelay] = useState(1000)
  const [starting, setStarting] = useState(false)
  const [loadingGuilds, setLoadingGuilds] = useState(true)

  const [guilds, setGuilds] = useState<GuildItem[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [protectOwned, setProtectOwned] = useState(true)
  const [search, setSearch] = useState("")

  const [taskId, setTaskId] = useState<string | null>(null)
  const [phase, setPhase] = useState<Phase>("idle")
  const [progress, setProgress] = useState(0)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState("")
  const [statusMessage, setStatusMessage] = useState("")
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    loadGuilds()
  }, [activeToken])

  const loadGuilds = async () => {
    if (!activeToken) return
    setLoadingGuilds(true)
    try {
      const res = await api.getServersForLeaving()
      if (res.data) {
        setGuilds(res.data)
        // Select all non-owned guilds by default
        const nonOwned = res.data.filter((g) => !g.isOwner).map((g) => g.id)
        setSelectedIds(new Set(nonOwned))
      }
    } catch {} finally {
      setLoadingGuilds(false)
    }
  }

  useEffect(() => {
    if (phase !== "running") return
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [phase])

  useWSEvent<WSToolProgress>("tool:progress", (data) => {
    if (!taskId || data.taskId !== taskId) return
    setProgress(data.progress)
    setTotal(data.total)
    if (data.message) setStatusMessage(data.message)
    setPhase("running")
  })

  useWSEvent<WSToolCompleted>("tool:completed", (data) => {
    if (!taskId || data.taskId !== taskId) return
    setPhase("completed")
    loadGuilds()
  })

  useWSEvent<WSToolError>("tool:error", (data) => {
    if (!taskId || data.taskId !== taskId) return
    setPhase("error")
    setError(data.error || "Erro desconhecido")
  })

  const toggleGuild = (id: string, isOwner: boolean) => {
    if (isOwner && protectOwned) return
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const selectAllEligible = () => {
    const next = new Set<string>()
    for (const g of guilds) {
      if (!g.isOwner || !protectOwned) {
        next.add(g.id)
      }
    }
    setSelectedIds(next)
  }

  const deselectAll = () => {
    setSelectedIds(new Set())
  }

  const filteredGuilds = guilds.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  )

  const ownedCount = guilds.filter((g) => g.isOwner).length

  const handleStart = async () => {
    if (!activeToken) {
      setError("Nenhuma conta selecionada.")
      setPhase("error")
      return
    }

    if (selectedIds.size === 0) {
      setError("Nenhum servidor selecionado.")
      setPhase("error")
      return
    }

    setStarting(true)
    setError("")
    setPhase("running")
    setProgress(0)
    setTotal(selectedIds.size)
    startTimeRef.current = Date.now()
    setElapsedSeconds(0)

    try {
      const res = await api.post<any>("/tools/remover-servidores", {
        tokenId: activeToken.id,
        delay: configDelay,
        guildIds: Array.from(selectedIds),
        ignoreOwned: protectOwned,
      })
      if (res.data?.taskId) {
        setTaskId(res.data.taskId)
      }
    } catch (err: any) {
      setPhase("error")
      setError(err.message || "Falha ao iniciar saída de servidores.")
    } finally {
      setStarting(false)
    }
  }

  const handleCancel = async () => {
    if (!taskId) return
    try {
      await api.cancelTask(taskId)
    } catch {}
    setPhase("idle")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Sair de Servidores (Smart)</h1>
          <p className="text-sm text-muted-foreground">
            Selecione quais servidores deseja sair e proteja seus servidores próprios contra perda acidental.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadGuilds} disabled={loadingGuilds} className="gap-2 text-xs">
          <RotateCcw className={`h-3.5 w-3.5 ${loadingGuilds ? "animate-spin" : ""}`} /> Atualizar Servidores
        </Button>
      </div>

      {/* Safety & Owned Protection Banner */}
      <div className="flex flex-col gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
            <Crown className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              Proteção de Servidores Próprios
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                {ownedCount} detectado(s)
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              Bloqueia a saída de servidores onde você é o criador/dono da guilda, evitando perda de posse.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-foreground">Proteger Dono</span>
          <Switch checked={protectOwned} onCheckedChange={setProtectOwned} />
        </div>
      </div>

      {/* Filter and Selection Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold">
                Servidores Encontrados ({selectedIds.size} selecionados de {guilds.length})
              </CardTitle>
              <CardDescription>Marque os servidores dos quais deseja se retirar.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={selectAllEligible} className="text-xs gap-1">
                <CheckSquare className="h-3.5 w-3.5" /> Selecionar Elegíveis
              </Button>
              <Button size="sm" variant="ghost" onClick={deselectAll} className="text-xs gap-1 text-muted-foreground">
                <Square className="h-3.5 w-3.5" /> Desmarcar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar servidor por nome..."
              className="pl-9 text-xs"
            />
          </div>

          <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1">
            {loadingGuilds ? (
              <div className="flex h-40 items-center justify-center text-xs text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando lista de servidores...
              </div>
            ) : filteredGuilds.length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center text-xs text-muted-foreground">
                Nenhum servidor encontrado.
              </div>
            ) : (
              filteredGuilds.map((g) => {
                const isSelected = selectedIds.has(g.id)
                const isLocked = g.isOwner && protectOwned

                return (
                  <div
                    key={g.id}
                    onClick={() => toggleGuild(g.id, g.isOwner)}
                    className={`flex items-center justify-between rounded-xl border p-2.5 text-xs transition-all cursor-pointer ${
                      isLocked
                        ? "border-amber-500/30 bg-amber-500/5 opacity-80 cursor-not-allowed"
                        : isSelected
                        ? "border-primary/50 bg-primary/10 shadow-xs"
                        : "border-border/60 bg-secondary/15 hover:border-border"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={isLocked}
                        onChange={() => {}}
                        className="rounded border-border text-primary focus:ring-primary"
                      />
                      <Avatar className="h-9 w-9 rounded-xl">
                        {g.icon ? (
                          <AvatarImage src={`https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=64`} />
                        ) : null}
                        <AvatarFallback className="rounded-xl text-[10px] font-bold">
                          {g.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground truncate">{g.name}</p>
                          {g.isOwner && (
                            <span className="flex items-center gap-1 rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-400">
                              <Crown className="h-2.5 w-2.5" /> DONO
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Users className="h-2.5 w-2.5" /> {g.memberCount} membros • ID: {g.id}
                        </p>
                      </div>
                    </div>

                    {isLocked && (
                      <span className="text-[10px] text-amber-400 font-semibold px-2">Protegido</span>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2 border-t border-border/70">
            <span className="text-xs text-muted-foreground">
              {selectedIds.size} servidor(es) selecionado(s)
            </span>

            {phase === "running" ? (
              <Button onClick={handleCancel} variant="destructive" className="gap-2 font-semibold">
                <StopCircle className="h-4 w-4" /> Cancelar ({progress}/{total})
              </Button>
            ) : (
              <Button
                onClick={handleStart}
                disabled={starting || selectedIds.size === 0}
                className="bg-rose-600 hover:bg-rose-500 text-white font-semibold gap-2 shadow-md"
              >
                {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                Sair dos Servidores Selecionados
              </Button>
            )}
          </div>

          {phase === "running" && (
            <div className="space-y-1 pt-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{statusMessage || "Processando..."}</span>
                <span>{progress} de {total}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${total > 0 ? (progress / total) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          {phase === "completed" && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Saída de servidores concluída com sucesso!</span>
            </div>
          )}

          {phase === "error" && error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
