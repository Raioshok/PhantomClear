# PhantomClear V2 — Badges Collector UI/UX Specification & Component Architecture

**Module:** `/badges` (Alias: `/insignias`)  
**Version:** 2.0.0-PROD  
**Target Platform:** Electron + React 19 + Tailwind CSS v4 + Radix UI + Lucide React + GSAP  
**Status:** Architecture & UI/UX Ready for Implementation  

---

## 1. Executive Summary & Design System

### 1.1 Product Vision
The **Badges Collector** tab transforms Discord badge acquisition, profile embellishment, and telemetry exploitation into an immersive, cyber-dark command center. It unifies one-click automated actions (HypeSquad house swapping, automated Discord quest completion, Active Developer activation, connected accounts management, and `/science` game activity hours injection) with a real-time reactive Discord profile simulator.

### 1.2 Design Language: Cyber Dark HUD
- **Canvas Substrate:** Deep Obsidian (`#08080b`), Card Shell (`#0e0e14`), Elevated Float (`#14141c`).
- **Precision Borders:** 1px hairline borders (`border-[#1d1e2a]` with hover state `hover:border-primary/40`).
- **Cyber Accent Tokens:**
  - `neon-green` (`#00cc6a`): Verified badges, Active Developer, Claimed state, High success indicators.
  - `cyber-cyan` (`#00e5ff`): Balance House, Telemetry in-flight, Quests, Orbs, Websocket telemetry pulses.
  - `hyper-purple` (`#9d4edd`): Bravery House, Nitro boost tier milestones, High-tier prestige.
  - `solar-coral` (`#f97316` / `#fb7185`): Brilliance House, Alerts, Mission expiry timers.
  - `molten-amber` (`#f59e0b`): Legendary / Claimable ready status, Milestone highlights.
  - `dimmed-slate` (`#64748b`): Locked / Legacy badges, unobtainable archives.
- **Typography:**
  - Headlines & Labels: `Geist Sans` with wide tracking (`tracking-tight` / `tracking-wider`).
  - Metrics, Timers, Telemetry & IDs: `Geist Mono` (`font-mono text-xs`).

---

## 2. Information Architecture & Navigation

### 2.1 Route & Sidebar Integration
- **Path:** `/badges` (with secondary redirect from `/insignias`).
- **Sidebar Placement:** Located in the **"Automação & Snipers"** section or dedicated **"Coleção & Perfil"** group in `src/components/layout/sidebar.tsx`:
  ```tsx
  {
    titulo: "Badges Collector",
    icone: <Award size={16} className="text-[#00e5ff]" />,
    href: "/badges"
  }
  ```
- **Command Palette Entry (`command-palette.tsx`):**
  ```tsx
  {
    label: "Badges Collector (Insignias)",
    href: "/badges",
    icon: Award,
    keywords: ["badges", "insignias", "hypesquad", "developer", "quest", "farm", "perfil"]
  }
  ```

---

## 3. The 4 Badge Lifecycle States

| State | Visual Treatment | Trigger / Criteria | User Actions Available |
| :--- | :--- | :--- | :--- |
| **`OWNED`** | • Glowing emerald/neon border<br>• Full opacity icon<br>• "Equipado / Possuído" neon chip<br>• Soft scanline aura | Flag present in `public_flags` bitmask or verified in Discord API | • View badge lore / metadata<br>• Toggle profile display (if connection)<br>• Switch house (if HypeSquad) |
| **`CLAIMABLE`** | • Pulsing cyan/gold cyber glow<br>• High-contrast "1-Click Claim" button<br>• Micro-badge "PRONTO" | Prerequisites satisfied or instant automated action available | • 1-Click Activate / Resgatar<br>• Switch House instantly<br>• Auto-Farm Quests |
| **`IN_PROGRESS`**| • Animated diagonal cyber-stripes<br>• Real-time numeric progress bar (`%` or `X/Y`)<br>• Live telemetry ping indicator | Active Task running in `taskManager` (`/science` heartbeat, streaming) | • Pause / Abort task<br>• View live telemetry log<br>• Adjust telemetry speed |
| **`LOCKED`** | • Dimmed grayscale (40% opacity)<br>• Subtle padlock icon (`Lock` from Lucide)<br>• Dark slate border | Legacy / Unobtainable (e.g. Early Supporter) or requires manual work | • Open Lore / Walkthrough guide<br>• External eligibility checklist |

