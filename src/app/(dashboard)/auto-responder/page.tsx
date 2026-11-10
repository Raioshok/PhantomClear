import { useState, useEffect } from "react"
import {
  MessageSquare,
  Gift,
  Zap,
  Save,
  CheckCircle2,
  Clock,
  Radio,
  User,
  Shield,
  AlertCircle,
  FileText,
  RotateCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useTokens } from "@/hooks/use-tokens"
import { useWSEvent } from "@/hooks/use-websocket"
import { api } from "@/lib/api-client"

interface AutoResponderLog {
  id: string
  userId: string
  username: string
  content: string
  reply: string
  channelId: string
  timestamp: string
}

interface NitroClaimLog {
  code: string
  author: string
  guildId?: string
  channelId: string
  status: "claimed" | "already_redeemed" | "invalid" | "rate_limited" | "failed"
  details?: string
  timestamp: string
}

export default function PaginaAutoResponder() {
  const { activeToken } = useTokens()
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false)
  const [replyMessage, setReplyMessage] = useState(
    "Estou ausente no momento. Mensagem automática via PhantomClear."
  )
  const [onlyDMs, setOnlyDMs] = useState(true)
  const [cooldownMinutes, setCooldownMinutes] = useState(5)
  const [nitroSnifferEnabled, setNitroSnifferEnabled] = useState(false)

  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [logs, setLogs] = useState<AutoResponderLog[]>([])
  const [nitroLogs, setNitroLogs] = useState<NitroClaimLog[]>([])

  useWSEvent<AutoResponderLog>("auto-responder:replied", (data) => {
    setLogs((prev) => [data, ...prev.slice(0, 49)])
  })

  useWSEvent<NitroClaimLog>("nitro:claim-result", (data) => {
    setNitroLogs((prev) => [data, ...prev.slice(0, 49)])
  })

  useEffect(() => {
    loadConfig()
    loadLogs()
  }, [activeToken])

  const loadConfig = async () => {
    try {
      const res = await api.getAutoResponderConfig()
      if (res.data) {
        setAutoReplyEnabled(res.data.autoReplyEnabled)
        setReplyMessage(res.data.replyMessage || "")
        setOnlyDMs(res.data.onlyDMs !== false)
        setCooldownMinutes(res.data.cooldownMinutes || 5)
        setNitroSnifferEnabled(res.data.nitroSnifferEnabled || false)
      }
    } catch {}
  }

  const loadLogs = async () => {
    try {
      const res = await api.getAutoResponderLogs()
      if (res.data) {
        if (res.data.autoReplyLogs) setLogs(res.data.autoReplyLogs)
        if (res.data.nitroLogs) setNitroLogs(res.data.nitroLogs)
      }
    } catch {}
  }

  const handleSave = async (override?: { autoReply?: boolean; nitro?: boolean }) => {
    setSaving(true)
    const replyVal = override?.autoReply !== undefined ? override.autoReply : autoReplyEnabled
    const nitroVal = override?.nitro !== undefined ? override.nitro : nitroSnifferEnabled

    try {
      await api.updateAutoResponderConfig({
        autoReplyEnabled: replyVal,
        replyMessage,
        onlyDMs,
        cooldownMinutes,
        nitroSnifferEnabled: nitroVal,
      })
      setAutoReplyEnabled(replyVal)
      setNitroSnifferEnabled(nitroVal)
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 2000)
    } catch {} finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Auto-Responder & Nitro Sniffer</h1>
          <p className="text-sm text-muted-foreground">
            Responda automaticamente a mensagens recebidas e resgate presentes Nitro instantaneamente via WebSocket.
          </p>
        </div>
        <Button
          onClick={() => handleSave()}
          disabled={saving}
          className="gap-2 bg-primary font-semibold text-primary-foreground shadow-md hover:bg-primary/90"
        >
          {saving ? <RotateCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {savedSuccess ? "Salvo!" : "Salvar Configuração"}
        </Button>
      </div>

      {/* Nitro Sniffer Card */}
      <Card className="border-border/80">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition-all ${
                  nitroSnifferEnabled
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-lg shadow-emerald-500/15"
                    : "border-border/80 bg-secondary/20 text-muted-foreground"
                }`}
              >
                <Gift className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-base flex items-center gap-2">
                  Auto-Claimer de Nitro Gifts
                  {nitroSnifferEnabled && (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                      <Radio className="h-3 w-3 animate-pulse" /> MONITORANDO
                    </span>
                  )}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Escuta todos os canais mútuos e DMs. Se um link <code className="font-mono text-primary">discord.gift/code</code> for detectado, tenta o resgate imediato via API REST.
                </p>
              </div>
            </div>

            <Switch
              checked={nitroSnifferEnabled}
              onCheckedChange={(val) => {
                setNitroSnifferEnabled(val)
                handleSave({ nitro: val })
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Auto Responder Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              Auto-Responder (Mensagem de Ausência)
            </CardTitle>
            <CardDescription>Responde automaticamente a novos contatos enquanto você estiver AFK.</CardDescription>
          </div>
          <Switch
            checked={autoReplyEnabled}
            onCheckedChange={(val) => {
              setAutoReplyEnabled(val)
              handleSave({ autoReply: val })
            }}
          />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">Mensagem de Resposta</label>
            <textarea
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="Digite o texto que será enviado automaticamente..."
              rows={3}
              className="w-full rounded-xl border border-input bg-card p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-1">
            <div className="flex items-center justify-between rounded-xl border border-border/70 bg-secondary/15 p-3">
              <div>
                <p className="text-xs font-semibold text-foreground">Apenas Direct Messages (DMs)</p>
                <p className="text-[11px] text-muted-foreground">Quando desativado, também responde a menções em servidores.</p>
              </div>
              <Switch checked={onlyDMs} onCheckedChange={setOnlyDMs} />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border/70 bg-secondary/15 p-3">
              <div>
                <p className="text-xs font-semibold text-foreground">Cooldown por Usuário</p>
                <p className="text-[11px] text-muted-foreground">Tempo mínimo entre respostas automáticas ao mesmo usuário.</p>
              </div>
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  min={1}
                  max={1440}
                  value={cooldownMinutes}
                  onChange={(e) => setCooldownMinutes(Number(e.target.value) || 1)}
                  className="h-8 w-16 text-center font-mono text-xs"
                />
                <span className="text-xs text-muted-foreground">min</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs View */}
      <Tabs defaultValue="nitro" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-sm">
          <TabsTrigger value="nitro" className="gap-2 text-xs">
            <Gift className="h-3.5 w-3.5" /> Nitro Sniffer ({nitroLogs.length})
          </TabsTrigger>
          <TabsTrigger value="replies" className="gap-2 text-xs">
            <MessageSquare className="h-3.5 w-3.5" /> Respostas Enviadas ({logs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="nitro" className="mt-4">
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm font-semibold">Histórico de Gifts Detectados</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="max-h-[280px] overflow-y-auto space-y-2">
                {nitroLogs.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    Nenhum gift detectado ainda nesta sessão.
                  </div>
                ) : (
                  nitroLogs.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl border border-border/60 bg-secondary/10 p-2.5 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Gift className="h-4 w-4 text-primary" />
                        <div>
                          <p className="font-mono font-bold text-foreground">{item.code}</p>
                          <p className="text-[10px] text-muted-foreground">Enviado por: {item.author}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`rounded-md px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
                            item.status === "claimed"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : item.status === "already_redeemed"
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-rose-500/20 text-rose-400"
                          }`}
                        >
                          {item.status}
                        </span>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{item.details}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="replies" className="mt-4">
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm font-semibold">Respostas Automáticas Enviadas</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="max-h-[280px] overflow-y-auto space-y-2">
                {logs.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    Nenhuma resposta automática disparada ainda.
                  </div>
                ) : (
                  logs.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col gap-1 rounded-xl border border-border/60 bg-secondary/10 p-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">{item.username}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-muted-foreground italic truncate">"{item.content}"</p>
                      <p className="text-primary text-[11px] font-medium">↳ Resposta: {item.reply}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
