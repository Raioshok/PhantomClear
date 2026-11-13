import { useState, useEffect } from "react"
import {
  Trophy,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  Shield,
  Smile,
  Plus,
  Trash2,
  RotateCw,
  Terminal,
  Activity,
  ShieldCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useTokens } from "@/hooks/use-tokens"
import { useWSEvent } from "@/hooks/use-websocket"
import { api } from "@/lib/api-client"

interface GiveawayLog {
  id: string
  guildId?: string
  guildName?: string
  channelId: string
  channelName?: string
  messageId: string
  botName: string
  prize?: string
  entryType: "button" | "reaction"
  status: "entered" | "skipped" | "failed" | "honeypot_avoided"
  details: string
  latencyMs: number
  timestamp: string
}

interface AutoReactorRule {
  id: string
  name: string
  targetUserId?: string
  targetGuildId?: string
  targetChannelId?: string
  keyword?: string
  emoji: string
  enabled: boolean
  createdAt: string
}

interface GiveawayConfig {
  enabled: boolean
  reactionJoinEnabled: boolean
  buttonJoinEnabled: boolean
  minDelayMs: number
  maxDelayMs: number
  antiHoneypot: boolean
  webhookUrl?: string
  whitelistGuilds: string[]
  blacklistGuilds: string[]
}