---

## 4. Comprehensive Badge Catalog Taxonomy

### 4.1 HypeSquad Houses (Instant 1-Click Switcher)
1. **HypeSquad Bravery (Casa 1)**
   - Bitmask Flag: `64` (`1 << 6`)
   - Official SVG: `https://ik.imagekit.io/xys3wb0qo/hypesquadbravery.svg`
   - CDN PNG: `https://cdn.discordapp.com/badge-icons/8a88d63823d8a71cd5e390baa45efa02.png`
   - Accent: Purple (`#9d4edd`)
   - Action: 1-Click Switch (`POST /badge-collector/hypesquad { houseId: 1 }`).
2. **HypeSquad Brilliance (Casa 2)**
   - Bitmask Flag: `128` (`1 << 7`)
   - Official SVG: `https://ik.imagekit.io/xys3wb0qo/hypesquadbrilliance.svg`
   - CDN PNG: `https://cdn.discordapp.com/badge-icons/011940fd013da3f7fb926e4a1cd2e618.png`
   - Accent: Coral/Orange (`#f97316`)
   - Action: 1-Click Switch (`POST /badge-collector/hypesquad { houseId: 2 }`).
3. **HypeSquad Balance (Casa 3)**
   - Bitmask Flag: `256` (`1 << 8`)
   - Official SVG: `https://ik.imagekit.io/xys3wb0qo/hypesquadbalance.svg`
   - CDN PNG: `https://cdn.discordapp.com/badge-icons/3aa41de486fa12454c3761e8e223442e.png`
   - Accent: Turquoise/Cyan (`#00e5ff`)
   - Action: 1-Click Switch (`POST /badge-collector/hypesquad { houseId: 3 }`).

### 4.2 Developer & Innovation Badges
1. **Active Developer**
   - Bitmask Flag: `4194304` (`1 << 22`)
   - Official SVG: `https://ik.imagekit.io/xys3wb0qo/activedeveloper.svg`
   - CDN PNG: `https://cdn.discordapp.com/badge-icons/6bd8e66ba6b0026a59e67304099382c7.png`
   - State: `CLAIMABLE` (via automated activator) or `OWNED`.
   - Action: Automated slash command execution + Direct Portal Link (`https://discord.com/developers/active-developer`).
2. **Early Verified Bot Developer**
   - Bitmask Flag: `131072` (`1 << 17`)
   - Official SVG: `https://ik.imagekit.io/xys3wb0qo/discordbotdev.svg`
   - State: `LOCKED` (Legacy closed on August 19, 2020).

### 4.3 Quest & Rewards Badges
1. **Quest Champion (Missão Concluída)**
   - CDN Icon: `https://cdn.discordapp.com/badge-icons/7d9ae358c8c5e118768335dbe68b4fb8.png`
   - State: `CLAIMABLE` / `IN_PROGRESS` / `OWNED`.
   - Action: Bridge with `api.startQuestFarmer()`. Emulates 15-minute desktop streaming heartbeat and claims Discord Orbs/Badge.

### 4.4 Activity & Gaming Hours Milestones (BadgeFarmer /science Telemetry)
1. **Playtime Veteran (100h / 500h / 1.000h / 5.000h Eternal)**
   - Icon: Gamepad activity SVG with dynamic tier badge (`1120042457007792168.webp`).
   - State: `IN_PROGRESS` or `CLAIMABLE`.
   - Action: Telemetry injector injecting simulated chunks into `POST /science` with verified game IDs (Valorant, Fortnite, Genshin Impact, GTA V, Roblox, Minecraft, Honkai: Star Rail).
2. **Universalist (100 Distinct Games)**
   - State: `IN_PROGRESS` or `CLAIMABLE`.
   - Action: 1-click batch runner launching synthetic 2-minute focused game heartbeats across 100 Discord-detectable catalog executables.
3. **Stream Legend (Elite VoIP Broadcaster)**
   - State: `CLAIMABLE` via call stream simulator.

### 4.5 Connected Account Badges
- Services: GitHub, Steam, PlayStation Network, Xbox Live, Battle.net, Riot Games, Spotify, Twitch, YouTube, Epic Games, Reddit, TikTok, Crunchyroll.
- Management: Real-time query via `GET /users/@me/connections`, with toggles for `visibility: 1` (`showOnProfile`).

