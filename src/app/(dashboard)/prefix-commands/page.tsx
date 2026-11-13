
import { useState, useEffect } from "react"
import { Terminal, Loader2, Power, PowerOff, AlertTriangle, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTokens } from "@/hooks/use-tokens"
import { api } from "@/lib/api-client"

interface PrefixStatus {
  enabled: boolean
  prefix: string
  activeTasks: string[]
}

export default function PaginaPrefixCommands() {
  const { activeToken } = useTokens()
  const [status, setStatus] = useState<PrefixStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [savingPrefix, setSavingPrefix] = useState(false)
  const [newPrefix, setNewPrefix] = useState("")
  const [error, setError] = useState("")

  const fetchStatus = async () => {
    setLoading(true)
    try {
      const res = await api.runTool("prefix-commands", {
        tokenId: activeToken?.id ?? "",
        action: "status",
      })
      const data = res.data as PrefixStatus
      setStatus(data)
      setNewPrefix(data.prefix)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeToken?.id])

  const handleToggle = async () => {
    if (!activeToken) return
    setToggling(true)
    setError("")
    try {
      const action = status?.enabled ? "disable" : "enable"
      const res = await api.runTool("prefix-commands", {
        tokenId: activeToken.id,
        action,
        ...(action === "enable" && newPrefix ? { prefix: newPrefix } : {}),
      })
      const data = res.data as PrefixStatus
      setStatus((prev) => ({ ...prev!, enabled: data.enabled, prefix: data.prefix ?? prev?.prefix ?? ";" }))
      await fetchStatus()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro")
    } finally {
      setToggling(false)
    }
  }

  const handleSavePrefix = async () => {
    if (!activeToken || !newPrefix.trim()) return
    setSavingPrefix(true)
    setError("")
    try {
      const res = await api.runTool("prefix-commands", {
        tokenId: activeToken.id,
        action: "set-prefix",
        prefix: newPrefix.trim(),
      })
      const data = res.data as { prefix: string }
      setStatus((prev) => prev ? { ...prev, prefix: data.prefix } : null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro")
    } finally {
      setSavingPrefix(false)
    }
  }

  const p = status?.prefix ?? ";"

  return (
    <div className="space-y-6">
      {!activeToken && (
        <div className="flex items-center gap-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-5 py-4">
          <AlertTriangle size={18} className="shrink-0 text-yellow-500" />
          <span className="text-sm text-yellow-400">Conecte uma conta primeiro</span>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card/40 p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10">
            <Terminal size={18} className="text-violet-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-foreground">Prefix Commands</h2>
            <p className="text-xs text-muted-foreground">Controle comandos de texto no chat usando um prefixo</p>
          </div>
          {status && (
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${status.enabled ? "bg-green-500/10 text-green-400" : "bg-zinc-500/10 text-zinc-400"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${status.enabled ? "bg-green-400" : "bg-zinc-400"}`} />
              {status.enabled ? "Ativo" : "Inativo"}
            </span>
          )}
        </div>

        {loading && !status ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Prefixo</label>
              <div className="flex gap-2">
                <Input
                  value={newPrefix}
                  onChange={(e) => setNewPrefix(e.target.value)}
                  placeholder=";"
                  className="h-11 w-24 border-border bg-secondary/40 text-center font-mono text-sm"
                  disabled={!activeToken}
                />
                {newPrefix !== status?.prefix && (
                  <Button onClick={handleSavePrefix} disabled={savingPrefix || !newPrefix.trim() || !activeToken} variant="outline" className="h-11">
                    {savingPrefix ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Settings size={16} className="mr-2" />}
                    Salvar
                  </Button>
                )}
              </div>
            </div>

            <Button
              onClick={handleToggle}
              disabled={toggling || !activeToken}
              className={`h-11 w-full text-white ${status?.enabled ? "bg-red-600 hover:bg-red-700" : "bg-violet-600 hover:bg-violet-700"}`}
            >
              {toggling ? (
                <Loader2 size={18} className="mr-2 animate-spin" />
              ) : status?.enabled ? (
                <PowerOff size={18} className="mr-2" />
              ) : (
                <Power size={18} className="mr-2" />
              )}
              {status?.enabled ? "Desativar" : "Ativar"}
            </Button>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/5 p-3">
            <AlertTriangle size={16} className="shrink-0 text-red-400" />
            <span className="text-sm text-red-400">{error}</span>
          </div>
        )}
      </div>

      {status?.activeTasks && status.activeTasks.length > 0 && (
        <div className="rounded-xl border border-border bg-card/40 p-6">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Tarefas Ativas</h3>
          <div className="space-y-2">
            {status.activeTasks.map((task, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 px-4 py-3">
                <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-sm text-foreground font-mono">{task}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card/40 p-6">
        <h3 className="mb-4 text-sm font-semibold text-foreground">Comandos Disponíveis</h3>
        <div className="space-y-4 text-xs">
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Geral</p>
            <div className="grid gap-1.5">
              {[
                { cmd: "cl", uso: "", desc: "Deleta todas as suas mensagens no canal atual" },
                { cmd: "stop", uso: "", desc: "Para a deleção de mensagens em andamento" },
                { cmd: "stopall", uso: "", desc: "Para todos os comandos ativos de uma vez" },
              ].map((c) => (
                <div key={c.cmd} className="flex items-baseline gap-3 rounded-lg border border-border/50 bg-secondary/20 px-3 py-2">
                  <code className="font-mono text-violet-400 whitespace-nowrap">{p}{c.cmd}{c.uso && <span className="text-muted-foreground/50"> {c.uso}</span>}</code>
                  <span className="text-muted-foreground">{c.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Moderação de Voz</p>
            <div className="grid gap-1.5">
              {[
                { cmd: "mic", uso: "@id", desc: "Muta o microfone do usuário na call" },
                { cmd: "rmic", uso: "@id", desc: "Desmuta o microfone do usuário na call" },
                { cmd: "mute", uso: "@id", desc: "Muta e ensurdece o usuário na call" },
                { cmd: "rmute", uso: "@id", desc: "Desmuta e desensurdece o usuário" },
                { cmd: "silence", uso: "", desc: "Silencia todos os membros da sua call" },
                { cmd: "rsilence", uso: "", desc: "Remove o silenciamento de todos na call" },
                { cmd: "block", uso: "@id", desc: "Desconecta o usuário da call e deleta suas mensagens" },
                { cmd: "rblock", uso: "@id", desc: "Desbloqueia o usuário" },
              ].map((c) => (
                <div key={c.cmd} className="flex items-baseline gap-3 rounded-lg border border-border/50 bg-secondary/20 px-3 py-2">
                  <code className="font-mono text-violet-400 whitespace-nowrap">{p}{c.cmd}{c.uso && <span className="text-muted-foreground/50"> {c.uso}</span>}</code>
                  <span className="text-muted-foreground">{c.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Ferramentas de Call</p>
            <div className="grid gap-1.5">
              {[
                { cmd: "farm", uso: "canal?", desc: "Entra na call e fica farmando horas (sem canal = usa a call atual)" },
                { cmd: "rfarm", uso: "", desc: "Para a farmagem e sai da call" },
                { cmd: "coleira", uso: "@id", desc: "Prende o usuário na sua call — sempre puxa de volta" },
                { cmd: "rcoleira", uso: "@id", desc: "Solta o usuário — para de puxar de volta" },
                { cmd: "elevador", uso: "@id", desc: "Move o usuário entre calls aleatoriamente sem parar" },
                { cmd: "relevador", uso: "@id", desc: "Para o elevador — o usuário fica onde está" },
                { cmd: "proteger", uso: "@id", desc: "Protege o usuário — desmuta automaticamente ao ser mutado" },
                { cmd: "rproteger", uso: "@id", desc: "Remove a proteção — o usuário pode ser mutado normalmente" },
                { cmd: "stalkear", uso: "@id", desc: "Rastreia o usuário — envia a localização na call a cada 10s" },
                { cmd: "rstalkear", uso: "@id", desc: "Para o rastreamento do usuário" },
                { cmd: "link", uso: "", desc: "Envia o link da call em que você está no chat" },
              ].map((c) => (
                <div key={c.cmd} className="flex items-baseline gap-3 rounded-lg border border-border/50 bg-secondary/20 px-3 py-2">
                  <code className="font-mono text-violet-400 whitespace-nowrap">{p}{c.cmd}{c.uso && <span className="text-muted-foreground/50"> {c.uso}</span>}</code>
                  <span className="text-muted-foreground">{c.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Outros</p>
            <div className="grid gap-1.5">
              {[
                { cmd: "apelido", uso: "@id nome", desc: "Força um apelido no usuário — mantém mesmo se tentar mudar" },
                { cmd: "rapelido", uso: "@id", desc: "Remove o apelido forçado e restaura o original" },
              ].map((c) => (
                <div key={c.cmd} className="flex items-baseline gap-3 rounded-lg border border-border/50 bg-secondary/20 px-3 py-2">
                  <code className="font-mono text-violet-400 whitespace-nowrap">{p}{c.cmd}{c.uso && <span className="text-muted-foreground/50"> {c.uso}</span>}</code>
                  <span className="text-muted-foreground">{c.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Transformação de Texto & Estilo</p>
            <div className="grid gap-1.5">
              {[
                { cmd: "mock", uso: "<texto>", desc: "Alterna maiúsculas e minúsculas (meme SpongeBob)" },
                { cmd: "emojify", uso: "<texto>", desc: "Converte letras em emojis regionais grandes (🇦-🇿)" },
                { cmd: "spoiler", uso: "<texto>", desc: "Envolve cada letra individualmente em tags de spoiler" },
                { cmd: "vaporwave", uso: "<texto>", desc: "Converte texto para largura total aesthetic (Fullwidth)" },
                { cmd: "flip", uso: "<texto>", desc: "Inverte e gira o texto de cabeça para baixo" },
                { cmd: "zalgo", uso: "<texto>", desc: "Distorção visual Zalgo com marcas diacríticas" },
                { cmd: "smallcaps", uso: "<texto>", desc: "Converte texto para letras maiúsculas miniatura (Small Caps)" },
                { cmd: "super", uso: "<texto>", desc: "Converte caracteres para sobrescrito (superscript)" },
                { cmd: "sub", uso: "<texto>", desc: "Converte caracteres para subscrito (subscript)" },
                { cmd: "clap", uso: "<texto>", desc: "Insere palmas entre as palavras (👏 texto 👏)" },
                { cmd: "leet", uso: "<texto>", desc: "Traduz o texto para l33t sp34k" },
                { cmd: "stutter", uso: "<texto>", desc: "Gera gagueira dramática nas primeiras sílabas" },
              ].map((c) => (
                <div key={c.cmd} className="flex items-baseline gap-3 rounded-lg border border-border/50 bg-secondary/20 px-3 py-2">
                  <code className="font-mono text-cyan-400 whitespace-nowrap">{p}{c.cmd}{c.uso && <span className="text-muted-foreground/50"> {c.uso}</span>}</code>
                  <span className="text-muted-foreground">{c.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Cifras & Criptografia</p>
            <div className="grid gap-1.5">
              {[
                { cmd: "hide", uso: "<segredo> | <capa>", desc: "Esconde texto secreto invisível dentro de mensagem de capa (Zero-Width)" },
                { cmd: "reveal", uso: "<mensagem>", desc: "Extrai e revela texto secreto oculto com caracteres invisíveis" },
                { cmd: "rot13", uso: "[shift] <texto>", desc: "Aplica cifra de César / rotação alfabética (padrão 13)" },
                { cmd: "atbash", uso: "<texto>", desc: "Cifra Atbash de espelhamento alfabético (A <-> Z)" },
                { cmd: "vigenere", uso: "<chave> <texto>", desc: "Cifra texto usando Vigenère com palavra-chave" },
                { cmd: "unvigenere", uso: "<chave> <texto>", desc: "Decifra texto cifrado com Vigenère" },
                { cmd: "morse", uso: "<texto>", desc: "Converte texto para Código Morse Internacional" },
                { cmd: "unmorse", uso: "<code>", desc: "Decodifica Código Morse para texto legível" },
                { cmd: "binary", uso: "<texto>", desc: "Converte texto para código binário de 8 bits" },
                { cmd: "unbinary", uso: "<bits>", desc: "Decodifica sequência binária de 8 bits para texto" },
                { cmd: "b64enc", uso: "<texto>", desc: "Codifica texto para Base64 (RFC 4648)" },
                { cmd: "b64dec", uso: "<base64>", desc: "Decodifica string em Base64 para texto original" },
                { cmd: "hexenc", uso: "<texto>", desc: "Codifica texto em bytes hexadecimais" },
                { cmd: "hexdec", uso: "<hex>", desc: "Decodifica sequência hexadecimal para texto" },
                { cmd: "hash", uso: "[algo] <texto>", desc: "Gera hash criptográfico (MD5, SHA1, SHA256, SHA512)" },
              ].map((c) => (
                <div key={c.cmd} className="flex items-baseline gap-3 rounded-lg border border-border/50 bg-secondary/20 px-3 py-2">
                  <code className="font-mono text-emerald-400 whitespace-nowrap">{p}{c.cmd}{c.uso && <span className="text-muted-foreground/50"> {c.uso}</span>}</code>
                  <span className="text-muted-foreground">{c.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Formatação & Visual</p>
            <div className="grid gap-1.5">
              {[
                { cmd: "ansi", uso: "<cor> <texto>", desc: "Formata texto em bloco ANSI colorido no chat (red, green, blue, cyan...)" },
                { cmd: "box", uso: "[estilo] <texto>", desc: "Gera moldura em caixa decorativa (rounded, double, single, ascii)" },
                { cmd: "progress", uso: "<atual> <max> [emoji]", desc: "Renderiza barra visual de progresso proporcional" },
                { cmd: "table", uso: "H1,H2 | C1,C2", desc: "Gera tabela monospace alinhada para dados tabulares" },
                { cmd: "textstats", uso: "<texto>", desc: "Estatísticas de caracteres, bytes e conformidade com limites do Discord" },
              ].map((c) => (
                <div key={c.cmd} className="flex items-baseline gap-3 rounded-lg border border-border/50 bg-secondary/20 px-3 py-2">
                  <code className="font-mono text-amber-400 whitespace-nowrap">{p}{c.cmd}{c.uso && <span className="text-muted-foreground/50"> {c.uso}</span>}</code>
                  <span className="text-muted-foreground">{c.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Utilitários & APIs Públicas Gratuitas</p>
            <div className="grid gap-1.5">
              {[
                { cmd: "urban", uso: "<termo>", desc: "Consulta significados e exemplos de gírias no Urban Dictionary" },
                { cmd: "translate", uso: "[destino] <texto>", desc: "Traduz texto para qualquer idioma via Google Translate com auto-detect" },
                { cmd: "qr", uso: "<link ou texto>", desc: "Gera QR Code escaneável de alta resolução instantaneamente" },
                { cmd: "weather", uso: "<cidade>", desc: "Condições meteorológicas, sensação térmica e umidade ao vivo (wttr.in)" },
                { cmd: "crypto", uso: "<moeda>", desc: "Preço em tempo real e variação 24h de criptomoedas (CoinGecko)" },
                { cmd: "currency", uso: "<valor> <de> <para>", desc: "Conversão de moedas fiduciárias em tempo real (USD, BRL, EUR...)" },
                { cmd: "geoip", uso: "<ip ou host>", desc: "Geolocalização, ISP, ASN e coordenadas de qualquer IP" },
                { cmd: "wiki", uso: "<termo>", desc: "Resumo enciclopédico oficial e link da Wikipedia" },
                { cmd: "shorten", uso: "<url>", desc: "Encurta URLs longas em links seguros usando TinyURL" },
                { cmd: "joke", uso: "[categoria]", desc: "Gera piada aleatória com punchline protegida por spoiler" },
                { cmd: "trivia", uso: "", desc: "Fato curioso e verificado aleatório para descontrair" },
              ].map((c) => (
                <div key={c.cmd} className="flex items-baseline gap-3 rounded-lg border border-border/50 bg-secondary/20 px-3 py-2">
                  <code className="font-mono text-pink-400 whitespace-nowrap">{p}{c.cmd}{c.uso && <span className="text-muted-foreground/50"> {c.uso}</span>}</code>
                  <span className="text-muted-foreground">{c.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
