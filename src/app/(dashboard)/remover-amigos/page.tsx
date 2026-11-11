import { useState, useEffect, useRef } from "react"
import {
  UserMinus,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Search,
  CheckSquare,
  Square,
  StopCircle,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTokens } from "@/hooks/use-tokens"
import { api } from "@/lib/api-client"
import { useWSEvent } from "@/hooks/use-websocket"
import type { WSToolProgress, WSToolCompleted, WSToolError } from "@/types/websocket"

interface FriendItem {
  id: string
  username: string
  discriminator: string
  globalName: string | null
  avatar: string | null
}

type Phase = "idle" | "running" | "completed" | "error"

export default function PaginaRemoverAmigos() {
  const { activeToken } = useTokens()
  const [configDelay, setConfigDelay] = useState(1000)
  const [starting, setStarting] = useState(false)
  const [loadingFriends, setLoadingFriends] = useState(true)

  const [friends, setFriends] = useState<FriendItem[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
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
    loadFriends()
  }, [activeToken])

  const loadFriends = async () => {
    if (!activeToken) return
    setLoadingFriends(true)
    try {
      const res = await api.getFriendsForRemoval()
      if (res.data) {
        setFriends(res.data)
        // Select all by default
        setSelectedIds(new Set(res.data.map((f) => f.id)))
      }
    } catch {} finally {
      setLoadingFriends(false)
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
    loadFriends()
  })

  useWSEvent<WSToolError>("tool:error", (data) => {
    if (!taskId || data.taskId !== taskId) return
    setPhase("error")
    setError(data.error || "Erro desconhecido")
  })

  const toggleFriend = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const selectAll = () => {
    setSelectedIds(new Set(friends.map((f) => f.id)))
  }

  const deselectAll = () => {
    setSelectedIds(new Set())
  }

  const filteredFriends = friends.filter((f) => {
    const q = search.toLowerCase()
    return f.username.toLowerCase().includes(q) || (f.globalName && f.globalName.toLowerCase().includes(q))
  })

  const handleStart = async () => {
    if (!activeToken) {
      setError("Nenhuma conta conectada.")
      setPhase("error")
      return
    }

    if (selectedIds.size === 0) {
      setError("Nenhum amigo selecionado.")
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
      const res = await api.post<any>("/tools/remover-amigos", {
        tokenId: activeToken.id,
        delay: configDelay,
        userIds: Array.from(selectedIds),
      })
      if (res.data?.taskId) {
        setTaskId(res.data.taskId)
      }
    } catch (err: any) {
      setPhase("error")
      setError(err.message || "Falha ao iniciar remoção de amigos.")
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
          <h1 className="text-xl font-bold tracking-tight text-foreground">Remover Amigos (Smart)</h1>
          <p className="text-sm text-muted-foreground">
            Selecione quais amigos deseja remover ou limpe a lista inteira de forma seletiva.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadFriends} disabled={loadingFriends} className="gap-2 text-xs">
          <RotateCcw className={`h-3.5 w-3.5 ${loadingFriends ? "animate-spin" : ""}`} /> Atualizar Amigos
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold">
                Amigos na Conta ({selectedIds.size} selecionados de {friends.length})
              </CardTitle>
              <CardDescription>Escolha exatamente quem deseja remover da sua lista de amizades.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={selectAll} className="text-xs gap-1">
                <CheckSquare className="h-3.5 w-3.5" /> Selecionar Todos
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
              placeholder="Pesquisar amigo por nome ou username..."
              className="pl-9 text-xs"
            />
          </div>

          <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1">
            {loadingFriends ? (
              <div className="flex h-40 items-center justify-center text-xs text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando amigos...
              </div>
            ) : filteredFriends.length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center text-xs text-muted-foreground">
                Nenhum amigo encontrado.
              </div>
            ) : (
              filteredFriends.map((f) => {
                const isSelected = selectedIds.has(f.id)
                return (
                  <div
                    key={f.id}
                    onClick={() => toggleFriend(f.id)}
                    className={`flex items-center justify-between rounded-xl border p-2.5 text-xs transition-all cursor-pointer ${
                      isSelected
                        ? "border-rose-500/40 bg-rose-500/10 shadow-xs"
                        : "border-border/60 bg-secondary/15 hover:border-border"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded border-border text-rose-500 focus:ring-rose-500"
                      />
                      <Avatar className="h-8 w-8">
                        {f.avatar ? (
                          <AvatarImage src={`https://cdn.discordapp.com/avatars/${f.id}/${f.avatar}.png?size=64`} />
                        ) : null}
                        <AvatarFallback className="text-[10px] font-bold">
                          {f.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="truncate">
                        <p className="font-semibold text-foreground truncate">{f.globalName || f.username}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">@{f.username} • ID: {f.id}</p>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2 border-t border-border/70">
            <span className="text-xs text-muted-foreground">
              {selectedIds.size} amigo(s) selecionado(s)
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
                {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}
                Remover Amigos Selecionados
              </Button>
            )}
          </div>

          {phase === "running" && (
            <div className="space-y-1 pt-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{statusMessage || "Removendo..."}</span>
                <span>{progress} de {total}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full bg-rose-500 transition-all duration-300"
                  style={{ width: `${total > 0 ? (progress / total) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          {phase === "completed" && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Remoção de amigos concluída!</span>
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
