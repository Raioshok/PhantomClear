import { useState } from "react"
import {
  Webhook,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  StopCircle,
  Play,
  Layers,
  Sparkles,
  Link2,
  Image as ImageIcon,
  Flame,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { useWSEvent } from "@/hooks/use-websocket"
import { api } from "@/lib/api-client"
import type { WSToolProgress, WSToolCompleted, WSToolError } from "@/types/websocket"

export default function PaginaWebhooks() {
  const [webhookUrl, setWebhookUrl] = useState("")
  const [testing, setTesting] = useState(false)
  const [webhookInfo, setWebhookInfo] = useState<any | null>(null)
  const [testError, setTestError] = useState("")

  const [username, setUsername] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [content, setContent] = useState("")

  // Embed
  const [useEmbed, setUseEmbed] = useState(false)
  const [embedTitle, setEmbedTitle] = useState("")
  const [embedDescription, setEmbedDescription] = useState("")
  const [embedColor, setEmbedColor] = useState("#00f59b")
  const [embedFooter, setEmbedFooter] = useState("PhantomClear V2")
  const [embedImage, setEmbedImage] = useState("")

  // Sending states
  const [sendingSingle, setSendingSingle] = useState(false)
  const [singleSuccess, setSingleSuccess] = useState(false)

  // Spam / Batch
  const [isSpamming, setIsSpamming] = useState(false)
  const [spamCount, setSpamCount] = useState(5)
  const [spamDelay, setSpamDelay] = useState(500)
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [progressMsg, setProgressMsg] = useState("")

  useWSEvent<WSToolProgress>("tool:progress", (ev) => {
    if (ev.taskId === activeTaskId) {
      setProgressMsg(ev.message)
    }
  })

  useWSEvent<WSToolCompleted>("tool:completed", (ev) => {
    if (ev.taskId === activeTaskId) {
      setIsSpamming(false)
      setActiveTaskId(null)
      setProgressMsg("Disparo concluído com sucesso!")
    }
  })

  useWSEvent<WSToolError>("tool:error", (ev) => {
    if (ev.taskId === activeTaskId) {
      setIsSpamming(false)
      setActiveTaskId(null)
      setProgressMsg(`Erro: ${ev.error}`)
    }
  })

  const handleTest = async () => {
    if (!webhookUrl) return
    setTesting(true)
    setTestError("")
    setWebhookInfo(null)
    try {
      const res = await api.testWebhook(webhookUrl)
      if (res.data?.valid) {
        setWebhookInfo(res.data)
      } else {
        setTestError("URL de webhook inválida ou inexistente.")
      }
    } catch (err: any) {
      setTestError(err.message || "Erro ao conectar com webhook")
    } finally {
      setTesting(false)
    }
  }

  const buildPayload = () => {
    const payload: any = {
      webhookUrl,
      content: content || undefined,
      username: username || undefined,
      avatarUrl: avatarUrl || undefined,
    }

    if (useEmbed && (embedTitle || embedDescription)) {
      payload.embeds = [
        {
          title: embedTitle || undefined,
          description: embedDescription || undefined,
          color: parseInt(embedColor.replace("#", ""), 16) || 0x00f59b,
          footer: embedFooter ? { text: embedFooter } : undefined,
          image: embedImage ? { url: embedImage } : undefined,
        },
      ]
    }

    return payload
  }

  const handleSendSingle = async () => {
    if (!webhookUrl || (!content && !embedTitle && !embedDescription)) return
    setSendingSingle(true)
    try {
      await api.sendWebhook(buildPayload())
      setSingleSuccess(true)
      setTimeout(() => setSingleSuccess(false), 2000)
    } catch {} finally {
      setSendingSingle(false)
    }
  }

  const handleStartSpam = async () => {
    if (!webhookUrl || (!content && !embedTitle && !embedDescription)) return
    setIsSpamming(true)
    try {
      const res = await api.spamWebhook({
        ...buildPayload(),
        count: spamCount,
        delay: spamDelay,
      })
      if (res.data?.taskId) {
        setActiveTaskId(res.data.taskId)
      }
    } catch {
      setIsSpamming(false)
    }
  }

  const handleStopSpam = async () => {
    if (!activeTaskId) return
    try {
      await api.cancelTask(activeTaskId)
    } catch {}
    setIsSpamming(false)
    setActiveTaskId(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Webhook Manager & Disparador</h1>
        <p className="text-sm text-muted-foreground">
          Envie mensagens personalizadas, construa embeds e teste a performance de webhooks do Discord.
        </p>
      </div>

      {/* Webhook URL Input */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Link2 className="h-4 w-4 text-primary" />
            Configuração do Webhook
          </CardTitle>
          <CardDescription>Insira a URL do webhook criado nas configurações do seu canal.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://discord.com/api/webhooks/..."
              className="font-mono text-xs flex-1"
            />
            <Button
              onClick={handleTest}
              disabled={testing || !webhookUrl}
              variant="outline"
              className="shrink-0 gap-1.5 text-xs font-semibold"
            >
              {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Webhook className="h-3.5 w-3.5" />}
              Testar
            </Button>
          </div>

          {testError && (
            <p className="text-xs text-rose-400 flex items-center gap-1.5 font-medium">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {testError}
            </p>
          )}

          {webhookInfo && (
            <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>
                Conectado ao webhook: <strong>{webhookInfo.name}</strong> (Canal ID: {webhookInfo.channel_id})
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message Designer */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Conteúdo da Mensagem</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Nome de Exibição</label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="PhantomClear Bot"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Avatar URL</label>
                <Input
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://.../icon.png"
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Texto da Mensagem</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Escreva a mensagem aqui..."
                rows={4}
                className="w-full rounded-xl border border-input bg-card p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border/70 bg-secondary/15 p-3">
              <div>
                <p className="text-xs font-semibold text-foreground">Incluir Embed Personalizado</p>
                <p className="text-[11px] text-muted-foreground">Adiciona um cartão estilizado com título e cores.</p>
              </div>
              <Switch checked={useEmbed} onCheckedChange={setUseEmbed} />
            </div>

            {useEmbed && (
              <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2 space-y-1">
                    <label className="text-[11px] font-semibold text-foreground">Título do Embed</label>
                    <Input
                      value={embedTitle}
                      onChange={(e) => setEmbedTitle(e.target.value)}
                      placeholder="Título em destaque..."
                      className="h-7 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-foreground">Cor (HEX)</label>
                    <Input
                      type="color"
                      value={embedColor}
                      onChange={(e) => setEmbedColor(e.target.value)}
                      className="h-7 w-full p-0.5 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-foreground">Descrição do Embed</label>
                  <textarea
                    value={embedDescription}
                    onChange={(e) => setEmbedDescription(e.target.value)}
                    placeholder="Descrição detalhada do embed..."
                    rows={2}
                    className="w-full rounded-lg border border-input bg-card p-2 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-foreground">Imagem URL</label>
                    <Input
                      value={embedImage}
                      onChange={(e) => setEmbedImage(e.target.value)}
                      placeholder="https://.../img.png"
                      className="h-7 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-foreground">Rodapé (Footer)</label>
                    <Input
                      value={embedFooter}
                      onChange={(e) => setEmbedFooter(e.target.value)}
                      placeholder="Texto do rodapé"
                      className="h-7 text-xs"
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Execution & Dispatch Modes */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Send className="h-4 w-4 text-emerald-400" />
                Envio Único
              </CardTitle>
              <CardDescription>Dispara 1 mensagem para o canal do webhook.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleSendSingle}
                disabled={sendingSingle || !webhookUrl}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold gap-2"
              >
                {sendingSingle ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {singleSuccess ? "Enviado com Sucesso!" : "Disparar Mensagem"}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Flame className="h-4 w-4 text-rose-500" />
                Disparo em Massa (Spam / Tester)
              </CardTitle>
              <CardDescription>Envia N mensagens sequenciais com intervalo configurável.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Quantidade</label>
                  <Input
                    type="number"
                    min={1}
                    max={500}
                    value={spamCount}
                    onChange={(e) => setSpamCount(Number(e.target.value) || 1)}
                    className="h-8 text-xs font-mono text-center"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Delay (ms)</label>
                  <Input
                    type="number"
                    min={50}
                    max={10000}
                    value={spamDelay}
                    onChange={(e) => setSpamDelay(Number(e.target.value) || 500)}
                    className="h-8 text-xs font-mono text-center"
                  />
                </div>
              </div>

              {progressMsg && (
                <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-2.5 text-xs text-primary font-medium">
                  {isSpamming && <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />}
                  <span>{progressMsg}</span>
                </div>
              )}

              {isSpamming ? (
                <Button
                  onClick={handleStopSpam}
                  variant="destructive"
                  className="w-full font-semibold gap-2 shadow-md"
                >
                  <StopCircle className="h-4 w-4" /> Parar Disparo
                </Button>
              ) : (
                <Button
                  onClick={handleStartSpam}
                  disabled={!webhookUrl}
                  className="w-full bg-rose-600 hover:bg-rose-500 text-white font-semibold gap-2 shadow-md"
                >
                  <Flame className="h-4 w-4" /> Iniciar Disparo em Massa
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
