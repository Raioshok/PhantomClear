import { useState, useEffect, useRef } from "react"
import {
  Trash2,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Archive,
  HardDrive,
  PhoneOff,
  Search,
  CheckSquare,
  Square,
  StopCircle,
  MessageSquare,
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

interface DMChannelItem {
  id: string
  recipientId?: string
  username: string
  globalName?: string | null
  avatar?: string | null
  lastMessageId?: string
}

type Phase = "idle" | "running" | "completed" | "error"

export default function PaginaLimparDmsAbertas() {
  const { activeToken } = useTokens()
  const [configDelay, setConfigDelay] = useState(700)
  const [fazerBackup, setFazerBackup] = useState(false)
  const [salvarMidiaLocal, setSalvarMidiaLocal] = useState(false)
  const [fecharApos, setFecharApos] = useState(false)
  const [starting, setStarting] = useState(false)
  const [loadingChannels, setLoadingChannels] = useState(true)

  const [channels, setChannels] = useState<DMChannelItem[]>([])
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
    loadChannels()
  }, [activeToken])

  const loadChannels = async () => {
    if (!activeToken) return
    setLoadingChannels(true)
    try {
      const res = await api.getOpenDmsForCleaning()
      if (res.data) {
        setChannels(res.data)
        // Select all by default
        setSelectedIds(new Set(res.data.map((c) => c.id)))
      }
    } catch {} finally {
      setLoadingChannels(false)
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
    loadChannels()
  })

  useWSEvent<WSToolError>("tool:error", (data) => {
    if (!taskId || data.taskId !== taskId) return
    setPhase("error")
    setError(data.error || "Erro desconhecido")
  })

  const toggleChannel = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const selectAll = () => {
    setSelectedIds(new Set(channels.map((c) => c.id)))
  }

  const deselectAll = () => {
    setSelectedIds(new Set())
  }

  const filteredChannels = channels.filter((c) => {
    const q = search.toLowerCase()
    return c.username.toLowerCase().includes(q) || (c.globalName && c.globalName.toLowerCase().includes(q))
  })

  const handleStart = async () => {
    if (!activeToken) {
      setError("Nenhuma conta conectada.")
      setPhase("error")
      return
    }

    if (selectedIds.size === 0) {
      setError("Nenhuma DM selecionada.")
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
      const res = await api.post<any>("/tools/limpar-dms-abertas", {
        tokenId: activeToken.id,
        delay: configDelay,
        fazerBackup,
        salvarMidiaLocal,
        fecharApos,
        channelIds: Array.from(selectedIds),
      })
      if (res.data?.taskId) {
        setTaskId(res.data.taskId)
      }
    } catch (err: any) {
      setPhase("error")
      setError(err.message || "Falha ao iniciar limpeza de DMs.")
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
          <h1 className="text-xl font-bold tracking-tight text-foreground">Limpar DMs Abertas (Smart)</h1>
          <p className="text-sm text-muted-foreground">
            Selecione conversas específicas ou limpe todas as suas DMs ativas com suporte a backup opcional.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadChannels} disabled={loadingChannels} className="gap-2 text-xs">
          <RotateCcw className={`h-3.5 w-3.5 ${loadingChannels ? "animate-spin" : ""}`} /> Atualizar DMs
        </Button>
      </div>

      {/* Options Row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-secondary/15 p-3.5">
          <div className="flex items-center gap-2.5">
            <Archive className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs font-semibold text-foreground">Fazer Backup</p>
              <p className="text-[10px] text-muted-foreground">Salva histórico em JSON</p>
            </div>
          </div>
          <Switch checked={fazerBackup} onCheckedChange={setFazerBackup} />
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-secondary/15 p-3.5">
          <div className="flex items-center gap-2.5">
            <HardDrive className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs font-semibold text-foreground">Baixar Mídias</p>
              <p className="text-[10px] text-muted-foreground">Download de fotos e vídeos</p>
            </div>
          </div>
          <Switch checked={salvarMidiaLocal} onCheckedChange={setSalvarMidiaLocal} disabled={!fazerBackup} />
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-secondary/15 p-3.5">
          <div className="flex items-center gap-2.5">
            <PhoneOff className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs font-semibold text-foreground">Fechar DM Após</p>
              <p className="text-[10px] text-muted-foreground">Oculta conversa limpa</p>
            </div>
          </div>
          <Switch checked={fecharApos} onCheckedChange={setFecharApos} />
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold">
                Conversas Abertas ({selectedIds.size} selecionadas de {channels.length})
              </CardTitle>
              <CardDescription>Escolha em quais conversas deseja executar a limpeza de mensagens.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={selectAll} className="text-xs gap-1">
                <CheckSquare className="h-3.5 w-3.5" /> Selecionar Todas
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
              placeholder="Pesquisar conversa por nome ou username..."
              className="pl-9 text-xs"
            />
          </div>

          <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1">
            {loadingChannels ? (
              <div className="flex h-40 items-center justify-center text-xs text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando conversas...
              </div>
            ) : filteredChannels.length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center text-xs text-muted-foreground">
                Nenhuma conversa aberta encontrada.
              </div>
            ) : (
              filteredChannels.map((c) => {
                const isSelected = selectedIds.has(c.id)
                return (
                  <div
                    key={c.id}
                    onClick={() => toggleChannel(c.id)}
                    className={`flex items-center justify-between rounded-xl border p-2.5 text-xs transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary/50 bg-primary/10 shadow-xs"
                        : "border-border/60 bg-secondary/15 hover:border-border"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded border-border text-primary focus:ring-primary"
                      />
                      <Avatar className="h-8 w-8">
                        {c.avatar ? (
                          <AvatarImage src={`https://cdn.discordapp.com/avatars/${c.recipientId}/${c.avatar}.png?size=64`} />
                        ) : null}
                        <AvatarFallback className="text-[10px] font-bold">
                          {c.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="truncate">
                        <p className="font-semibold text-foreground truncate">{c.globalName || c.username}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">@{c.username} • Canal: {c.id}</p>
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
              {selectedIds.size} conversa(s) selecionada(s)
            </span>

            {phase === "running" ? (
              <Button onClick={handleCancel} variant="destructive" className="gap-2 font-semibold">
                <StopCircle className="h-4 w-4" /> Cancelar ({progress}/{total})
              </Button>
            ) : (
              <Button
                onClick={handleStart}
                disabled={starting || selectedIds.size === 0}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2 shadow-md"
              >
                {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Limpar Conversas Selecionadas
              </Button>
            )}
          </div>

          {phase === "running" && (
            <div className="space-y-1 pt-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{statusMessage || "Limpando mensagens..."}</span>
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
              <span>Limpeza de DMs concluída com sucesso!</span>
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
