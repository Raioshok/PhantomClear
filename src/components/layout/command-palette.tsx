import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Command } from "cmdk"
import {
  LayoutDashboard, User, BarChart3, Trash2, Package, MessageSquare, PhoneOff,
  UserMinus, LogOut, Copy, Image, MoveRight, Timer, MicOff, VolumeX, Users,
  Anchor, Shield, Crosshair, PieChart, Archive, Radio, BellRing, Settings,
  ListTodo, Terminal, Gamepad2, Search, X, UserCheck, Webhook, RotateCw, Bot, Gift, Award,
} from "lucide-react"
import { ThemedIcon } from "@/components/themed-icon"
import { xpIconForRoute } from "@/lib/xp-icons"

interface PaletteItem {
  label: string
  href: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  keywords?: string[]
}

interface PaletteGroup {
  heading: string
  items: PaletteItem[]
}

const GROUPS: PaletteGroup[] = [
  {
    heading: "Geral",
    items: [
      { label: "Visão Geral", href: "/", icon: LayoutDashboard, keywords: ["home", "inicio", "dashboard"] },
      { label: "Perfil", href: "/perfil", icon: User },
      { label: "Analytics", href: "/analytics", icon: BarChart3, keywords: ["estatisticas"] },
    ],
  },
  {
    heading: "Mensagens",
    items: [
      { label: "Limpar DM", href: "/limpar-dm", icon: Trash2 },
      { label: "Limpar DM dos Amigos", href: "/limpar-dm-amigos", icon: Trash2 },
      { label: "Limpar DMs Abertas", href: "/limpar-dms", icon: Trash2 },
      { label: "Limpar Package", href: "/limpar-package", icon: Package },
      { label: "Abrir DMs", href: "/abrir-dms", icon: MessageSquare },
      { label: "Fechar DMs", href: "/fechar-dms", icon: PhoneOff },
    ],
  },
  {
    heading: "Conta",
    items: [
      { label: "Remover Amigos", href: "/remover-amigos", icon: UserMinus },
      { label: "Sair de Servidores", href: "/sair-servidores", icon: LogOut },
      { label: "Solicitações & HypeSquad", href: "/solicitacoes-amizade", icon: UserCheck, keywords: ["amigos", "hypesquad", "pedidos"] },
      { label: "Username Sniper", href: "/username-sniper", icon: Crosshair, keywords: ["username", "tag", "sniper", "pomelo"] },
    ],
  },
  {
    heading: "Servidores",
    items: [
      { label: "Clonar Servidor", href: "/clonar-servidor", icon: Copy },
      { label: "Scraper Ícones", href: "/scraper-icones", icon: Image },
      { label: "Webhooks", href: "/webhooks", icon: Webhook, keywords: ["disparo", "embed", "spam"] },
    ],
  },
  {
    heading: "Call",
    items: [
      { label: "Desconectar Call", href: "/desconectar-call", icon: PhoneOff },
      { label: "Mover Call", href: "/mover-call", icon: MoveRight },
      { label: "Farm Call", href: "/farm-call", icon: Timer },
      { label: "Mutar Call", href: "/mutar-call", icon: MicOff },
      { label: "Ensurdecer Call", href: "/ensurdecer-call", icon: VolumeX },
      { label: "Listar Call", href: "/listar-call", icon: Users },
      { label: "Elevador", href: "/elevador", icon: MoveRight },
      { label: "Coleira", href: "/coleira", icon: Anchor },
      { label: "Proteger User", href: "/proteger-user", icon: Shield },
      { label: "Tormentar", href: "/tormentar", icon: Crosshair },
    ],
  },
  {
    heading: "Dados",
    items: [
      { label: "Análise de Package", href: "/analise-package", icon: PieChart },
      { label: "Backups", href: "/backups", icon: Archive },
    ],
  },
  {
    heading: "Monitoramento",
    items: [
      { label: "Dashboard de Monitoramento", href: "/monitoramento", icon: Radio },
      { label: "Alertas", href: "/alertas", icon: BellRing },
      { label: "Configuração de Monitoramento", href: "/monitoramento/config", icon: Settings },
    ],
  },
  {
    heading: "Sistema",
    items: [
      { label: "Badge Collector & Farmer", href: "/badges", icon: Shield, keywords: ["badge", "insignia", "hypesquad", "farm", "dev"] },
      { label: "Quest & Orbs Farmer", href: "/quest-farmer", icon: Award, keywords: ["quest", "orbs", "missões", "farm"] },
      { label: "Tasks", href: "/tasks", icon: ListTodo },
      { label: "Nitro Sniper", href: "/nitro-sniper", icon: Gift, keywords: ["nitro", "gift", "sniper", "claim"] },
      { label: "Status Rotator", href: "/status-rotator", icon: RotateCw, keywords: ["status", "bio", "rotacao"] },
      { label: "Auto-Responder", href: "/auto-responder", icon: Bot, keywords: ["responder", "afk", "auto"] },
      { label: "Prefix Commands", href: "/prefix-commands", icon: Terminal },
      { label: "Rich Presence", href: "/rpc", icon: Gamepad2 },
      { label: "Configurações", href: "/configuracoes", icon: Settings },
    ],
  },
]