### 4.6 Legacy & Discord Prestige Badges
- **Discord Staff** (`flag: 1`): `discordstaff.svg`
- **Discord Partner** (`flag: 2`): `discordpartner.svg`
- **HypeSquad Events Coordinator** (`flag: 4`): `hypesquadevents.svg`
- **Bug Hunter Level 1** (`flag: 8`): `discordbughunter1.svg`
- **Bug Hunter Level 2** (`flag: 16384`): `discordbughunter2.svg`
- **Early Supporter** (`flag: 512`): `discordearlysupporter.svg`
- **Certified Moderator Alumni** (`flag: 262144`): `discordmod.svg`
- Visual: Locked cyber frame with tooltip explaining history and requirements.

---

## 5. Screen Layout & Component Wireframe (Cyber Dark HUD)

```
+---------------------------------------------------------------------------------------------------------------+
| BREADCRUMB: PhantomClear V2 > Automação > Badges Collector                               [Conta: Raio#0001 v] |
+---------------------------------------------------------------------------------------------------------------+
| [HUD SUMMARY BAR]                                                                                             |
|  * Badges Possuídas: 7 / 28 (25%)  |  * Resgatáveis Agora: 3  |  * Horas Injetadas: 1.420h  |  * Quests: 2 Ativas |
+---------------------------------------------------------------------------------------+-----------------------+
| LEFT PANE: CATALOG & COLLECTOR CONTROL DECK (Cols 1-8)                                | RIGHT PANE (Cols 9-12)|
|                                                                                       | STICKY LIVE PREVIEW   |
| [1-CLICK COLLECTOR QUICK ACTIONS]                                                     |                       |
| +-----------------------------------------------------------------------------------+ | +-------------------+ |
| | HypeSquad Switcher Deck:                                                          | | | DISCORD PROFILE   | |
| | [ (1) Bravery ]    [ (2) Brilliance ]    [ (3) Balance ]    [ (X) Sair da Casa ]  | | | CARD MOCKUP       | |
| +-----------------------------------------------------------------------------------+ | |                   | |
| | Quick Automation Banners:                                                         | | | [Banner Dark]     | |
| | [ > Injetar Horas de Jogo ]  [ > Ativar Active Dev ]  [ > Auto-Farmar Quests ]    | | | (Avatar)          | |
| +-----------------------------------------------------------------------------------+ | | Raio              | |
|                                                                                       | | @raioshok         | |
| [SEARCH & FILTER CONTROL BAR]                                                         | |                   | |
| [ Search input: "Filtrar por nome, jogo ou flag..."                ] [ Filtro V ]    | | [BADGES TRAY]     | |
| [ Tabs: [Todas (28)] [Possuídas (7)] [Resgatáveis (3)] [Em Progresso (1)] [Bloq] ]    | | [B1][B2][B3][B4]  | |
| [ Categories: [Todas] [HypeSquad] [Atividade] [Developer] [Quests] [Conexões] ]       | |                   | |
|                                                                                       | | Status: Farmando  | |
| [BADGE CARDS VIRTUAL GRID - 3 Columns]                                                | | 5.000h Valorant   | |
| +-------------------+  +-------------------+  +-------------------+                   | |                   | |
| | [ICON] Bravery    |  | [ICON] Active Dev |  | [ICON] Playtime   |                   | | CONEXÕES VINCUL.  | |
| | HypeSquad Casa 1  |  | Dev Ativo Discord |  | 5.000h Eternal    |                   | | (GH) (Steam) (PSN)| |
| | STATUS: POSSUÍDO  |  | STATUS: RESGATAR  |  | STATUS: 42% PROG  |                   | +-------------------+ |
| | [ Equipado  v ]   |  | [ Ativar 1-Click] |  | [ || Pausar Farm] |                   |                       |
| +-------------------+  +-------------------+  +-------------------+                   | [TELEMETRY MONITOR]   |
| +-------------------+  +-------------------+  +-------------------+                   | Live WebSocket Stream |
| | [ICON] Quest Champ|  | [ICON] Balance    |  | [ICON] Early Sup  |                   | Beat: #142 (24h chunk)|
| | Missão Orbs       |  | HypeSquad Casa 3  |  | Assinante < 2018  |                   | Status: Science OK    |
| | STATUS: PRONTO    |  | STATUS: DISPONÍVEL|  | STATUS: BLOQUEADO |                   | Target: Valorant.exe  |
| | [ Auto-Completar] |  | [ Trocar p/ Casa] |  | [ Ver Detalhes ]  |                   +-----------------------+
| +-------------------+  +-------------------+  +-------------------+                                           |
+---------------------------------------------------------------------------------------------------------------+
```