export default function PaginaGiveaways() {
  const { activeToken } = useTokens()
  const [config, setConfig] = useState<GiveawayConfig>({
    enabled: false,
    reactionJoinEnabled: true,
    buttonJoinEnabled: true,
    minDelayMs: 1500,
    maxDelayMs: 4000,
    antiHoneypot: true,
    whitelistGuilds: [],
    blacklistGuilds: [],
  })

  const [logs, setLogs] = useState<GiveawayLog[]>([])
  const [rules, setRules] = useState<AutoReactorRule[]>([])
  const [saving, setSaving] = useState(false)
  const [ruleModalOpen, setRuleModalOpen] = useState(false)

  // Rule Form State
  const [ruleName, setRuleName] = useState("")
  const [ruleUserId, setRuleUserId] = useState("")
  const [ruleKeyword, setRuleKeyword] = useState("")
  const [ruleEmoji, setRuleEmoji] = useState("🔥")

  useWSEvent<GiveawayLog>("giveaway:log", (newLog) => {
    setLogs((prev) => [newLog, ...prev.slice(0, 99)])
  })

  useWSEvent<GiveawayConfig>("giveaway:config-updated", (newCfg) => {
    setConfig(newCfg)
  })

  useWSEvent<AutoReactorRule[]>("giveaway:rules-updated", (newRules) => {
    setRules(newRules)
  })

  useEffect(() => {
    loadData()
  }, [activeToken])

  const loadData = async () => {
    try {
      const [cfgRes, logsRes, rulesRes] = await Promise.all([
        api.getGiveawayConfig(),
        api.getGiveawayLogs(),
        api.getGiveawayRules(),
      ])
      if (cfgRes.data) setConfig(cfgRes.data)
      if (logsRes.data) setLogs(logsRes.data)
      if (rulesRes.data) setRules(rulesRes.data)
    } catch {}
  }

  const updateConfig = async (patch: Partial<GiveawayConfig>) => {
    setSaving(true)
    try {
      const res = await api.updateGiveawayConfig(patch)
      if (res.data) setConfig(res.data)
    } catch {} finally {
      setSaving(false)
    }
  }

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ruleName || !ruleEmoji) return

    try {
      await api.createGiveawayRule({
        name: ruleName,
        targetUserId: ruleUserId || undefined,
        keyword: ruleKeyword || undefined,
        emoji: ruleEmoji,
        enabled: true,
      })
      setRuleModalOpen(false)
      setRuleName("")
      setRuleUserId("")
      setRuleKeyword("")
      setRuleEmoji("🔥")
      loadData()
    } catch (err: any) {
      alert(err.message || "Erro ao criar regra de auto-reação")
    }
  }

  const handleDeleteRule = async (id: string) => {
    try {
      await api.deleteGiveawayRule(id)
      setRules((prev) => prev.filter((r) => r.id !== id))
    } catch {}
  }

  const totalEntered = logs.filter((l) => l.status === "entered").length
  const totalHoneypots = logs.filter((l) => l.status === "honeypot_avoided").length

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-r from-card/80 via-card/50 to-primary/5 p-6 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-lg shadow-amber-500/10">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Auto-Giveaway & Reactor</h1>
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-amber-400 uppercase">
                  Sorteios & Reações
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Participação autônoma em sorteios (GiveawayBot, Carl, Dyno) via botões e reações com proteção anti-honeypot.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-secondary/30 px-3 py-1.5 rounded-xl border border-border/60">
              <span className="text-xs font-semibold text-muted-foreground">Auto-Join Sorteios</span>
              <Switch
                checked={config.enabled}
                onCheckedChange={(val) => updateConfig({ enabled: val })}
                disabled={saving}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Status do Joiner</p>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    config.enabled ? "bg-emerald-400 animate-pulse" : "bg-muted-foreground/40"
                  }`}
                />
                <p className="text-lg font-bold font-mono text-foreground">
                  {config.enabled ? "ESCUTANDO" : "DESATIVADO"}
                </p>
              </div>
            </div>
            <Activity className="h-5 w-5 text-primary" />
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Sorteios Concorridos</p>
              <p className="text-2xl font-black font-mono text-emerald-400 mt-0.5">{totalEntered}</p>
            </div>
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Honeypots Evitados</p>
              <p className="text-2xl font-black font-mono text-amber-400 mt-0.5">{totalHoneypots}</p>
            </div>
            <ShieldCheck className="h-5 w-5 text-amber-400" />
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Regras de Auto-Reação</p>
              <p className="text-2xl font-black font-mono text-purple-400 mt-0.5">{rules.length}</p>
            </div>
            <Smile className="h-5 w-5 text-purple-400" />
          </CardContent>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Column */}
        <Card className="border-border/60 bg-card/60 backdrop-blur-sm space-y-4">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" /> Configuração de Entrada
            </CardTitle>
            <CardDescription>Ajustes finos de atraso humano e métodos de participação.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-medium text-foreground">Entrar por Botões</p>
                <p className="text-xs text-muted-foreground">Clica em botões "Enter" e "Participar"</p>
              </div>
              <Switch
                checked={config.buttonJoinEnabled}
                onCheckedChange={(val) => updateConfig({ buttonJoinEnabled: val })}
              />
            </div>

            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-medium text-foreground">Entrar por Reação (🎉)</p>
                <p className="text-xs text-muted-foreground">Reage com emoji em sorteios clássicos</p>
              </div>
              <Switch
                checked={config.reactionJoinEnabled}
                onCheckedChange={(val) => updateConfig({ reactionJoinEnabled: val })}
              />
            </div>

            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-medium text-foreground">Escudo Anti-Honeypot</p>
                <p className="text-xs text-muted-foreground">Bloqueia armadilhas de moderação ("test", "ban", "fake")</p>
              </div>
              <Switch
                checked={config.antiHoneypot}
                onCheckedChange={(val) => updateConfig({ antiHoneypot: val })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Delay Mínimo (ms)</label>
                <Input
                  type="number"
                  min={500}
                  max={60000}
                  value={config.minDelayMs}
                  onChange={(e) => updateConfig({ minDelayMs: Number(e.target.value) })}
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Delay Máximo (ms)</label>
                <Input
                  type="number"
                  min={500}
                  max={60000}
                  value={config.maxDelayMs}
                  onChange={(e) => updateConfig({ maxDelayMs: Number(e.target.value) })}
                  className="font-mono text-xs"
                />
              </div>
            </div>

            <div className="space-y-1 pt-2">
              <label className="text-xs text-muted-foreground">Webhook de Alertas (Discord)</label>
              <Input
                placeholder="https://discord.com/api/webhooks/..."
                value={config.webhookUrl || ""}
                onChange={(e) => updateConfig({ webhookUrl: e.target.value })}
                className="text-xs font-mono"
              />
            </div>
          </CardContent>
        </Card>

        {/* Live Feed & Rules */}
        <div className="lg:col-span-2 space-y-6">
          {/* Auto Reactor Rules Card */}
          <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Smile className="h-4 w-4 text-purple-400" /> Regras de Auto-Reação
                </CardTitle>
                <CardDescription>Reage automaticamente a usuários específicos ou palavras-chave.</CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => setRuleModalOpen(true)}
                className="gap-1.5 text-xs bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Plus className="h-3.5 w-3.5" /> Adicionar Regra
              </Button>
            </CardHeader>
            <CardContent>
              {rules.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Nenhuma regra cadastrada. Adicione uma regra para reagir automaticamente a amigos ou frases!
                </p>
              ) : (
                <div className="space-y-2">
                  {rules.map((rule) => (
                    <div
                      key={rule.id}
                      className="flex items-center justify-between rounded-xl border border-border/50 bg-secondary/15 p-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{rule.emoji}</span>
                        <div>
                          <p className="font-semibold text-foreground">{rule.name}</p>
                          <p className="text-[11px] text-muted-foreground font-mono">
                            {rule.targetUserId && `User: ${rule.targetUserId} `}
                            {rule.keyword && `Palavra: "${rule.keyword}"`}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRule(rule.id)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Live Giveaway Feed */}
          <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-amber-400" /> Feed de Sorteios em Tempo Real
                </CardTitle>
                <CardDescription>Eventos de sorteio interceptados e status de participação.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={loadData} className="gap-1.5 text-xs">
                <RotateCw className="h-3 w-3" /> Atualizar
              </Button>
            </CardHeader>
            <CardContent>
              <div className="max-h-[320px] min-h-[160px] overflow-y-auto space-y-2 pr-1 font-mono text-xs">
                {logs.length === 0 ? (
                  <div className="flex h-36 flex-col items-center justify-center text-muted-foreground">
                    <Trophy className="h-8 w-8 text-muted-foreground/30 mb-2" />
                    Nenhum sorteio detectado ainda. Ative o joiner e aguarde anúncios em servidores!
                  </div>
                ) : (
                  logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-border/60 bg-secondary/15 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                            log.status === "entered"
                              ? "bg-emerald-500/20 text-emerald-400 font-bold"
                              : log.status === "honeypot_avoided"
                              ? "bg-amber-500/20 text-amber-400 font-bold"
                              : "bg-rose-500/20 text-rose-400 font-bold"
                          }`}
                        >
                          <Trophy className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{log.prize || "Sorteio"}</p>
                          <p className="text-[11px] text-muted-foreground font-sans">
                            {log.guildName || "Servidor"} (#{log.channelName || "canal"}) • {log.botName}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                            log.status === "entered"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : log.status === "honeypot_avoided"
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-rose-500/20 text-rose-400"
                          }`}
                        >
                          {log.status === "entered"
                            ? `ENTROU (${log.latencyMs}ms)`
                            : log.status === "honeypot_avoided"
                            ? "HONEYPOT EVITADO"
                            : "FALHOU"}
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
      </div>

      {/* Create Rule Modal */}
      {ruleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border/80 bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/40">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Smile className="h-5 w-5 text-purple-400" /> Nova Regra de Auto-Reação
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setRuleModalOpen(false)}>
                ✕
              </Button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Nome da Regra</label>
                <Input
                  placeholder="Ex: Reagir ao Nick, Reagir a GG, etc."
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Emoji para Reagir</label>
                <Input
                  placeholder="Ex: 🔥, 🎉, ❤️, 💀 ou :custom_emoji:"
                  value={ruleEmoji}
                  onChange={(e) => setRuleEmoji(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">ID do Usuário Alvo (Opcional)</label>
                <Input
                  placeholder="Deixe em branco para qualquer usuário"
                  value={ruleUserId}
                  onChange={(e) => setRuleUserId(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Palavra-Chave (Opcional)</label>
                <Input
                  placeholder="Ex: gg, parabéns, drop"
                  value={ruleKeyword}
                  onChange={(e) => setRuleKeyword(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <Button type="button" variant="outline" onClick={() => setRuleModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-medium">
                  Salvar Regra
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
