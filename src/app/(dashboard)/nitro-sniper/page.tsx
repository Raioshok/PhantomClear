import { useState, useEffect } from "react"
import {
  Gift,
  Radio,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  Shield,
  Activity,
  Terminal,
  RotateCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useTokens } from "@/hooks/use-tokens"
import { useWSEvent } from "@/hooks/use-websocket"
import { api } from "@/lib/api-client"

interface NitroClaimLog {
  code: string
  author: string
  guildId?: string
  channelId: string
  status: "claimed" | "already_redeemed" | "invalid" | "rate_limited" | "failed"
  details?: string
  timestamp: string
}

export default function PaginaNitroSniper() {
  const { activeToken } = useTokens()
  const [active, setActive] = useState(false)
  const [saving, setSaving] = useState(false)
  const [logs, setLogs] = useState<NitroClaimLog[]>([])
  const [webhookAlert, setWebhookAlert] = useState("")

  useWSEvent<NitroClaimLog>("nitro:claim-result", (item) => {
    setLogs((prev) => [item, ...prev.slice(0, 99)])
  })

  useEffect(() => {
    loadConfig()
    loadLogs()
  }, [activeToken])

  const loadConfig = async () => {
    try {
      const res = await api.getAutoResponderConfig()
      if (res.data) {
        setActive(Boolean(res.data.nitroSnifferEnabled))
      }
    } catch {}
  }

  const loadLogs = async () => {
    try {
      const res = await api.getAutoResponderLogs()
      if (res.data?.nitroLogs) {
        setLogs(res.data.nitroLogs)
      }
    } catch {}
  }

  const toggleSniper = async (val: boolean) => {
    setSaving(true)
    try {
      await api.updateAutoResponderConfig({
        nitroSnifferEnabled: val,
      })
      setActive(val)
    } catch {} finally {
      setSaving(false)
    }
  }

  const claimedCount = logs.filter((l) => l.status === "claimed").length
  const redeemedCount = logs.filter((l) => l.status === "already_redeemed").length
  const invalidCount = logs.filter((l) => l.status === "invalid" || l.status === "failed").length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Gift className="h-5 w-5 text-emerald-400" />
            Nitro Sniper (WebSocket Auto-Claimer)
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitora em tempo real todas as mensagens de servidores e DMs mútuas para resgatar presentes Nitro instantaneamente.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xs font-semibold text-foreground">
            {active ? "Sniper Ativo" : "Sniper Desativado"}
          </span>
          <Switch checked={active} onCheckedChange={toggleSniper} disabled={saving} />
        </div>
      </div>

      {/* Telemetry Status Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card className="border-border/70 bg-card/60">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Estado do Motor</p>
              <p className="text-base font-bold text-foreground mt-0.5 flex items-center gap-1.5">
                {active ? (
                  <>
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-emerald-400">SNIPING (WS)</span>
                  </>
                ) : (
                  <>
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                    <span className="text-muted-foreground">STANDBY</span>
                  </>
                )}
              </p>
            </div>
            <Radio className={`h-5 w-5 ${active ? "text-emerald-400 animate-pulse" : "text-muted-foreground/40"}`} />
          </CardContent>
        </Card>

        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Gifts Resgatados</p>
              <p className="text-2xl font-black text-emerald-400 font-mono mt-0.5">{claimedCount}</p>
            </div>
            <Sparkles className="h-5 w-5 text-emerald-400" />
          </CardContent>
        </Card>

        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Já Resgatados (Outros)</p>
              <p className="text-2xl font-black text-amber-400 font-mono mt-0.5">{redeemedCount}</p>
            </div>
            <Clock className="h-5 w-5 text-amber-400" />
          </CardContent>
        </Card>

        <Card className="border-rose-500/30 bg-rose-500/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Códigos Inválidos</p>
              <p className="text-2xl font-black text-rose-400 font-mono mt-0.5">{invalidCount}</p>
            </div>
            <AlertTriangle className="h-5 w-5 text-rose-400" />
          </CardContent>
        </Card>
      </div>

      {/* Live Snipe Feed */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Terminal className="h-4 w-4 text-primary" /> Feed de Snipes em Tempo Real
              </CardTitle>
              <CardDescription>Eventos capturados instantaneamente no gateway do Discord.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadLogs} className="gap-1.5 text-xs">
              <RotateCw className="h-3 w-3" /> Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-h-[380px] min-h-[180px] overflow-y-auto space-y-2 pr-1 font-mono text-xs">
            {logs.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center text-muted-foreground">
                <Gift className="h-8 w-8 text-muted-foreground/30 mb-2" />
                Nenhum código de presente detectado ainda. Mantenha o sniper ativo para monitorar!
              </div>
            ) : (
              logs.map((log, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-border/60 bg-secondary/15 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        log.status === "claimed"
                          ? "bg-emerald-500/20 text-emerald-400 font-bold"
                          : log.status === "already_redeemed"
                          ? "bg-amber-500/20 text-amber-400 font-bold"
                          : "bg-rose-500/20 text-rose-400 font-bold"
                      }`}
                    >
                      <Gift className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">discord.gift/{log.code}</p>
                      <p className="text-[11px] text-muted-foreground font-sans">
                        Enviado por: <span className="text-foreground font-medium">{log.author}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                        log.status === "claimed"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : log.status === "already_redeemed"
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-rose-500/20 text-rose-400"
                      }`}
                    >
                      {log.status === "claimed"
                        ? "🎉 RESGATADO!"
                        : log.status === "already_redeemed"
                        ? "JÁ RESGATADO"
                        : "INVÁLIDO"}
                    </span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