---

## 6. Component Architecture & Props Specification

```
src/app/(dashboard)/badges/
├── page.tsx                           # Main Route Controller & Tab Container
├── hooks/
│   └── use-badge-collector.ts         # Custom Hook: State, Polling, WebSocket & Optimistic UI
└── components/
    ├── badge-hud-stats.tsx            # Header HUD Cards (Total Owned, Claimable, Farm Time)
    ├── discord-profile-preview.tsx    # Live Interactive Discord Card Mockup
    ├── hypesquad-switcher-deck.tsx    # Dedicated 3-House Switcher with Sigil Visuals
    ├── badge-filters.tsx              # Search input, status tabs & category chips
    ├── badge-grid.tsx                 # Responsive Grid Container
    ├── badge-card.tsx                 # Cyber Dark Card Component with Glow & State Badges
    ├── playtime-injector-dialog.tsx   # Modal for /science Game Playtime Injection
    ├── active-dev-wizard-dialog.tsx   # Wizard Modal for Active Developer Badge
    ├── connected-accounts-dialog.tsx  # Manager for Discord Connected Accounts Visibility
    └── badge-details-dialog.tsx       # Lore & Walkthrough for Locked Badges
```

### 6.1 `useBadgeCollector` Hook Specification
```typescript
interface UseBadgeCollectorReturn {
  // State
  profile: BadgeProfileData | null
  loading: boolean
  error: string | null
  activeTaskId: string | null
  farmingProgress: { done: number; total: number; message?: string } | null
  filterState: 'all' | 'owned' | 'claimable' | 'in_progress' | 'locked'
  categoryFilter: string
  searchQuery: string

  // Setters
  setFilterState: (s: 'all' | 'owned' | 'claimable' | 'in_progress' | 'locked') => void
  setCategoryFilter: (c: string) => void
  setSearchQuery: (q: string) => void

  // Actions
  switchHypeSquad: (houseId: 1 | 2 | 3) => Promise<void>
  leaveHypeSquad: () => Promise<void>
  triggerQuestAutoFarm: () => Promise<void>
  injectGameHours: (hours: number, gameId?: string) => Promise<void>
  injectVarietyGames: () => Promise<void>
  abortActiveTask: () => Promise<void>
  toggleConnectionVisibility: (type: string, show: boolean) => Promise<void>
  refresh: () => Promise<void>
}
```

### 6.2 Component Props & Data Contracts

#### A. `<DiscordProfilePreview />`
```typescript
interface DiscordProfilePreviewProps {
  user: {
    id: string
    username: string
    globalName?: string | null
    avatarUrl?: string | null
    discriminator?: string
    flags?: number
    premiumType?: number
  } | null
  badges: BadgeInfo[]
  connections: Array<{ type: string; name: string; verified: boolean; showOnProfile: boolean }>
  activeFarming?: { gameName: string; hoursDone: number; targetHours: number } | null
  onBadgeClick?: (badgeId: string) => void
}
```
**Visual Features:**
- Discord standard aspect ratio (340px width).
- Banner fallback with customizable cyber-dark gradient or custom hex banner color.
- Avatar with Discord Online green status dot and glowing frame.
- Badges Tray (`badges-tray`): Real-time animated rack. Clicking any badge highlights its card in the main catalog.
- "Playing a Game" activity bar showing active injected game with live timer ("Jogando agora há 4.992 horas").

#### B. `<BadgeCard />`
```typescript
interface BadgeCardProps {
  badge: BadgeInfo
  status: 'owned' | 'claimable' | 'in_progress' | 'locked'
  isSwitching?: boolean
  onAction: (actionType: 'claim' | 'switch_house' | 'inject_hours' | 'open_wizard' | 'open_details') => void
}
```
**Cyber Styling Details:**
- Container: `relative rounded-xl border p-4 bg-card/60 backdrop-blur-md transition-all duration-300`
- States:
  - `owned`: `border-emerald-500/30 bg-emerald-500/[0.03] shadow-[0_0_15px_rgba(0,204,106,0.06)]`
  - `claimable`: `border-amber-500/40 bg-amber-500/[0.04] shadow-[0_0_20px_rgba(245,158,11,0.08)] animate-pulse-slow`
  - `in_progress`: `border-cyan-500/40 bg-cyan-500/[0.04]`
  - `locked`: `border-border/40 opacity-70 hover:opacity-100`
