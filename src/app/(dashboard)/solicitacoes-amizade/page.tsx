import { useState, useEffect } from "react"
import {
  UserCheck,
  UserX,
  Shield,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Clock,
  RefreshCw,
  Send,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTokens } from "@/hooks/use-tokens"
import { useWSEvent } from "@/hooks/use-websocket"
import { api } from "@/lib/api-client"
import type { WSToolProgress, WSToolCompleted } from "@/types/websocket"

export default function PaginaSolicitacoesAmizade() {
  const { activeToken } = useTokens()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{
    incoming: any[]
    outgoing: any[]
    friends: any[]
    blocked: any[]
  }>({ incoming: [], outgoing: [], friends: [], blocked: [] })

  const [accepting, setAccepting] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [hypesquadLoading, setHypesquadLoading] = useState(false)
  const [selectedHouse, setSelectedHouse] = useState<number | null>(null)
  const [progressMsg, setProgressMsg] = useState("")
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)

  useWSEvent<WSToolProgress>("tool:progress", (ev) => {
    if (ev.taskId === activeTaskId) {
      setProgressMsg(ev.message)
    }
  })

  useWSEvent<WSToolCompleted>("tool:completed", (ev) => {
    if (ev.taskId === activeTaskId) {
      setAccepting(false)
      setCancelling(false)
      setActiveTaskId(null)
      loadData()
    }
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await api.getRelationships()
      if (res.data) setData(res.data)
    } catch {} finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeToken) loadData()
  }, [activeToken])

  const handleAcceptAll = async () => {
    if (data.incoming.length === 0) return
    setAccepting(true)
    try {
      const res = await api.acceptAllFriendRequests(1000)
      if (res.data?.taskId) {
        setActiveTaskId(res.data.taskId)
      }
    } catch {
      setAccepting(false)
    }
  }

  const handleCancelAll = async () => {
    if (data.outgoing.length === 0) return
    setCancelling(true)
    try {
      const res = await api.cancelAllOutgoingRequests(800)
      if (res.data?.taskId) {
        setActiveTaskId(res.data.taskId)
      }
    } catch {
      setCancelling(false)
    }
  }

  const handleSetHypesquad = async (houseId: number) => {
    setHypesquadLoading(true)
    try {
      await api.setHypeSquad(houseId)
      setSelectedHouse(houseId)
    } catch {} finally {
      setHypesquadLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Solicitações & HypeSquad</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie requisições pendentes em massa e alterne sua insígnia HypeSquad instantaneamente.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar Lista
        </Button>
      </div>

      {progressMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-medium text-primary">
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          <span>{progressMsg}</span>
        </div>
      )}

      {/* HypeSquad Switcher */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Sparkles className="h-4 w-4 text-amber-400" />
            HypeSquad House Switcher
          </CardTitle>
          <CardDescription>
            Escolha sua casa da HypeSquad para receber a badge no perfil do Discord sem refazer o questionário.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <button
              onClick={() => handleSetHypesquad(1)}
              disabled={hypesquadLoading}
              className={`flex flex-col items-center justify-center rounded-2xl border p-4 text-center transition-all ${
                selectedHouse === 1
                  ? "border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/15"
                  : "border-border/70 bg-card/60 hover:border-purple-500/40 hover:bg-purple-500/5"
              }`}
            >
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 font-bold">
                1
              </div>
              <span className="font-semibold text-foreground text-sm">Bravery</span>
              <span className="text-xs text-muted-foreground mt-0.5">Casa da Coragem</span>
            </button>

            <button
              onClick={() => handleSetHypesquad(2)}
              disabled={hypesquadLoading}
              className={`flex flex-col items-center justify-center rounded-2xl border p-4 text-center transition-all ${
                selectedHouse === 2
                  ? "border-rose-500 bg-rose-500/10 shadow-lg shadow-rose-500/15"
                  : "border-border/70 bg-card/60 hover:border-rose-500/40 hover:bg-rose-500/5"
              }`}
            >
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 font-bold">
                2
              </div>
              <span className="font-semibold text-foreground text-sm">Brilliance</span>
              <span className="text-xs text-muted-foreground mt-0.5">Casa do Brilho</span>
            </button>

            <button
              onClick={() => handleSetHypesquad(3)}
              disabled={hypesquadLoading}
              className={`flex flex-col items-center justify-center rounded-2xl border p-4 text-center transition-all ${
                selectedHouse === 3
                  ? "border-cyan-500 bg-cyan-500/10 shadow-lg shadow-cyan-500/15"
                  : "border-border/70 bg-card/60 hover:border-cyan-500/40 hover:bg-cyan-500/5"
              }`}
            >
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 font-bold">
                3
              </div>
              <span className="font-semibold text-foreground text-sm">Balance</span>
              <span className="text-xs text-muted-foreground mt-0.5">Casa do Equilíbrio</span>
            </button>

            <button
              onClick={() => handleSetHypesquad(0)}
              disabled={hypesquadLoading}
              className={`flex flex-col items-center justify-center rounded-2xl border p-4 text-center transition-all ${
                selectedHouse === 0
                  ? "border-muted bg-secondary/30"
                  : "border-border/70 bg-card/60 hover:bg-secondary/20"
              }`}
            >
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground font-bold">
                ✕
              </div>
              <span className="font-semibold text-foreground text-sm">Remover Badge</span>
              <span className="text-xs text-muted-foreground mt-0.5">Sair da HypeSquad</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Requests Management Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Incoming */}
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-emerald-400" />
                <CardTitle className="text-base font-semibold">Solicitações Recebidas</CardTitle>
              </div>
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
                {data.incoming.length}
              </span>
            </div>
            <CardDescription>
              Pessoas que enviaram solicitação para você.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-between space-y-4">
            <div className="max-h-[320px] min-h-[160px] overflow-y-auto space-y-2 pr-1">
              {loading ? (
                <div className="flex h-36 items-center justify-center text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando...
                </div>
              ) : data.incoming.length === 0 ? (
                <div className="flex h-36 flex-col items-center justify-center text-xs text-muted-foreground">
                  <CheckCircle2 className="h-6 w-6 text-muted-foreground/40 mb-1" />
                  Nenhuma solicitação recebida pendente
                </div>
              ) : (
                data.incoming.map((user) => (
                  <div key={user.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-secondary/15 px-3 py-2 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar className="h-8 w-8">
                        {user.avatar ? (
                          <AvatarImage src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`} />
                        ) : null}
                        <AvatarFallback className="text-[10px]">{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="truncate">
                        <p className="font-semibold text-foreground truncate">{user.globalName || user.username}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">@{user.username}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <Button
              onClick={handleAcceptAll}
              disabled={accepting || data.incoming.length === 0}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold gap-2"
            >
              {accepting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
              Aceitar Todas ({data.incoming.length})
            </Button>
          </CardContent>
        </Card>

        {/* Outgoing */}
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4 text-blue-400" />
                <CardTitle className="text-base font-semibold">Solicitações Enviadas</CardTitle>
              </div>
              <span className="rounded-full bg-blue-500/15 px-2.5 py-0.5 text-xs font-bold text-blue-400">
                {data.outgoing.length}
              </span>
            </div>
            <CardDescription>
              Solicitações que você enviou e ainda não foram respondidas.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-between space-y-4">
            <div className="max-h-[320px] min-h-[160px] overflow-y-auto space-y-2 pr-1">
              {loading ? (
                <div className="flex h-36 items-center justify-center text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando...
                </div>
              ) : data.outgoing.length === 0 ? (
                <div className="flex h-36 flex-col items-center justify-center text-xs text-muted-foreground">
                  <CheckCircle2 className="h-6 w-6 text-muted-foreground/40 mb-1" />
                  Nenhuma solicitação pendente enviada
                </div>
              ) : (
                data.outgoing.map((user) => (
                  <div key={user.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-secondary/15 px-3 py-2 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar className="h-8 w-8">
                        {user.avatar ? (
                          <AvatarImage src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`} />
                        ) : null}
                        <AvatarFallback className="text-[10px]">{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="truncate">
                        <p className="font-semibold text-foreground truncate">{user.globalName || user.username}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">@{user.username}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <Button
              onClick={handleCancelAll}
              disabled={cancelling || data.outgoing.length === 0}
              variant="outline"
              className="w-full border-rose-500/30 text-rose-400 hover:bg-rose-500/10 font-semibold gap-2"
            >
              {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserX className="h-4 w-4" />}
              Cancelar Todas ({data.outgoing.length})
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
