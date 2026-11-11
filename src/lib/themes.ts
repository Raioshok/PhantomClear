export interface ThemeColors {
  background: string
  foreground: string
  card: string
  cardForeground: string
  popover: string
  popoverForeground: string
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string
  muted: string
  mutedForeground: string
  accent: string
  accentForeground: string
  destructive: string
  destructiveForeground: string
  border: string
  input: string
  ring: string
  sidebar: string
  sidebarForeground: string
  sidebarPrimary: string
  sidebarPrimaryForeground: string
  sidebarAccent: string
  sidebarAccentForeground: string
  sidebarBorder: string
  sidebarRing: string
}

export interface ThemeDefinition {
  id: string
  nome: string
  categoria: 'Cyber & OLED' | 'Aesthetic Dark' | 'Desenvolvedor'
  descricao: string
  previewColors: [string, string, string]
  cores: ThemeColors
  backgroundImage?: string
  backgroundOpacity?: number
  scrollbarTrack?: string
  scrollbarThumb?: string
  scrollbarThumbHover?: string
  cssVars?: Record<string, string>
}

export const TEMAS: ThemeDefinition[] = [
  {
    id: 'padrao',
    nome: 'Phantom Standard',
    categoria: 'Aesthetic Dark',
    descricao: 'Dark slate balanceado para alto contraste e nitidez',
    previewColors: ['#09090b', '#18181b', '#3b82f6'],
    cores: {
      background: '#09090b',
      foreground: '#fafafa',
      card: '#121216',
      cardForeground: '#fafafa',
      popover: '#121216',
      popoverForeground: '#fafafa',
      primary: '#3b82f6',
      primaryForeground: '#ffffff',
      secondary: '#1c1c24',
      secondaryForeground: '#fafafa',
      muted: '#18181b',
      mutedForeground: '#a1a1aa',
      accent: '#27272a',
      accentForeground: '#fafafa',
      destructive: '#ef4444',
      destructiveForeground: '#fafafa',
      border: '#27272a',
      input: '#27272a',
      ring: '#3b82f6',
      sidebar: '#0c0c0f',
      sidebarForeground: '#fafafa',
      sidebarPrimary: '#3b82f6',
      sidebarPrimaryForeground: '#ffffff',
      sidebarAccent: '#18181b',
      sidebarAccentForeground: '#fafafa',
      sidebarBorder: '#27272a',
      sidebarRing: '#3b82f6',
    },
  },
  {
    id: 'phantom-cyber',
    nome: 'Phantom Cyber OLED',
    categoria: 'Cyber & OLED',
    descricao: 'Preto puro OLED com realces de neônio ciano e violeta',
    previewColors: ['#000000', '#0a0a0f', '#06b6d4'],
    cores: {
      background: '#000000',
      foreground: '#f8fafc',
      card: '#08080d',
      cardForeground: '#f8fafc',
      popover: '#08080d',
      popoverForeground: '#f8fafc',
      primary: '#06b6d4',
      primaryForeground: '#000000',
      secondary: '#0f172a',
      secondaryForeground: '#f8fafc',
      muted: '#090d16',
      mutedForeground: '#94a3b8',
      accent: '#8b5cf6',
      accentForeground: '#f8fafc',
      destructive: '#f43f5e',
      destructiveForeground: '#f8fafc',
      border: '#1e293b',
      input: '#1e293b',
      ring: '#06b6d4',
      sidebar: '#020204',
      sidebarForeground: '#f8fafc',
      sidebarPrimary: '#06b6d4',
      sidebarPrimaryForeground: '#000000',
      sidebarAccent: '#0f172a',
      sidebarAccentForeground: '#f8fafc',
      sidebarBorder: '#1e293b',
      sidebarRing: '#06b6d4',
    },
  },
  {
    id: 'tokyo-night',
    nome: 'Tokyo Night',
    categoria: 'Aesthetic Dark',
    descricao: 'Inspirado nas luzes noturnas de Shibuya e Akihabara',
    previewColors: ['#1a1b26', '#24283b', '#7aa2f7'],
    cores: {
      background: '#1a1b26',
      foreground: '#c0caf5',
      card: '#1f2335',
      cardForeground: '#c0caf5',
      popover: '#1f2335',
      popoverForeground: '#c0caf5',
      primary: '#7aa2f7',
      primaryForeground: '#1a1b26',
      secondary: '#292e42',
      secondaryForeground: '#c0caf5',
      muted: '#24283b',
      mutedForeground: '#565f89',
      accent: '#bb9af7',
      accentForeground: '#1a1b26',
      destructive: '#f7768e',
      destructiveForeground: '#c0caf5',
      border: '#292e42',
      input: '#292e42',
      ring: '#7aa2f7',
      sidebar: '#16161e',
      sidebarForeground: '#c0caf5',
      sidebarPrimary: '#7aa2f7',
      sidebarPrimaryForeground: '#1a1b26',
      sidebarAccent: '#24283b',
      sidebarAccentForeground: '#c0caf5',
      sidebarBorder: '#292e42',
      sidebarRing: '#7aa2f7',
    },
  },
  {
    id: 'catppuccin-mocha',
    nome: 'Catppuccin Mocha',
    categoria: 'Aesthetic Dark',
    descricao: 'Paleta suave e elegante de alto renome na comunidade open-source',
    previewColors: ['#1e1e2e', '#181825', '#cba6f7'],
    cores: {
      background: '#1e1e2e',
      foreground: '#cdd6f4',
      card: '#181825',
      cardForeground: '#cdd6f4',
      popover: '#181825',
      popoverForeground: '#cdd6f4',
      primary: '#cba6f7',
      primaryForeground: '#11111b',
      secondary: '#313244',
      secondaryForeground: '#cdd6f4',
      muted: '#313244',
      mutedForeground: '#a6adc8',
      accent: '#89b4fa',
      accentForeground: '#11111b',
      destructive: '#f38ba8',
      destructiveForeground: '#11111b',
      border: '#313244',
      input: '#313244',
      ring: '#cba6f7',
      sidebar: '#11111b',
      sidebarForeground: '#cdd6f4',
      sidebarPrimary: '#cba6f7',
      sidebarPrimaryForeground: '#11111b',
      sidebarAccent: '#181825',
      sidebarAccentForeground: '#cdd6f4',
      sidebarBorder: '#313244',
      sidebarRing: '#cba6f7',
    },
  },
  {
    id: 'nord',
    nome: 'Nord Arctic',
    categoria: 'Desenvolvedor',
    descricao: 'Gélido, minimalista e limpo, inspirado no design ártico nórdico',
    previewColors: ['#2e3440', '#3b4252', '#88c0d0'],
    cores: {
      background: '#2e3440',
      foreground: '#eceff4',
      card: '#3b4252',
      cardForeground: '#eceff4',
      popover: '#3b4252',
      popoverForeground: '#eceff4',
      primary: '#88c0d0',
      primaryForeground: '#2e3440',
      secondary: '#434c5e',
      secondaryForeground: '#eceff4',
      muted: '#434c5e',
      mutedForeground: '#d8dee9',
      accent: '#81a1c1',
      accentForeground: '#2e3440',
      destructive: '#bf616a',
      destructiveForeground: '#eceff4',
      border: '#4c566a',
      input: '#4c566a',
      ring: '#88c0d0',
      sidebar: '#242933',
      sidebarForeground: '#eceff4',
      sidebarPrimary: '#88c0d0',
      sidebarPrimaryForeground: '#2e3440',
      sidebarAccent: '#3b4252',
      sidebarAccentForeground: '#eceff4',
      sidebarBorder: '#434c5e',
      sidebarRing: '#88c0d0',
    },
  },
  {
    id: 'gruvbox',
    nome: 'Gruvbox Retro Dark',
    categoria: 'Desenvolvedor',
    descricao: 'Tons terrosos clássicos e quentes de alto contraste visual',
    previewColors: ['#282828', '#1d2021', '#fe8019'],
    cores: {
      background: '#282828',
      foreground: '#ebdbb2',
      card: '#1d2021',
      cardForeground: '#ebdbb2',
      popover: '#1d2021',
      popoverForeground: '#ebdbb2',
      primary: '#fe8019',
      primaryForeground: '#282828',
      secondary: '#3c3836',
      secondaryForeground: '#ebdbb2',
      muted: '#3c3836',
      mutedForeground: '#a89984',
      accent: '#fabd2f',
      accentForeground: '#282828',
      destructive: '#fb4934',
      destructiveForeground: '#ebdbb2',
      border: '#504945',
      input: '#504945',
      ring: '#fe8019',
      sidebar: '#1d2021',
      sidebarForeground: '#ebdbb2',
      sidebarPrimary: '#fe8019',
      sidebarPrimaryForeground: '#282828',
      sidebarAccent: '#32302f',
      sidebarAccentForeground: '#ebdbb2',
      sidebarBorder: '#504945',
      sidebarRing: '#fe8019',
    },
  },
  {
    id: 'midnight-emerald',
    nome: 'Midnight Emerald',
    categoria: 'Aesthetic Dark',
    descricao: 'Verde esmeralda profundo sobre fundo preto carvão',
    previewColors: ['#061a14', '#0d281e', '#10b981'],
    cores: {
      background: '#04130e',
      foreground: '#ecfdf5',
      card: '#082017',
      cardForeground: '#ecfdf5',
      popover: '#082017',
      popoverForeground: '#ecfdf5',
      primary: '#10b981',
      primaryForeground: '#04130e',
      secondary: '#0f3325',
      secondaryForeground: '#ecfdf5',
      muted: '#0d2b20',
      mutedForeground: '#6ee7b7',
      accent: '#34d399',
      accentForeground: '#04130e',
      destructive: '#f43f5e',
      destructiveForeground: '#ecfdf5',
      border: '#134e38',
      input: '#134e38',
      ring: '#10b981',
      sidebar: '#030d0a',
      sidebarForeground: '#ecfdf5',
      sidebarPrimary: '#10b981',
      sidebarPrimaryForeground: '#04130e',
      sidebarAccent: '#082017',
      sidebarAccentForeground: '#ecfdf5',
      sidebarBorder: '#134e38',
      sidebarRing: '#10b981',
    },
  },
  {
    id: 'rose-pine',
    nome: 'Rosé Pine',
    categoria: 'Aesthetic Dark',
    descricao: 'Estética lo-fi sutil com tons de pinheiro, vinho e lavanda',
    previewColors: ['#191724', '#1f1d2e', '#ebbcba'],
    cores: {
      background: '#191724',
      foreground: '#e0def4',
      card: '#1f1d2e',
      cardForeground: '#e0def4',
      popover: '#1f1d2e',
      popoverForeground: '#e0def4',
      primary: '#ebbcba',
      primaryForeground: '#191724',
      secondary: '#26233a',
      secondaryForeground: '#e0def4',
      muted: '#26233a',
      mutedForeground: '#908caa',
      accent: '#c4a7e7',
      accentForeground: '#191724',
      destructive: '#eb6f92',
      destructiveForeground: '#e0def4',
      border: '#2a283e',
      input: '#2a283e',
      ring: '#ebbcba',
      sidebar: '#14121e',
      sidebarForeground: '#e0def4',
      sidebarPrimary: '#ebbcba',
      sidebarPrimaryForeground: '#191724',
      sidebarAccent: '#1f1d2e',
      sidebarAccentForeground: '#e0def4',
      sidebarBorder: '#2a283e',
      sidebarRing: '#ebbcba',
    },
  },
  {
    id: 'obsidian-abyss',
    nome: 'Obsidian Abyss (OLED 0%)',
    categoria: 'Cyber & OLED',
    descricao: 'Construído especificamente para telas OLED (#000000 absoluto)',
    previewColors: ['#000000', '#0a0a0a', '#ffffff'],
    cores: {
      background: '#000000',
      foreground: '#ffffff',
      card: '#080808',
      cardForeground: '#ffffff',
      popover: '#080808',
      popoverForeground: '#ffffff',
      primary: '#ffffff',
      primaryForeground: '#000000',
      secondary: '#141414',
      secondaryForeground: '#ffffff',
      muted: '#121212',
      mutedForeground: '#888888',
      accent: '#262626',
      accentForeground: '#ffffff',
      destructive: '#ff4444',
      destructiveForeground: '#ffffff',
      border: '#1f1f1f',
      input: '#1f1f1f',
      ring: '#ffffff',
      sidebar: '#000000',
      sidebarForeground: '#ffffff',
      sidebarPrimary: '#ffffff',
      sidebarPrimaryForeground: '#000000',
      sidebarAccent: '#0d0d0d',
      sidebarAccentForeground: '#ffffff',
      sidebarBorder: '#1c1c1c',
      sidebarRing: '#ffffff',
    },
  },
  {
    id: 'synthwave',
    nome: 'Synthwave 1984',
    categoria: 'Cyber & OLED',
    descricao: 'Gradientes de neon fúcsia e ciano inspirados no retrowave dos anos 80',
    previewColors: ['#261447', '#2b1b54', '#ff7edb'],
    cores: {
      background: '#1d1135',
      foreground: '#f9f871',
      card: '#271649',
      cardForeground: '#f9f871',
      popover: '#271649',
      popoverForeground: '#f9f871',
      primary: '#ff7edb',
      primaryForeground: '#1d1135',
      secondary: '#361d5f',
      secondaryForeground: '#f9f871',
      muted: '#361d5f',
      mutedForeground: '#b89ad9',
      accent: '#03edf9',
      accentForeground: '#1d1135',
      destructive: '#fe4450',
      destructiveForeground: '#ffffff',
      border: '#452377',
      input: '#452377',
      ring: '#ff7edb',
      sidebar: '#170c2d',
      sidebarForeground: '#f9f871',
      sidebarPrimary: '#ff7edb',
      sidebarPrimaryForeground: '#1d1135',
      sidebarAccent: '#271649',
      sidebarAccentForeground: '#f9f871',
      sidebarBorder: '#452377',
      sidebarRing: '#ff7edb',
    },
  },
  {
    id: 'blood-moon',
    nome: 'Blood Moon Crimson',
    categoria: 'Cyber & OLED',
    descricao: 'Vermelho escarlate violento e preto grafite',
    previewColors: ['#0f0507', '#1a080c', '#e11d48'],
    cores: {
      background: '#0a0305',
      foreground: '#ffe4e6',
      card: '#140609',
      cardForeground: '#ffe4e6',
      popover: '#140609',
      popoverForeground: '#ffe4e6',
      primary: '#e11d48',
      primaryForeground: '#ffffff',
      secondary: '#260a11',
      secondaryForeground: '#ffe4e6',
      muted: '#20080e',
      mutedForeground: '#fda4af',
      accent: '#be123c',
      accentForeground: '#ffffff',
      destructive: '#ff0000',
      destructiveForeground: '#ffffff',
      border: '#380e19',
      input: '#380e19',
      ring: '#e11d48',
      sidebar: '#080204',
      sidebarForeground: '#ffe4e6',
      sidebarPrimary: '#e11d48',
      sidebarPrimaryForeground: '#ffffff',
      sidebarAccent: '#140609',
      sidebarAccentForeground: '#ffe4e6',
      sidebarBorder: '#380e19',
      sidebarRing: '#e11d48',
    },
  },
  {
    id: 'dracula',
    nome: 'Dracula Pro',
    categoria: 'Desenvolvedor',
    descricao: 'O tema gótico roxo e ciano mais venerado por programadores',
    previewColors: ['#282a36', '#44475a', '#bd93f9'],
    cores: {
      background: '#282a36',
      foreground: '#f8f8f2',
      card: '#343746',
      cardForeground: '#f8f8f2',
      popover: '#343746',
      popoverForeground: '#f8f8f2',
      primary: '#bd93f9',
      primaryForeground: '#282a36',
      secondary: '#44475a',
      secondaryForeground: '#f8f8f2',
      muted: '#44475a',
      mutedForeground: '#6272a4',
      accent: '#ff79c6',
      accentForeground: '#282a36',
      destructive: '#ff5555',
      destructiveForeground: '#f8f8f2',
      border: '#6272a4',
      input: '#44475a',
      ring: '#bd93f9',
      sidebar: '#21222c',
      sidebarForeground: '#f8f8f2',
      sidebarPrimary: '#bd93f9',
      sidebarPrimaryForeground: '#282a36',
      sidebarAccent: '#343746',
      sidebarAccentForeground: '#f8f8f2',
      sidebarBorder: '#44475a',
      sidebarRing: '#bd93f9',
    },
  },
  {
    id: 'one-dark-pro',
    nome: 'One Dark Pro',
    categoria: 'Desenvolvedor',
    descricao: 'O clássico de alto contraste criado pelo time do Atom',
    previewColors: ['#21252b', '#282c34', '#61afef'],
    cores: {
      background: '#21252b',
      foreground: '#abb2bf',
      card: '#282c34',
      cardForeground: '#abb2bf',
      popover: '#282c34',
      popoverForeground: '#abb2bf',
      primary: '#61afef',
      primaryForeground: '#21252b',
      secondary: '#2c313a',
      secondaryForeground: '#abb2bf',
      muted: '#2c313a',
      mutedForeground: '#5c6370',
      accent: '#98c379',
      accentForeground: '#21252b',
      destructive: '#e06c75',
      destructiveForeground: '#ffffff',
      border: '#3b4048',
      input: '#3b4048',
      ring: '#61afef',
      sidebar: '#1b1d23',
      sidebarForeground: '#abb2bf',
      sidebarPrimary: '#61afef',
      sidebarPrimaryForeground: '#21252b',
      sidebarAccent: '#282c34',
      sidebarAccentForeground: '#abb2bf',
      sidebarBorder: '#3b4048',
      sidebarRing: '#61afef',
    },
  },
  {
    id: 'monokai-pro',
    nome: 'Monokai Pro',
    categoria: 'Desenvolvedor',
    descricao: 'Tons vibrantes e amarelados com fundo carvão calibrado',
    previewColors: ['#221f22', '#2d2a2e', '#ffd866'],
    cores: {
      background: '#221f22',
      foreground: '#fcfcfa',
      card: '#2d2a2e',
      cardForeground: '#fcfcfa',
      popover: '#2d2a2e',
      popoverForeground: '#fcfcfa',
      primary: '#ffd866',
      primaryForeground: '#221f22',
      secondary: '#403e41',
      secondaryForeground: '#fcfcfa',
      muted: '#403e41',
      mutedForeground: '#727072',
      accent: '#a9dc76',
      accentForeground: '#221f22',
      destructive: '#ff6188',
      destructiveForeground: '#ffffff',
      border: '#4a474a',
      input: '#4a474a',
      ring: '#ffd866',
      sidebar: '#19181a',
      sidebarForeground: '#fcfcfa',
      sidebarPrimary: '#ffd866',
      sidebarPrimaryForeground: '#221f22',
      sidebarAccent: '#2d2a2e',
      sidebarAccentForeground: '#fcfcfa',
      sidebarBorder: '#4a474a',
      sidebarRing: '#ffd866',
    },
  },
  {
    id: 'cyberpunk',
    nome: 'Night City Cyberpunk',
    categoria: 'Cyber & OLED',
    descricao: 'Amarelo radioativo, preto escuro e toques de azul elétrico',
    previewColors: ['#0d0d12', '#151520', '#fcee0a'],
    cores: {
      background: '#0d0d12',
      foreground: '#fcee0a',
      card: '#161622',
      cardForeground: '#fcee0a',
      popover: '#161622',
      popoverForeground: '#fcee0a',
      primary: '#fcee0a',
      primaryForeground: '#0d0d12',
      secondary: '#222235',
      secondaryForeground: '#fcee0a',
      muted: '#222235',
      mutedForeground: '#00f0ff',
      accent: '#00f0ff',
      accentForeground: '#0d0d12',
      destructive: '#ff003c',
      destructiveForeground: '#ffffff',
      border: '#2a2a40',
      input: '#2a2a40',
      ring: '#fcee0a',
      sidebar: '#0a0a0e',
      sidebarForeground: '#fcee0a',
      sidebarPrimary: '#fcee0a',
      sidebarPrimaryForeground: '#0d0d12',
      sidebarAccent: '#161622',
      sidebarAccentForeground: '#fcee0a',
      sidebarBorder: '#2a2a40',
      sidebarRing: '#fcee0a',
    },
  },
]

