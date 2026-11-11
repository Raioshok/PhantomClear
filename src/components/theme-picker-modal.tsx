import { useState, useRef } from 'react'
import { Check, ChevronRight, Palette, Search, Sparkles, X, Paintbrush } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { TEMAS, getTema, type ThemeDefinition } from '@/lib/themes'
import { ColorPicker } from '@/components/ui/color-picker'

const COLOR_PRESETS = ['#3b82f6', '#06b6d4', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#ffffff']

interface ThemePickerModalProps {
  tema: string
  corPainel: string
  onSelectTema: (temaId: string) => void
  onSelectCor: (cor: string) => void
}

function Swatches({ colors }: { colors: string[] }) {
  return (
    <div className="flex items-center gap-1.5" aria-hidden="true">
      {colors.map((color, idx) => (
        <span
          key={idx}
          className="h-3.5 w-3.5 rounded-full border border-black/40 shadow-sm"
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  )
}

function MiniPreview({ theme, cor }: { theme?: ThemeDefinition; cor?: string }) {
  const primary = cor ?? theme?.cores.primary ?? '#3b82f6'
  const background = theme?.cores.background ?? '#09090b'
  const card = theme?.cores.card ?? '#121216'
  const border = theme?.cores.border ?? '#27272a'

  return (
    <div
      className="relative h-20 w-full overflow-hidden rounded-xl border p-2 flex flex-col justify-between"
      style={{ backgroundColor: background, borderColor: border }}
    >
      <div className="flex items-center justify-between">
        <span className="h-2 w-8 rounded-full" style={{ backgroundColor: primary }} />
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: border }} />
      </div>
      <div className="space-y-1.5">
        <div className="h-6 w-full rounded-lg border p-1 flex items-center justify-between" style={{ backgroundColor: card, borderColor: border }}>
          <span className="h-1.5 w-12 rounded-full opacity-60" style={{ backgroundColor: theme?.cores.foreground ?? '#fafafa' }} />
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: primary }} />
        </div>
        <div className="flex gap-1">
          <span className="h-1.5 w-1/3 rounded-full" style={{ backgroundColor: border }} />
          <span className="h-1.5 w-1/4 rounded-full" style={{ backgroundColor: border }} />
        </div>
      </div>
    </div>
  )
}

