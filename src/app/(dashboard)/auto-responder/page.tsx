import { useState, useEffect } from "react"
import {
  MessageSquare,
  Bot,
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

export default function PaginaAutoResponder() {
  const { activeToken } = useTokens()
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false)
  const [replyMessage, setReplyMessage] = useState(
    "Estou ausente no momento. Mensagem automática via PhantomClear."
  )
  const [onlyDMs, setOnlyDMs] = useState(true)
  const [cooldownMinutes, setCooldownMinutes] = useState(5)

  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [autoLogs, setAutoLogs] = useState<AutoResponderLog[]>([])

  useWSEvent<AutoResponderLog>("auto-responder:reply", (log) => {
    setAutoLogs((prev) => [log, ...prev.slice(0, 99)])
  })

  useEffect(() => {
    loadConfig()
    loadLogs()
  }, [activeToken])

  const loadConfig = async () => {
    try {
      const res = await api.getAutoResponderConfig()
      if (res.data) {
        setAutoReplyEnabled(Boolean(res.data.enabled))
        if (res.data.replyMessage) setReplyMessage(res.data.replyMessage)
        if (res.data.onlyDMs !== undefined) setOnlyDMs(Boolean(res.data.onlyDMs))
        if (res.data.cooldownMinutes) setCooldownMinutes(res.data.cooldownMinutes)
      }
    } catch {}
  }

  const loadLogs = async () => {
    try {
      const res = await api.getAutoResponderLogs()
      if (res.data?.replyLogs) setAutoLogs(res.data.replyLogs)
    } catch {}
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.updateAutoResponderConfig({
        enabled: autoReplyEnabled,
        replyMessage,
        onlyDMs,
        cooldownMinutes,
      })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    } catch {} finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          Auto-Responder (Modo AFK)
        </h1>
        <p className="text-sm text-muted-foreground">
          Responda automaticamente a mensagens recebidas em DMs ou menções enquanto você estiver ausente.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Settings Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" /> Resposta Automática (AFK)
                </CardTitle>
                <CardDescription>Responde a quem mandar mensagem em DM com cooldown configurável.</CardDescription>
              </div>
              <Switch checked={autoReplyEnabled} onCheckedChange={setAutoReplyEnabled} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Mensagem de Resposta</label>
              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                rows={3}
                placeholder="Digite a mensagem automática que será enviada..."
                className="w-full rounded-xl border border-input bg-card p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="flex items-center justify-between rounded-xl border border-border/70 bg-secondary/15 p-3">
                <div>
                  <p className="text-xs font-semibold text-foreground">Apenas em DMs</p>
                  <p className="text-[10px] text-muted-foreground">Não responde em menções de servidores</p>
                </div>
                <Switch checked={onlyDMs} onCheckedChange={setOnlyDMs} />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border/70 bg-secondary/15 p-3">
                <div>
                  <p className="text-xs font-semibold text-foreground">Cooldown por Usuário</p>
                  <p className="text-[10px] text-muted-foreground">Evita spam no mesmo chat</p>
                </div>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={1}
                    max={120}
                    value={cooldownMinutes}
                    onChange={(e) => setCooldownMinutes(Number(e.target.value) || 5)}
                    className="h-8 w-16 text-center font-mono text-xs"
                  />
                  <span className="text-xs text-muted-foreground">min</span>
                </div>
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full gap-2 text-xs font-semibold mt-2">
              <Save className="h-4 w-4" />
              {saving ? "Salvando..." : saveSuccess ? "Salvo com sucesso!" : "Salvar Configuração"}
            </Button>
          </CardContent>
        </Card>

        {/* Live Logs Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" /> Histórico de Respostas Disparadas
                </CardTitle>
                <CardDescription>Registro em tempo real de quem enviou mensagem e a resposta enviada.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={loadLogs} className="gap-1.5 text-xs">
                <RotateCw className="h-3 w-3" /> Atualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-[300px] min-h-[160px] overflow-y-auto space-y-2 pr-1 font-mono text-xs">
              {autoLogs.length === 0 ? (
                <div className="flex h-36 items-center justify-center text-muted-foreground text-xs">
                  Nenhuma resposta automática disparada ainda.
                </div>
              ) : (
                autoLogs.map((log) => (
                  <div key={log.id} className="rounded-xl border border-border/60 bg-secondary/15 p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">@{log.username}</span>
                      <span className="text-[10px] text-muted-foreground">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-muted-foreground text-[11px] font-sans">
                      Recebido: <span className="text-foreground">{log.content}</span>
                    </p>
                    <p className="text-primary text-[11px] font-sans">
                      Respondido: <span>{log.reply}</span>
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