- High-res badge image container with back-glow radial blur matching the badge's thematic color.

#### C. `<HypeSquadSwitcherDeck />`
```typescript
interface HypeSquadSwitcherDeckProps {
  currentHouse: 0 | 1 | 2 | 3 // 0 = none, 1 = Bravery, 2 = Brilliance, 3 = Balance
  loading: boolean
  onSelectHouse: (houseId: 1 | 2 | 3) => Promise<void>
  onLeave: () => Promise<void>
}
```
**Interactive Cards:**
- 3 Large interactive cards with official high-resolution vector house sigils.
- Direct click switches house in Discord API and immediately executes an optimistic bounce animation in the profile preview tray.

#### D. `<PlaytimeInjectorDialog />`
```typescript
interface PlaytimeInjectorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onStartFarm: (hours: number, gameId?: string) => Promise<void>
  catalogGames: Array<{ id: string; name: string; exe: string }>
  isFarming: boolean
  currentProgress?: { done: number; total: number; gameName: string }
}
```
**Controls:**
- Game Select Dropdown with search filter & app icons.
- Target Hours Presets: `[50h]` `[100h]` `[500h]` `[1.000h]` `[5.000h]` + Custom Number Input.
- Telemetry Mode Info: Injects via Discord `/science` chunked heartbeats (up to 24h chunk per packet) with real client signatures.
- Live progress gauge and abort button.

---

## 7. API Client Extension Specifications (`src/lib/api-client.ts`)

The frontend interacts with the backend routes already registered in `server/features/badge-collector/`:

```typescript
// Additions to ApiClient class:
export class ApiClient {
  // Badge Collector
  getBadgeCollectorProfile() {
    return this.get<BadgeProfileData>('/badge-collector/profile')
  }

  setHypeSquadHouse(houseId: 1 | 2 | 3) {
    return this.post<{ success: boolean }>('/badge-collector/hypesquad', { houseId })
  }

  leaveHypeSquad() {
    return this.delete<{ success: boolean }>('/badge-collector/hypesquad')
  }

  farmPlaytime(hours: number, gameId?: string) {
    return this.post<{ success: boolean; data: { taskId: string } }>('/badge-collector/farm-playtime', {
      hours,
      gameId,
    })
  }

  farmVariety() {
    return this.post<{ success: boolean; data: { taskId: string } }>('/badge-collector/farm-variety', {})
  }
}
```

---

## 8. WebSocket Event Contracts

1. **`badge-collector:updated`**:
   - Dispatched when HypeSquad or flags change.
   - Payload: `{ houseId: number }`
2. **`badge-collector:progress`**:
   - Dispatched on each `/science` telemetry heartbeat chunk.
   - Payload: `{ done: number, total: number }`
3. **`tool:progress` / `tool:completed` / `tool:failed`**:
   - Standard task lifecycle events from `taskManager` allowing global taskbar progress and background execution notifications.

---

## 9. Implementation Roadmap & Checklist

- [x] Backend service & routes implemented in `server/features/badge-collector/`
- [x] Routes wired into `server/features/registry.ts` and `src/types/tools.ts`
- [ ] Add API client methods to `src/lib/api-client.ts`
- [ ] Create `src/app/(dashboard)/badges/hooks/use-badge-collector.ts`
- [ ] Create `src/app/(dashboard)/badges/components/discord-profile-preview.tsx`
- [ ] Create `src/app/(dashboard)/badges/components/hypesquad-switcher-deck.tsx`
- [ ] Create `src/app/(dashboard)/badges/components/badge-card.tsx`
- [ ] Create `src/app/(dashboard)/badges/components/playtime-injector-dialog.tsx`
- [ ] Create `src/app/(dashboard)/badges/components/active-dev-wizard-dialog.tsx`
- [ ] Create `src/app/(dashboard)/badges/page.tsx`
- [ ] Add route `/badges` into `src/routes.tsx`
- [ ] Add navigation entry into `src/components/layout/sidebar.tsx` & `command-palette.tsx`