export function getTema(id: string): ThemeDefinition | undefined {
  if (id === 'custom') {
    return {
      id: 'custom',
      nome: 'Cor Personalizada',
      categoria: 'Aesthetic Dark',
      descricao: 'Destaque e acentos customizados definidos por você',
      previewColors: ['#09090b', '#18181b', '#3b82f6'],
      cores: { ...TEMAS[0].cores },
    }
  }
  return TEMAS.find((t) => t.id === id)
}

export function aplicarTema(tema: ThemeDefinition) {
  const root = document.documentElement
  root.dataset.tema = tema.id

  const c = tema.cores
  root.style.setProperty('--background', c.background)
  root.style.setProperty('--foreground', c.foreground)
  root.style.setProperty('--card', c.card)
  root.style.setProperty('--card-foreground', c.cardForeground)
  root.style.setProperty('--popover', c.popover)
  root.style.setProperty('--popover-foreground', c.popoverForeground)
  root.style.setProperty('--primary', c.primary)
  root.style.setProperty('--primary-foreground', c.primaryForeground)
  root.style.setProperty('--secondary', c.secondary)
  root.style.setProperty('--secondary-foreground', c.secondaryForeground)
  root.style.setProperty('--muted', c.muted)
  root.style.setProperty('--muted-foreground', c.mutedForeground)
  root.style.setProperty('--accent', c.accent)
  root.style.setProperty('--accent-foreground', c.accentForeground)
  root.style.setProperty('--destructive', c.destructive)
  root.style.setProperty('--destructive-foreground', c.destructiveForeground)
  root.style.setProperty('--border', c.border)
  root.style.setProperty('--input', c.input)
  root.style.setProperty('--ring', c.ring)
  root.style.setProperty('--sidebar', c.sidebar)
  root.style.setProperty('--sidebar-foreground', c.sidebarForeground)
  root.style.setProperty('--sidebar-primary', c.sidebarPrimary)
  root.style.setProperty('--sidebar-primary-foreground', c.sidebarPrimaryForeground)
  root.style.setProperty('--sidebar-accent', c.sidebarAccent)
  root.style.setProperty('--sidebar-accent-foreground', c.sidebarAccentForeground)
  root.style.setProperty('--sidebar-border', c.sidebarBorder)
  root.style.setProperty('--sidebar-ring', c.sidebarRing)
}

export function aplicarCorPainel(corHex: string) {
  const root = document.documentElement
  root.style.setProperty('--primary', corHex)
  root.style.setProperty('--ring', corHex)
  root.style.setProperty('--sidebar-primary', corHex)
}

export function resetarTema() {
  const padrao = TEMAS[0]
  aplicarTema(padrao)
}
