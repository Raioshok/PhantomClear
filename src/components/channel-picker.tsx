import { useState, useEffect } from "react"
import { ChevronsUpDown, Search, Loader2, ChevronLeft, Hash, Volume2, Folder, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useTokens } from "@/hooks/use-tokens"
import { api } from "@/lib/api-client"
import type { DiscordGuild, DiscordChannel } from "@/types/discord"

const VOICE_TYPES = [2, 13]
const TEXT_TYPES = [0, 5, 15]
const CATEGORY_TYPE = 4

type ChannelFilter = "voice" | "text" | "category"

interface ChannelPickerProps {
  onSelect?: (channelId: string) => void
  onChange?: (channelId: string) => void
  value?: string
  disabled?: boolean
  type?: ChannelFilter
  guildId?: string
  className?: string
}

export function ChannelPicker({
  onSelect,
  onChange,
  value,
  disabled,
  type = "text",
  guildId: fixedGuildId,
  className,
}: ChannelPickerProps) {
  const { activeToken } = useTokens()
  const [open, setOpen] = useState(false)
  const [guilds, setGuilds] = useState<DiscordGuild[]>([])
  const [channels, setChannels] = useState<DiscordChannel[]>([])
  const [selectedGuild, setSelectedGuild] = useState<DiscordGuild | null>(null)
  const [loadingGuilds, setLoadingGuilds] = useState(false)
  const [loadingChannels, setLoadingChannels] = useState(false)
  const [search, setSearch] = useState("")

  const skipGuildStep = Boolean(fixedGuildId)

  const loadChannels = (gid: string) => {
    if (!activeToken) return
    setLoadingChannels(true)
    api.getGuildChannels(activeToken.id, gid)
      .then((res) => {
        if (res.data && Array.isArray(res.data)) {
          setChannels(res.data as DiscordChannel[])
        }
      })
      .catch(() => {})
      .finally(() => setLoadingChannels(false))
  }

  useEffect(() => {
    if (fixedGuildId && activeToken) {
      loadChannels(fixedGuildId)
    } else if (!fixedGuildId) {
      setChannels([])
    }
  }, [fixedGuildId, activeToken?.id])

  useEffect(() => {
    if (!open || !activeToken) return
    if (skipGuildStep && fixedGuildId) {
      if (channels.length === 0) loadChannels(fixedGuildId)
    } else if (!skipGuildStep) {
      setLoadingGuilds(true)
      api.getTokenGuilds(activeToken.id)
        .then((res) => {
          if (res.data && Array.isArray(res.data)) {
            setGuilds(res.data as DiscordGuild[])
          }
        })
        .catch(() => {})
        .finally(() => setLoadingGuilds(false))
    }
  }, [open, activeToken?.id, fixedGuildId, skipGuildStep])

  const handleSelectGuild = (guild: DiscordGuild) => {
    setSelectedGuild(guild)
    loadChannels(guild.id)
    setSearch("")
  }

  const handlePickChannel = (id: string) => {
    onSelect?.(id)
    onChange?.(id)
    setOpen(false)
    setSearch("")
  }

  const handleBack = () => {
    setSelectedGuild(null)
    setChannels([])
    setSearch("")
  }

  const filterTypes = type === "voice" ? VOICE_TYPES : type === "text" ? TEXT_TYPES : [CATEGORY_TYPE]
  const categories = channels.filter((c) => c.type === CATEGORY_TYPE)
  const filteredChannels = channels.filter((c) => filterTypes.includes(c.type))

  const selectedChannel = channels.find((c) => c.id === value)

  const channelsByCategory = categories
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((cat) => ({
      category: cat,
      channels: filteredChannels
        .filter((c) => c.parent_id === cat.id)
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
    }))
    .filter((g) => g.channels.length > 0)

  const uncategorized = filteredChannels
    .filter((c) => !c.parent_id)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))

  const searchFilter = (name: string, id: string) =>
    name.toLowerCase().includes(search.toLowerCase()) || id.includes(search)

  const guildIcon = (g: DiscordGuild) =>
    g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=32` : null

  const ChannelIcon = type === "voice" ? Volume2 : type === "text" ? Hash : Folder

  const showingChannels = skipGuildStep || selectedGuild !== null
  const currentGuildName = skipGuildStep
    ? guilds.find((g) => g.id === fixedGuildId)?.name || "Servidor"
    : selectedGuild?.name

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled || !activeToken}
          className={`h-10 w-full justify-between px-3 text-left font-normal bg-background border-input ${
            !selectedChannel ? "text-muted-foreground" : "text-foreground"
          } ${className || ""}`}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <ChannelIcon size={14} className="shrink-0 text-muted-foreground" />
            <span className="truncate text-xs font-medium">
              {selectedChannel ? `#${selectedChannel.name}` : loadingChannels ? "Carregando canais..." : "Selecionar Canal..."}
            </span>
          </div>
          <ChevronsUpDown size={14} className="shrink-0 text-muted-foreground opacity-60 ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 z-[100]" align="start">
        {showingChannels && !skipGuildStep && (
          <div className="flex items-center gap-1.5 border-b border-border/50 px-2 py-1.5 bg-card">
            <Button variant="ghost" size="sm" onClick={handleBack} className="h-6 w-6 p-0">
              <ChevronLeft size={14} />
            </Button>
            <span className="truncate text-xs font-medium text-foreground">{currentGuildName}</span>
          </div>
        )}
        <div className="flex items-center gap-2 border-b border-border/50 px-3 py-2 bg-card">
          <Search size={14} className="shrink-0 text-muted-foreground" />
          <input
            placeholder={showingChannels ? "Buscar canal..." : "Buscar servidor..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground text-foreground"
            autoFocus
          />
        </div>
        <div className="max-h-60 overflow-y-auto p-1 bg-card">
          {!showingChannels && (
            loadingGuilds ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 size={16} className="animate-spin text-muted-foreground" />
              </div>
            ) : guilds.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">Nenhum servidor</p>
            ) : (
              guilds
                .filter((g) => g.name.toLowerCase().includes(search.toLowerCase()) || g.id.includes(search))
                .map((g) => (
                  <button
                    type="button"
                    key={g.id}
                    onClick={() => handleSelectGuild(g)}
                    className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left hover:bg-secondary/60 transition-colors"
                  >
                    <div className="h-6 w-6 shrink-0 rounded-md bg-secondary/60 overflow-hidden flex items-center justify-center">
                      {guildIcon(g) ? (
                        <img src={guildIcon(g)!} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-[10px] font-medium text-muted-foreground">{g.name.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-xs text-foreground font-medium">{g.name}</p>
                    </div>
                  </button>
                ))
            )
          )}

          {showingChannels && (
            loadingChannels ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 size={16} className="animate-spin text-muted-foreground" />
              </div>
            ) : filteredChannels.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">Nenhum canal encontrado</p>
            ) : (
              <>
                {uncategorized.filter((c) => searchFilter(c.name || "", c.id)).map((c) => {
                  const isSelected = c.id === value
                  return (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => handlePickChannel(c.id)}
                      className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left transition-colors ${
                        isSelected ? "bg-primary/15 text-primary" : "hover:bg-secondary/60 text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <ChannelIcon size={14} className="shrink-0 text-muted-foreground" />
                        <span className="truncate text-xs font-medium">{c.name}</span>
                      </div>
                      {isSelected && <Check size={14} className="shrink-0 text-primary" />}
                    </button>
                  )
                })}
                {channelsByCategory.map(({ category, channels: catChannels }) => {
                  const matched = catChannels.filter((c) => searchFilter(c.name || "", c.id))
                  if (matched.length === 0 && search) return null
                  return (
                    <div key={category.id} className="pt-1.5">
                      <p className="px-2 pb-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                        {category.name}
                      </p>
                      {(search ? matched : catChannels).map((c) => {
                        const isSelected = c.id === value
                        return (
                          <button
                            type="button"
                            key={c.id}
                            onClick={() => handlePickChannel(c.id)}
                            className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left transition-colors ${
                              isSelected ? "bg-primary/15 text-primary" : "hover:bg-secondary/60 text-foreground"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <ChannelIcon size={14} className="shrink-0 text-muted-foreground" />
                              <span className="truncate text-xs font-medium">{c.name}</span>
                            </div>
                            {isSelected && <Check size={14} className="shrink-0 text-primary" />}
                          </button>
                        )
                      })}
                    </div>
                  )
                })}
              </>
            )
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