export function CommandPalette() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen((v) => !v)
      } else if (e.key === "Escape") {
        setOpen(false)
      }
    }
    const onOpen = () => setOpen(true)
    window.addEventListener("keydown", onKey)
    window.addEventListener("open-command-palette", onOpen)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("open-command-palette", onOpen)
    }
  }, [])

  const go = (href: string) => {
    setOpen(false)
    navigate(href)
  }

  if (!open) return null

  return (
    <div className="command-palette-overlay fixed inset-0 z-[9998] flex items-start justify-center p-4 pt-[12vh]">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity" onClick={() => setOpen(false)} />
      <Command
        label="Command palette"
        loop
        className="command-palette-window relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-border/80 bg-card/95 shadow-[0_24px_80px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl animate-in fade-in-0 zoom-in-95"
      >
        <div className="command-palette-titlebar theme-xp-only">
          <ThemedIcon name="run"><Search size={16} /></ThemedIcon>
          <span>Executar — PhantomClear</span>
          <button type="button" data-window-action="close" onClick={() => setOpen(false)} aria-label="Fechar busca" title="Fechar">
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <div className="command-palette-search flex items-center gap-3 border-b border-border/70 px-4">
          <ThemedIcon name="search" className="text-muted-foreground/80"><Search size={16} /></ThemedIcon>
          <Command.Input
            autoFocus
            placeholder="Buscar páginas e ferramentas..."
            className="h-12 flex-1 bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground/60"
          />
          <kbd className="hidden shrink-0 rounded-md border border-border/80 bg-secondary/80 px-2 py-0.5 font-mono text-[10px] text-muted-foreground shadow-xs sm:block">ESC</kbd>
        </div>
        <Command.List className="max-h-[55vh] overflow-y-auto p-2">
          <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
            Nada encontrado.
          </Command.Empty>
          {GROUPS.map((group) => (
            <Command.Group
              key={group.heading}
              heading={group.heading}
              className="mb-1 [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground/60"
            >
              {group.items.map((item) => {
                const Icon = item.icon
                return (
                  <Command.Item
                    key={item.href}
                    value={`${item.label} ${item.keywords?.join(" ") ?? ""}`}
                    onSelect={() => go(item.href)}
                    className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium text-foreground/90 transition-all data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary data-[selected=true]:shadow-xs"
                  >
                    <ThemedIcon name={xpIconForRoute(item.href)} className="text-muted-foreground/70"><Icon size={16} /></ThemedIcon>
                    <span className="flex-1 font-medium">{item.label}</span>
                  </Command.Item>
                )
              })}
            </Command.Group>
          ))}
        </Command.List>
      </Command>
    </div>
  )
}
