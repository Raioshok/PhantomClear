import { useState, useEffect } from "react"
import { ChevronsUpDown, Search, Loader2, Server, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useTokens } from "@/hooks/use-tokens"
import { api } from "@/lib/api-client"
import type { DiscordGuild } from "@/types/discord"

interface GuildPickerProps {
  onSelect?: (guildId: string) => void
  onChange?: (guildId: string) => void
  value?: string
  disabled?: boolean
  className?: string
}

export function GuildPicker({ onSelect, onChange, value, disabled, className }: GuildPickerProps) {
  const { activeToken } = useTokens()
  const [open, setOpen] = useState(false)
  const [guilds, setGuilds] = useState<DiscordGuild[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")

  const loadGuilds = () => {
    if (!activeToken) return
    setLoading(true)
    api.getTokenGuilds(activeToken.id)
      .then((res) => {
        if (res.data && Array.isArray(res.data)) {
          setGuilds(res.data as DiscordGuild[])
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (activeToken) {
      loadGuilds()
    }
  }, [activeToken?.id])

  useEffect(() => {
    if (open && guilds.length === 0) {
      loadGuilds()
    }
  }, [open])

  const selectedGuild = guilds.find((g) => g.id === value)

  const filtered = guilds.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase()) || g.id.includes(search)
  )

  const icon = (g: DiscordGuild) =>
    g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=32` : null

  const handlePick = (id: string) => {
    onSelect?.(id)
    onChange?.(id)
    setOpen(false)
    setSearch("")
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled || !activeToken}
          className={`h-10 w-full justify-between px-3 text-left font-normal bg-background border-input ${
            !selectedGuild ? "text-muted-foreground" : "text-foreground"
          } ${className || ""}`}
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            {selectedGuild ? (
              <>
                <div className="h-5 w-5 shrink-0 rounded-md overflow-hidden bg-secondary flex items-center justify-center">
                  {icon(selectedGuild) ? (
                    <img src={icon(selectedGuild)!} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-bold text-muted-foreground">
                      {selectedGuild.name.charAt(0)}
                    </span>
                  )}
                </div>
                <span className="truncate text-xs font-medium text-foreground">
                  {selectedGuild.name}
                </span>
              </>
            ) : (
              <>
                <Server className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate text-xs">
                  {loading ? "Carregando servidores..." : "Selecionar Servidor..."}
                </span>
              </>
            )}
          </div>
          <ChevronsUpDown size={14} className="shrink-0 text-muted-foreground opacity-60 ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 z-[100]" align="start">
        <div className="flex items-center gap-2 border-b border-border/50 px-3 py-2 bg-card">
          <Search size={14} className="shrink-0 text-muted-foreground" />
          <input
            placeholder="Buscar servidor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground text-foreground"
            autoFocus
          />
        </div>
        <div className="max-h-60 overflow-y-auto p-1 bg-card">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 size={16} className="animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-5 text-center">
              <p className="text-xs text-muted-foreground">
                {guilds.length === 0 ? "Nenhum servidor encontrado na conta." : "Nenhum servidor corresponde à busca."}
              </p>
              {guilds.length === 0 && (
                <button
                  type="button"
                  onClick={loadGuilds}
                  className="mt-2 text-[11px] text-primary hover:underline font-medium"
                >
                  Tentar novamente
                </button>
              )}
            </div>
          ) : (
            filtered.map((g) => {
              const isSelected = g.id === value
              return (
                <button
                  type="button"
                  key={g.id}
                  onClick={() => handlePick(g.id)}
                  className={`flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left transition-colors ${
                    isSelected ? "bg-primary/15 text-primary" : "hover:bg-secondary/60 text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-7 w-7 shrink-0 rounded-md bg-secondary/60 overflow-hidden flex items-center justify-center">
                      {icon(g) ? (
                        <img src={icon(g)!} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-[10px] font-bold text-muted-foreground">{g.name.charAt(0)}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{g.name}</p>
                      <p className="font-mono text-[9px] text-muted-foreground">{g.id}</p>
                    </div>
                  </div>
                  {isSelected && <Check size={14} className="shrink-0 text-primary ml-2" />}
                </button>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
