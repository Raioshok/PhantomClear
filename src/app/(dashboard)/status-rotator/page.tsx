import { useState, useEffect } from "react"
import {
  RotateCw,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  Clock,
  Sparkles,
  Smile,
  Shield,
  Activity,
  User,
  Power,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useTokens } from "@/hooks/use-tokens"
import { useWSEvent } from "@/hooks/use-websocket"
import { api } from "@/lib/api-client"

interface CustomStatusItem {
  text: string
  emoji?: string
  status?: "online" | "idle" | "dnd" | "invisible"
}

export default function PaginaStatusRotator() {
  const { activeToken } = useTokens()
  const [enabled, setEnabled] = useState(false)
  const [intervalSeconds, setIntervalSeconds] = useState(30)
  const [statuses, setStatuses] = useState<CustomStatusItem[]>([
    { text: "PhantomClear V2", emoji: "⚡", status: "dnd" },
    { text: "github.com/Raioshok", emoji: "🛡️", status: "online" },
    { text: "Stealth & Privacy", emoji: "👻", status: "idle" },
  ])
  const [rotateBio, setRotateBio] = useState(false)
  const [bios, setBios] = useState<string[]>([
    "PhantomClear V2 User | github.com/Raioshok/PhantomClear",
    "Auditing & Privacy Suite",
  ])

  const [saving, setSaving] = useState(false)
  const [currentRotatedStatus, setCurrentRotatedStatus] = useState<CustomStatusItem | null>(null)
  const [savedSuccess, setSavedSuccess] = useState(false)

  useWSEvent<{ currentStatus: CustomStatusItem; nextInSeconds: number }>(
    "status-rotator:tick",
    (data) => {
      setCurrentRotatedStatus(data.currentStatus)
    }
  )

  useEffect(() => {
    loadConfig()
  }, [activeToken])

  const loadConfig = async () => {
    try {
      const res = await api.getStatusRotator()
      if (res.data) {
        setEnabled(res.data.enabled)
        setIntervalSeconds(res.data.intervalSeconds || 30)
        if (res.data.statuses?.length) setStatuses(res.data.statuses)
        setRotateBio(res.data.rotateBio || false)
        if (res.data.bios?.length) setBios(res.data.bios)
      }
    } catch {}
  }

  const handleSave = async (forceEnabled?: boolean) => {
    setSaving(true)
    const isNowEnabled = forceEnabled !== undefined ? forceEnabled : enabled
    try {
      await api.updateStatusRotator({
        enabled: isNowEnabled,
        intervalSeconds,
        statuses,
        rotateBio,
        bios,
      })
      setEnabled(isNowEnabled)
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 2500)
    } catch {} finally {
      setSaving(false)
    }
  }

  const addStatus = () => {
    setStatuses([...statuses, { text: "Novo Status", emoji: "⚡", status: "online" }])
  }

  const removeStatus = (idx: number) => {
    setStatuses(statuses.filter((_, i) => i !== idx))
  }

  const updateStatus = (idx: number, field: keyof CustomStatusItem, val: string) => {
    setStatuses(
      statuses.map((s, i) => (i === idx ? { ...s, [field]: val } : s))
    )
  }

  const addBio = () => {
    setBios([...bios, "Nova biografia"])
  }

  const removeBio = (idx: number) => {
    setBios(bios.filter((_, i) => i !== idx))
  }

  const updateBio = (idx: number, val: string) => {
    setBios(bios.map((b, i) => (i === idx ? val : b)))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Status & Bio Rotator</h1>
          <p className="text-sm text-muted-foreground">
            Alterne automaticamente seu status customizado e biografia em intervalos pré-definidos.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => handleSave()}
            disabled={saving}
            className="gap-2 bg-primary font-semibold text-primary-foreground shadow-md hover:bg-primary/90"
          >
            {saving ? <RotateCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {savedSuccess ? "Salvo!" : "Salvar Configuração"}
          </Button>
        </div>
      </div>

      {/* Control Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition-all ${
                  enabled
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-lg shadow-emerald-500/15"
                    : "border-border/80 bg-secondary/20 text-muted-foreground"
                }`}
              >
                <RotateCw className={`h-6 w-6 ${enabled ? "animate-spin" : ""}`} />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-base">
                  {enabled ? "Rotacionador Ativo" : "Rotacionador Desativado"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {enabled
                    ? `Alternando a cada ${intervalSeconds} segundos.`
                    : "Ative para iniciar a rotação de presenças e status na conta."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-foreground">Intervalo (s):</span>
                <Input
                  type="number"
                  min={10}
                  max={3600}
                  value={intervalSeconds}
                  onChange={(e) => setIntervalSeconds(Number(e.target.value) || 10)}
                  className="h-8 w-20 text-center font-mono text-xs"
                />
              </div>

              <Switch
                checked={enabled}
                onCheckedChange={(val) => {
                  setEnabled(val)
                  handleSave(val)
                }}
              />
            </div>
          </div>

          {currentRotatedStatus && enabled && (
            <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5 text-xs">
              <Activity className="h-4 w-4 text-emerald-400 animate-pulse" />
              <span className="text-muted-foreground">Status Atual no Discord:</span>
              <span className="font-semibold text-foreground">
                {currentRotatedStatus.emoji ? `${currentRotatedStatus.emoji} ` : ""}
                {currentRotatedStatus.text}
              </span>
              <span className="ml-auto rounded-md bg-secondary/40 px-2 py-0.5 font-mono text-[10px] text-muted-foreground uppercase">
                {currentRotatedStatus.status}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statuses List Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Lista de Status</CardTitle>
            <CardDescription>Defina os textos, emojis e estados de presença que serão alternados.</CardDescription>
          </div>
          <Button onClick={addStatus} size="sm" variant="outline" className="gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" /> Adicionar Status
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {statuses.map((item, idx) => (
            <div
              key={idx}
              className="flex flex-wrap items-center gap-2.5 rounded-xl border border-border/70 bg-secondary/10 p-2.5 transition-colors hover:border-primary/30"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/30 text-xs font-mono font-bold text-muted-foreground">
                {idx + 1}
              </div>

              <div className="w-16">
                <Input
                  placeholder="Emoji"
                  value={item.emoji || ""}
                  onChange={(e) => updateStatus(idx, "emoji", e.target.value)}
                  className="h-8 text-center text-sm"
                />
              </div>

              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="Texto do status..."
                  value={item.text}
                  onChange={(e) => updateStatus(idx, "text", e.target.value)}
                  className="h-8 text-xs font-medium"
                />
              </div>

              <div className="w-32">
                <select
                  value={item.status || "online"}
                  onChange={(e) => updateStatus(idx, "status", e.target.value)}
                  className="h-8 w-full rounded-xl border border-input bg-card px-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="online">🟢 Online</option>
                  <option value="idle">🟡 Ausente</option>
                  <option value="dnd">🔴 Ocupado (DND)</option>
                  <option value="invisible">⚪ Invisível</option>
                </select>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeStatus(idx)}
                disabled={statuses.length <= 1}
                className="h-8 w-8 text-muted-foreground hover:text-rose-400"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Bio Rotation Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold">Rotação de Biografia (About Me)</CardTitle>
              <Switch checked={rotateBio} onCheckedChange={setRotateBio} />
            </div>
            <CardDescription>Alterne sua biografia de perfil no Discord junto com a rotação de status.</CardDescription>
          </div>
          {rotateBio && (
            <Button onClick={addBio} size="sm" variant="outline" className="gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" /> Adicionar Bio
            </Button>
          )}
        </CardHeader>
        {rotateBio && (
          <CardContent className="space-y-3">
            {bios.map((bio, idx) => (
              <div key={idx} className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-secondary/10 p-2.5">
                <span className="font-mono text-xs text-muted-foreground px-2">{idx + 1}</span>
                <Input
                  value={bio}
                  onChange={(e) => updateBio(idx, e.target.value)}
                  placeholder="Texto da biografia..."
                  className="h-8 text-xs"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeBio(idx)}
                  disabled={bios.length <= 1}
                  className="h-8 w-8 text-muted-foreground hover:text-rose-400"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        )}
      </Card>
    </div>
  )
}