export function ThemePickerModal({ tema, corPainel, onSelectTema, onSelectCor }: ThemePickerModalProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('Todos')
  const [hexDraft, setHexDraft] = useState(corPainel)
  const searchRef = useRef<HTMLInputElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const activeTheme = getTema(tema)
  const currentLabel = tema === 'custom' ? 'Cor Personalizada' : activeTheme?.nome ?? 'Phantom Standard'

  const visibleThemes = TEMAS.filter((theme) => {
    const matchesFilter = filter === 'Todos' || theme.categoria === filter
    const matchesQuery = !query || `${theme.nome} ${theme.descricao} ${theme.categoria}`.toLowerCase().includes(query.toLowerCase())
    return matchesFilter && matchesQuery
  })

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="w-full flex items-center justify-between rounded-xl border border-border bg-card/60 p-4 transition-all hover:border-primary/40 hover:bg-card/80 text-left"
        onClick={() => {
          setQuery('')
          setFilter('Todos')
          setOpen(true)
        }}
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-12 shrink-0">
            <MiniPreview theme={activeTheme} cor={tema === 'custom' ? corPainel : undefined} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Tema Selecionado</span>
            <h4 className="text-sm font-bold text-foreground">{currentLabel}</h4>
            <p className="text-xs text-muted-foreground">{activeTheme?.descricao ?? 'Personalizado por você'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-primary">
          <Palette size={16} />
          <span>Galeria de Temas ({TEMAS.length})</span>
          <ChevronRight size={16} className="text-muted-foreground" />
        </div>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-w-4xl max-h-[85vh] flex flex-col p-0 overflow-hidden border border-border/80 bg-background/95 backdrop-blur-xl shadow-2xl rounded-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/80 p-5 bg-card/30">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Palette size={20} />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Customização PhantomClear</span>
                <DialogTitle className="text-lg font-bold text-foreground">Galeria de Temas Profissionais</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {TEMAS.length} temas calibrados para desenvolvedores e displays OLED.
                </DialogDescription>
              </div>
            </div>

            <button
              type="button"
              className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              onClick={() => setOpen(false)}
            >
              <X size={18} />
            </button>
          </div>

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-b border-border/60 bg-card/20">
            <div className="relative w-full sm:w-72">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar tema ou cor..."
                className="w-full rounded-xl border border-border bg-secondary/40 pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {['Todos', 'Cyber & OLED', 'Aesthetic Dark', 'Desenvolvedor'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilter(cat)}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all whitespace-nowrap ${
                    filter === cat
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grid Scroll */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {visibleThemes.map((th) => {
                const isSelected = tema === th.id
                return (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => onSelectTema(th.id)}
                    className={`group relative flex flex-col rounded-2xl border p-4 text-left transition-all hover:scale-[1.01] ${
                      isSelected
                        ? 'border-primary ring-2 ring-primary/30 bg-primary/5'
                        : 'border-border/80 bg-card/40 hover:border-border hover:bg-card/70'
                    }`}
                  >
                    <div className="mb-3">
                      <MiniPreview theme={th} />
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                            {th.nome}
                          </h4>
                        </div>
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                          {th.categoria}
                        </span>
                      </div>

                      {isSelected ? (
                        <span className="flex items-center gap-1 rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
                          <Check size={12} /> Ativo
                        </span>
                      ) : (
                        <Swatches colors={th.previewColors} />
                      )}
                    </div>

                    <p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {th.descricao}
                    </p>
                  </button>
                )
              })}

              {/* Custom Theme Card */}
              <button
                type="button"
                onClick={() => onSelectTema('custom')}
                className={`group relative flex flex-col rounded-2xl border p-4 text-left transition-all hover:scale-[1.01] ${
                  tema === 'custom'
                    ? 'border-primary ring-2 ring-primary/30 bg-primary/5'
                    : 'border-border/80 bg-card/40 hover:border-border hover:bg-card/70'
                }`}
              >
                <div className="mb-3 relative h-20 w-full overflow-hidden rounded-xl border border-dashed border-primary/40 p-2 flex items-center justify-center bg-card">
                  <div className="flex items-center gap-2">
                    <Paintbrush size={24} className="text-primary animate-pulse" />
                    <span className="text-xs font-mono font-bold text-primary">{corPainel}</span>
                  </div>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      Cor Personalizada
                    </h4>
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Seu Próprio Destaque
                    </span>
                  </div>
                  {tema === 'custom' && (
                    <span className="flex items-center gap-1 rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
                      <Check size={12} /> Ativo
                    </span>
                  )}
                </div>

                <p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  Defina um código hexadecimal exclusivo para botões, bordas e acentos.
                </p>
              </button>
            </div>

            {/* Custom Color Editor if 'custom' is active */}
            {tema === 'custom' && (
              <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">Paleta Personalizada</span>
                  <p className="text-xs text-muted-foreground">Escolha um tom pré-definido ou digite o valor HEX:</p>
                  <div className="flex items-center gap-2 pt-2">
                    {COLOR_PRESETS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => onSelectCor(color)}
                        className={`h-6 w-6 rounded-full border border-black/40 shadow-sm transition-transform hover:scale-110 ${
                          corPainel.toLowerCase() === color.toLowerCase() ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-xs font-mono font-bold text-foreground">
                    HEX:
                    <input
                      value={hexDraft}
                      maxLength={7}
                      onChange={(e) => {
                        const val = e.target.value
                        setHexDraft(val)
                        if (/^#[0-9a-f]{6}$/i.test(val)) onSelectCor(val)
                      }}
                      className="ml-2 w-24 rounded-lg border border-border bg-secondary px-2.5 py-1 text-xs font-mono text-foreground focus:border-primary focus:outline-none"
                    />
                  </label>
                  <ColorPicker value={corPainel} onChange={onSelectCor} onChangeEnd={onSelectCor} />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border/80 p-4 bg-card/40">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Sparkles size={14} className="text-primary" />
              As cores são aplicadas instantaneamente em todas as abas.
            </span>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-md cursor-pointer"
            >
              Concluir Seleção
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
