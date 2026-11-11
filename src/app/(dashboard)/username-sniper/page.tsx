import { useState, useEffect } from "react"
import {
  Crosshair,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  StopCircle,
  Copy,
  Sparkles,
  Search,
  Key,
  Shield,
  Clock,
  Trophy,
  Terminal,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useTokens } from "@/hooks/use-tokens"
import { useWSEvent } from "@/hooks/use-websocket"
import { api } from "@/lib/api-client"
import type { WSToolProgress, WSToolCompleted, WSToolError } from "@/types/websocket"

export type UsernamePreset = "3char" | "4char" | "3letter" | "4letter" | "rare-words" | "custom"

interface CheckItem {
  username: string
  available: boolean
  status: "available" | "taken" | "rate-limited" | "claimed" | "error"
  timestamp: string
}

export default function PaginaUsernameSniper() {
  const { activeToken, tokens } = useTokens()
  const [preset, setPreset] = useState<UsernamePreset>("3letter")
  const [customListText, setCustomListText] = useState("")
  const [delay, setDelay] = useState(1200)
  const [maxChecks, setMaxChecks] = useState(100)
  const [autoClaim, setAutoClaim] = useState(false)
  const [password, setPassword] = useState("")

  const [starting, setStarting] = useState(false)
  const [running, setRunning] = useState(false)
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [progressMsg, setProgressMsg] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [progress, setProgress] = useState(0)
  const [total, setTotal] = useState(0)

  const [availableList, setAvailableList] = useState<string[]>([])
  const [history, setHistory] = useState<CheckItem[]>([])
  const [copiedName, setCopiedName] = useState<string | null>(null)

  useWSEvent<WSToolProgress>("tool:progress", (ev) => {
    if (ev.taskId === activeTaskId) {
      setProgressMsg(ev.message)
      setProgress(ev.progress)
      setTotal(ev.total)
      setRunning(true)
      setStarting(false)
    }
  })

  useWSEvent<WSToolCompleted>("tool:completed", (ev) => {
    if (ev.taskId === activeTaskId) {
      setRunning(false)
      setStarting(false)
      setActiveTaskId(null)
      setProgressMsg("Varredura finalizada!")
      loadResults()
    }
  })

  useWSEvent<WSToolError>("tool:error", (ev) => {
    if (ev.taskId === activeTaskId) {
      setRunning(false)
      setStarting(false)
      setActiveTaskId(null)
      setErrorMessage(ev.error || "Erro durante a execução")
      setProgressMsg(`Erro: ${ev.error}`)
    }
  })

  useWSEvent<CheckItem>("username-sniper:check", (item) => {
    setHistory((prev) => [item, ...prev.slice(0, 49)])
  })

  useWSEvent<{ username: string }>("username-sniper:found", (ev) => {
    setAvailableList((prev) => [ev.username, ...prev.filter((u) => u !== ev.username)])
  })

  useEffect(() => {
    loadResults()
  }, [])

  const loadResults = async () => {
    try {
      const res = await api.getUsernameSniperResults()
      if (res.data) {
        if (res.data.available) setAvailableList(res.data.available)
        if (res.data.history) setHistory(res.data.history)
      }
    } catch {}
  }

  const handleStart = async () => {
    setErrorMessage("")

    const effectiveToken = activeToken || (tokens.length > 0 ? tokens[0] : null)
    if (!effectiveToken) {
      setErrorMessage("Nenhuma conta Discord cadastrada. Adicione uma conta no menu lateral para iniciar.")
      return
    }

    setStarting(true)
    setProgressMsg("Iniciando varredura e gerando candidatos...")

    const customItems = preset === "custom"
      ? customListText.split(/[\n, ]+/).map((s) => s.trim()).filter(Boolean)
      : undefined

    try {
      const res = await api.startUsernameSniper({
        preset,
        customList: customItems,
        delay,
        maxChecks,
        autoClaim,
        password: autoClaim ? password : undefined,
      })

      if (res.data?.taskId) {
        setActiveTaskId(res.data.taskId)
        setTotal(res.data.totalCandidates)
        setProgress(0)
        setRunning(true)
      } else {
        setErrorMessage("Não foi possível criar a tarefa de varredura.")
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Falha ao iniciar varredura.")
      setProgressMsg("")
    } finally {
      setStarting(false)
    }
  }

  const handleStop = async () => {
    if (!activeTaskId) return
    try {
      await api.cancelTask(activeTaskId)
    } catch {}
    setRunning(false)
    setStarting(false)
    setActiveTaskId(null)
    setProgressMsg("Varredura interrompida.")
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedName(text)
    setTimeout(() => setCopiedName(null), 1500)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Crosshair className="h-5 w-5 text-primary" />
          Username Sniper & Checker
        </h1>
        <p className="text-sm text-muted-foreground">
          Verifique a disponibilidade de usernames raros no Discord (3 chars, 4 chars, palavras curtas) com auto-claim opcional.
        </p>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-semibold text-rose-300">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Presets Grid */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Escolha o Preset de Geração
          </CardTitle>
          <CardDescription>Selecione um dos algoritmos de candidatos pré-configurados ou use sua própria lista.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <button
              type="button"
              onClick={() => setPreset("3letter")}
              className={`flex flex-col items-center justify-center rounded-2xl border p-3.5 text-center transition-all cursor-pointer ${
                preset === "3letter"
                  ? "border-primary bg-primary/10 shadow-md shadow-primary/15 ring-1 ring-primary"
                  : "border-border/70 bg-card/60 hover:border-primary/40 hover:bg-secondary/20"
              }`}
            >
              <span className="font-mono font-bold text-sm text-primary">aaa</span>
              <span className="text-xs font-semibold text-foreground mt-1">3 Letras</span>
              <span className="text-[10px] text-muted-foreground">a-z puras</span>
            </button>

            <button
              type="button"
              onClick={() => setPreset("4letter")}
              className={`flex flex-col items-center justify-center rounded-2xl border p-3.5 text-center transition-all cursor-pointer ${
                preset === "4letter"
                  ? "border-primary bg-primary/10 shadow-md shadow-primary/15 ring-1 ring-primary"
                  : "border-border/70 bg-card/60 hover:border-primary/40 hover:bg-secondary/20"
              }`}
            >
              <span className="font-mono font-bold text-sm text-primary">aaaa</span>
              <span className="text-xs font-semibold text-foreground mt-1">4 Letras</span>
              <span className="text-[10px] text-muted-foreground">a-z puras</span>
            </button>

            <button
              type="button"
              onClick={() => setPreset("3char")}
              className={`flex flex-col items-center justify-center rounded-2xl border p-3.5 text-center transition-all cursor-pointer ${
                preset === "3char"
                  ? "border-primary bg-primary/10 shadow-md shadow-primary/15 ring-1 ring-primary"
                  : "border-border/70 bg-card/60 hover:border-primary/40 hover:bg-secondary/20"
              }`}
            >
              <span className="font-mono font-bold text-sm text-primary">a1_</span>
              <span className="text-xs font-semibold text-foreground mt-1">3 Chars</span>
              <span className="text-[10px] text-muted-foreground">letras + num</span>
            </button>

            <button
              type="button"
              onClick={() => setPreset("4char")}
              className={`flex flex-col items-center justify-center rounded-2xl border p-3.5 text-center transition-all cursor-pointer ${
                preset === "4char"
                  ? "border-primary bg-primary/10 shadow-md shadow-primary/15 ring-1 ring-primary"
                  : "border-border/70 bg-card/60 hover:border-primary/40 hover:bg-secondary/20"
              }`}
            >
              <span className="font-mono font-bold text-sm text-primary">a123</span>
              <span className="text-xs font-semibold text-foreground mt-1">4 Chars</span>
              <span className="text-[10px] text-muted-foreground">letras + num</span>
            </button>

            <button
              type="button"
              onClick={() => setPreset("rare-words")}
              className={`flex flex-col items-center justify-center rounded-2xl border p-3.5 text-center transition-all cursor-pointer ${
                preset === "rare-words"
                  ? "border-primary bg-primary/10 shadow-md shadow-primary/15 ring-1 ring-primary"
                  : "border-border/70 bg-card/60 hover:border-primary/40 hover:bg-secondary/20"
              }`}
            >
              <span className="font-mono font-bold text-sm text-primary">void</span>
              <span className="text-xs font-semibold text-foreground mt-1">Palavras Raras</span>
              <span className="text-[10px] text-muted-foreground">curtas & limpas</span>
            </button>

            <button
              type="button"
              onClick={() => setPreset("custom")}
              className={`flex flex-col items-center justify-center rounded-2xl border p-3.5 text-center transition-all cursor-pointer ${
                preset === "custom"
                  ? "border-primary bg-primary/10 shadow-md shadow-primary/15 ring-1 ring-primary"
                  : "border-border/70 bg-card/60 hover:border-primary/40 hover:bg-secondary/20"
              }`}
            >
              <span className="font-mono font-bold text-sm text-primary">...</span>
              <span className="text-xs font-semibold text-foreground mt-1">Customizado</span>
              <span className="text-[10px] text-muted-foreground">sua própria lista</span>
            </button>
          </div>

          {preset === "custom" && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Lista de Usernames (um por linha ou separados por vírgula)</label>
              <textarea
                value={customListText}
                onChange={(e) => setCustomListText(e.target.value)}
                placeholder="shadow, phantom, ace, ghost..."
                rows={3}
                className="w-full rounded-xl border border-input bg-card p-3 text-xs font-mono text-foreground"
              />
            </div>
          )}

          {/* Config row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 pt-2">
            <div className="flex items-center justify-between rounded-xl border border-border/70 bg-secondary/15 p-3">
              <div>
                <p className="text-xs font-semibold text-foreground">Intervalo (Delay)</p>
                <p className="text-[10px] text-muted-foreground">Evita rate limits do Discord</p>
              </div>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min={500}
                  max={5000}
                  step={100}
                  value={delay}
                  onChange={(e) => setDelay(Number(e.target.value) || 1200)}
                  className="h-8 w-20 text-center font-mono text-xs"
                />
                <span className="text-xs text-muted-foreground">ms</span>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border/70 bg-secondary/15 p-3">
              <div>
                <p className="text-xs font-semibold text-foreground">Limite de Checks</p>
                <p className="text-[10px] text-muted-foreground">Quantidade máxima por sessão</p>
              </div>
              <Input
                type="number"
                min={1}
                max={1000}
                value={maxChecks}
                onChange={(e) => setMaxChecks(Number(e.target.value) || 100)}
                className="h-8 w-20 text-center font-mono text-xs"
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border/70 bg-secondary/15 p-3">
              <div>
                <p className="text-xs font-semibold text-foreground">Auto-Claim Instantâneo</p>
                <p className="text-[10px] text-muted-foreground">Reivindica ao encontrar</p>
              </div>
              <Switch checked={autoClaim} onCheckedChange={setAutoClaim} />
            </div>
          </div>

          {autoClaim && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-1.5">
              <label className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5" /> Senha da Conta (exigida pelo Discord para trocar de username)
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite a senha da conta..."
                className="h-8 text-xs max-w-sm"
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-muted-foreground">
              {progressMsg || (running ? "Varredura ativa..." : "Pronto para iniciar.")}
            </span>

            {running ? (
              <Button onClick={handleStop} variant="destructive" className="gap-2 font-semibold shadow-md">
                <StopCircle className="h-4 w-4" /> Parar ({progress}/{total})
              </Button>
            ) : (
              <Button
                onClick={handleStart}
                disabled={starting}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2 shadow-md cursor-pointer"
              >
                {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}
                {starting ? "Iniciando..." : "Iniciar Varredura"}
              </Button>
            )}
          </div>

          {running && total > 0 && (
            <div className="space-y-1 pt-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progresso</span>
                <span>{progress} de {total} ({Math.round((progress / total) * 100)}%)</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${(progress / total) * 100}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Available Trophy Box */}
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-emerald-400">
                <Trophy className="h-4 w-4" /> Usernames Disponíveis
              </CardTitle>
              <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
                {availableList.length}
              </span>
            </div>
            <CardDescription>Usernames livres encontrados prontos para registro.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[300px] min-h-[160px] overflow-y-auto space-y-2">
              {availableList.length === 0 ? (
                <div className="flex h-36 flex-col items-center justify-center text-xs text-muted-foreground">
                  Nenhum username disponível encontrado ainda. Inicie a varredura acima!
                </div>
              ) : (
                availableList.map((uname) => (
                  <div
                    key={uname}
                    className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs"
                  >
                    <span className="font-mono font-bold text-emerald-300 text-sm">@{uname}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(uname)}
                      className="h-7 text-xs text-emerald-400 hover:bg-emerald-500/20 gap-1"
                    >
                      {copiedName === uname ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedName === uname ? "Copiado!" : "Copiar"}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Live History */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Terminal className="h-4 w-4 text-primary" /> Live Audit Log
            </CardTitle>
            <CardDescription>Histórico de tentativas e respostas da API do Discord.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[300px] min-h-[160px] overflow-y-auto space-y-1.5 font-mono text-xs">
              {history.length === 0 ? (
                <div className="flex h-36 items-center justify-center text-xs text-muted-foreground">
                  Aguardando verificações...
                </div>
              ) : (
                history.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg border border-border/50 bg-secondary/15 px-3 py-1.5"
                  >
                    <span className="text-foreground">@{item.username}</span>
                    <span
                      className={`text-[10px] font-bold uppercase rounded-md px-1.5 py-0.5 ${
                        item.status === "available" || item.status === "claimed"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : item.status === "rate-limited"
                          ? "bg-amber-500/20 text-amber-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      {item.status}
                    </span>
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
