# PhantomClear V2 — Auto-Reactor & Giveaway Joiner Technical Specification

**Module:** `/auto-reactor` (Aliases: `/giveaway-joiner`, `/reaction-sniper`)  
**Version:** 2.0.0-PROD  
**Target Platform:** Electron 33 + Node.js Express Backend + React 19 + Tailwind CSS v4 + Radix UI + Lucide React + vendored `discord.js-selfbot-v13`  
**Status:** Architecture, Protocol & UI/UX Ready for Implementation  

---

## 1. Executive Summary & System Architecture

### 1.1 Product Vision
The **Auto-Reactor and Giveaway Joiner** module for PhantomClear V2 provides an enterprise-grade, undetectable automation engine that captures, analyzes, and enters Discord giveaways in real time while also executing high-speed targeted emoji reactions across monitored guilds and DMs.

By uniting **Discord Message Component Interaction V2 protocol parsing** (button clicks with cryptographic nonces and Gateway session tracking) with **high-throughput Unicode/Custom emoji reaction pipelines**, this module eliminates the need for manual giveaway participation. It incorporates an advanced **Anti-Detection & Humanized Jitter Subsystem** that models human cognitive-motor delay distributions, simulates channel read states (`ACK`), and screens for staff honeypots to ensure long-term account safety.

```
                      ┌────────────────────────────────────────┐
                      │        Discord Gateway Events          │
                      │   (MESSAGE_CREATE, MESSAGE_UPDATE,     │
                      │         MESSAGE_REACTION_ADD)          │
                      └──────────────────┬─────────────────────┘
                                         │
                                         ▼
                      ┌────────────────────────────────────────┐
                      │    Giveaway & Interaction Sniffer      │
                      │  - Bot Identity & Embed Parsing        │
                      │  - Keyword & Prize Filtering           │
                      │  - Anti-Honeypot & Trap Screening      │
                      └──────────────────┬─────────────────────┘
                                         │
                    ┌────────────────────┴────────────────────┐
                    ▼                                         ▼
      ┌───────────────────────────┐             ┌───────────────────────────┐
      │   Button Interaction V2   │             │   Emoji Reaction Sniper   │
      │   (ActionRow / Button)    │             │   (Unicode / Custom ID)   │
      └─────────────┬─────────────┘             └─────────────┬─────────────┘
                    │                                         │
                    └────────────────────┬────────────────────┘
                                         │
                                         ▼
                      ┌────────────────────────────────────────┐
                      │     Anti-Bot Evasion & Jitter Core     │
                      │  - Gaussian Box-Muller Timing Jitter   │
                      │  - Channel Read-State (ACK) Dispatch   │
                      │  - Leaky-Bucket Rate Limiter           │
                      └──────────────────┬─────────────────────┘
                                         │
                                         ▼
                      ┌────────────────────────────────────────┐
                      │   Discord REST API / Gateway Dispatch  │
                      │   POST /interactions  |  PUT /reactions │
                      └──────────────────┬─────────────────────┘
                                         │
                                         ▼
                      ┌────────────────────────────────────────┐
                      │     Ephemeral & Response Validator     │
                      │  - Ephemeral Message / Flag 64 Parsing │
                      │  - Modal / Captcha Interception        │
                      │  - Real-time WebSocket Telemetry & UI  │
                      └────────────────────────────────────────┘
```

### 1.2 Design Language: Cyber-Dark HUD
Consistent with the PhantomClear V2 design system:
- **Substrate Colors:** Canvas `#08080b`, Card Container `#0e0e14`, Hover Float `#14141c`.
- **Accent Tokens:**
  - `neon-green` (`#00cc6a`): Successful giveaway entries, active status, high-confidence detections.
  - `cyber-cyan` (`#00e5ff`): Real-time Gateway events, button interactions, WebSocket telemetry pulses.
  - `hyper-purple` (`#9d4edd`): Reaction snipers, custom emoji processing, rare prize tags.
  - `solar-coral` (`#f97316`): Honeypot alerts, blocked traps, rate-limit warnings.
  - `molten-amber` (`#f59e0b`): Captcha/Modal requirements, role-gate rejections.
  - `dimmed-slate` (`#64748b`): Inactive listeners, excluded servers, historical logs.

---

## 2. Giveaway Ecosystem & Bot Signature Anatomy

Modern Discord giveaways are dispatched by specialized verified bots or custom server scripts. Each bot possesses distinct embed formatting, timestamp structures, and entry mechanisms.

### 2.1 Known Giveaway Bot Catalog

| Bot Name | Application ID | Primary Mechanism | Embed Identification Marks |
| :--- | :--- | :--- | :--- |
| **GiveawayBot** | `294882584201003009` | Button (`enter-giveaway`) / Legacy `🎉` | Author: `GiveawayBot#2381`<br>Title: `GIVEAWAY` or prize name<br>Footer: `Ends at` or `Winners: X` |
| **Carl-bot** | `235148962103951360` | Button ("Enter" / `🎉`) & Reaction `🎉` | Title contains `GIVEAWAY`<br>Author/Footer contains `Carl-bot`<br>Description: `React with 🎉 to enter!` |
| **Dyno** | `155149108183695360` | Button ("Enter") & Reaction `🎉` | Author: `Dyno`<br>Description: `React with 🎉 to enter!` or `Click the button below`<br>Footer: `Dyno Giveaways` |
| **YAGPDB.xyz** | `204255221017214977` | Custom Reaction / Button | Author: `YAGPDB.xyz`<br>Description: `Entry reaction: ...` |
| **ProBot** | `282859044593598464` | Reaction `🎉` / Button | Title: `Giveaway` / `Sorteio`<br>Footer contains ProBot branding |
| **Giselle / Drop Bots** | Custom / Various | Rapid Reaction / First-click Button | Ephemeral drop giveaways, short timers (10s - 120s) |
| **Generic / Custom Bots** | Any (`bot: true`) | Heuristic Embed Scanner | Matches regex against embed title, description, and footer |

### 2.2 Deep Embed Parsing Heuristics

When `message.author.bot === true`, the parser executes a multi-attribute inspection:

```typescript
export interface ParsedGiveaway {
  isGiveaway: boolean
  confidence: number // 0.0 to 1.0
  botName: string
  botId: string
  prize: string
  winnerCount: number
  endsAt: number | null // Unix timestamp (ms)
  hostedBy: string | null
  entryType: 'button' | 'reaction' | 'both' | 'unknown'
  targetButtonId?: string
  targetEmoji?: { id: string | null; name: string }
  requirements: GiveawayRequirements
}

export interface GiveawayRequirements {
  hasRequirements: boolean
  requiredRoles: string[]
  minimumAccountAgeDays?: number
  minimumServerJoinDays?: number
  messageThreshold?: number
  blacklistedConditions: string[]
}
```

#### Heuristic Scoring Algorithm
1. **Title / Author Check (+0.35 confidence):**
   - Regex: `/\b(giveaway|sorteio|win|concurso|drops?|premia[çc][ãa]o)\b/i`
2. **Description Indicators (+0.30 confidence):**
   - Regex: `/(react with|clique|click|enter|participar|winners?|hosted by|ends in|termina em|vencedores?)/i`
   - Timestamp extraction: `<t:(\d+):[RFTdDt]>` resolves exact giveaway deadline.
3. **Component & Reaction Markers (+0.35 confidence):**
   - Message possesses ActionRows with buttons containing `🎉`, `enter`, `join`, `participate`.
   - Message has pre-seeded bot reactions matching `🎉` or custom `:tada:`.

---

## 3. Entry Protocol Mechanics: Button Interactions vs. Emoji Reactions

### 3.1 Button Interactions (Components V2 Protocol)

Modern Discord bots use Discord Interaction Components (`type: 3` = `MESSAGE_COMPONENT`). Emulating a button click requires constructing a valid interaction packet conforming to Discord Client API specs.

#### 3.1.1 Interaction Payload Construction

```typescript
/**
 * Emulates a real Discord Desktop / Web interaction packet.
 */
interface DiscordButtonInteractionPayload {
  type: 3 // InteractionType.MESSAGE_COMPONENT
  nonce: string // Snowflake generated by client
  guild_id: string
  channel_id: string
  message_id: string
  application_id: string
  session_id: string // Active Gateway Session ID
  message_flags: number // e.g. 0
  data: {
    component_type: 2 // MessageComponentType.BUTTON
    custom_id: string
  }
}
```

#### 3.1.2 Nonce Generation
Discord Desktop generates snowflakes for client interaction tracking:
```typescript
function generateInteractionNonce(): string {
  const DISCORD_EPOCH = 1420070400000n
  const now = BigInt(Date.now())
  const timestampPart = (now - DISCORD_EPOCH) << 22n
  // Inject pseudo-random worker and process bits + counter
  const randomPart = BigInt(Math.floor(Math.random() * 0x3fffff))
  return (timestampPart | randomPart).toString()
}
```

#### 3.1.3 REST Interaction Dispatch
- **Endpoint:** `POST https://discord.com/api/v10/interactions`
- **Headers:**
  - `Authorization: <token>`
  - `Content-Type: application/json`
  - `User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) discord/1.0.9215 Chrome/138.0.7204.251 Electron/37.6.0 Safari/537.36`
  - `X-Super-Properties: <base64_encoded_client_properties>`

#### 3.1.4 Interaction Lifecycle & Gateway Responses
When the button interaction is sent, the client waits for one of three Gateway dispatches:
1. **`INTERACTION_SUCCESS` (`UNHANDLED_PACKET`):** The bot acknowledged the interaction (e.g. `deferUpdate`).
2. **`MESSAGE_CREATE` with `flags: 64` (`MessageFlags.EPHEMERAL`):**
   - The bot replies with an ephemeral confirmation ("You have successfully entered the giveaway!").
   - **Error / Requirement rejection:** "You must have the @Giveaways role to enter" or "You cannot enter your own giveaway".
3. **`INTERACTION_MODAL_CREATE`:**
   - The bot spawned a verification Modal / Captcha.
   - The joiner captures the modal, extracts the prompt, halts auto-submission, and alerts the user with an urgent notification.

---

### 3.2 Emoji Reaction Protocol (Legacy & Fallback)

When a giveaway bot relies on reactions or operates in hybrid mode:

#### 3.2.1 Emoji Identifier Formatting
- **Standard Unicode Emoji:** Must be percent-encoded:
  - `🎉` (`\u{1F389}`) -> `%F0%9F%8E%89`
  - `🎁` (`\u{1F381}`) -> `%F0%9F%8E%81`
- **Custom Guild Emoji:** Must follow `name:id` format:
  - `<:tada:987654321098765432>` -> `tada:987654321098765432`
  - `<a:nitro:123456789012345678>` -> `nitro:123456789012345678`

#### 3.2.2 REST Reaction Dispatch
- **Endpoint:** `PUT https://discord.com/api/v10/channels/{channel_id}/messages/{message_id}/reactions/{emoji}/@me`
- **URL Parameters:**
  - `burst=false` (regular reaction) or `burst=true` (Super Reaction / Nitro only).
- **Latency Handling:**
  - Many bots create the message and add the reaction 250ms–1,500ms later. If a giveaway is detected with zero reactions, the engine arms a 3-second `MESSAGE_REACTION_ADD` listener on `message.id` instead of immediately failing.

---

## 4. Anti-Bot Evasion, Jitter Math & Behavioral Modeling

Selfbot detection algorithms deployed by Discord Trust & Safety and bot developers evaluate behavioral telemetry. Instant reactions and robotic intervals are flagged within minutes.

### 4.1 Gaussian (Box-Muller) Timing Jitter Engine

Fixed delays (`setTimeout(3000)`) or linear random distributions (`Math.random() * 5000`) produce unnatural flat distributions. PhantomClear V2 implements a **Normal (Gaussian) Distribution** that models human cognitive and motor latency.

```typescript
/**
 * Generates a random delay following a Gaussian (Normal) distribution
 * using the Box-Muller transformation.
 *
 * @param meanMs Average human delay (e.g., 4,500ms)
 * @param stdDevMs Standard deviation spread (e.g., 1,200ms)
 * @param minMs Absolute minimum safety clamp (e.g., 1,800ms)
 * @param maxMs Absolute maximum safety clamp (e.g., 14,000ms)
 */
export function calculateGaussianDelay(
  meanMs: number = 4500,
  stdDevMs: number = 1200,
  minMs: number = 1800,
  maxMs: number = 14000
): number {
  let u1 = 0
  let u2 = 0
  while (u1 === 0) u1 = Math.random()
  while (u2 === 0) u2 = Math.random()

  // Box-Muller transform
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2)
  const rawDelay = meanMs + z0 * stdDevMs

  return Math.min(Math.max(Math.round(rawDelay), minMs), maxMs)
}
```

### 4.2 Simulated Channel Read-State (`ACK` Dispatch)

A genuine human user navigates to the channel, reads the message, and triggers an acknowledgment (`ACK`) before interacting. The module dispatches a simulated channel read state prior to clicking:

```typescript
async function dispatchChannelAck(channelId: string, messageId: string, token: string): Promise<void> {
  try {
    await fetch(`https://discord.com/api/v10/channels/${channelId}/messages/${messageId}/ack`, {
      method: 'POST',
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: null }),
    })
  } catch {
    // Non-fatal telemetry dispatch
  }
}
```

### 4.3 Honeypot, Trap & Blacklist Defense Subsystem

Server administrators frequently attempt to catch selfbots using bait messages. The module filters every message against an extensive safety matrix:

```typescript
export interface SafetyFilterConfig {
  blacklistKeywords: string[]
  whitelistPrizesOnly: boolean
  prizeWhitelist: string[]
  blacklistedGuildIds: string[]
  blacklistedChannelIds: string[]
  ignoreIfHostedByStaff: boolean
  minAccountAgeDays: number
  maxJoinsPerHour: number
  minDelayBetweenJoinsMs: number
}

export const DEFAULT_SAFETY_CONFIG: SafetyFilterConfig = {
  blacklistKeywords: [
    'test', 'teste', 'fake', 'trap', 'ban', 'selfbot', 'honeypot',
    'bot test', 'pega bot', 'ban test', 'scam', 'proof', 'dont react',
    'não reaja', 'dont click', 'kick', 'punish', 'mute'
  ],
  whitelistPrizesOnly: false,
  prizeWhitelist: [
    'nitro', 'robux', 'steam', 'gift', 'card', 'val', 'valorant',
    'pass', 'gamepass', 'pix', 'money', 'crypto', 'vbucks'
  ],
  blacklistedGuildIds: [],
  blacklistedChannelIds: [],
  ignoreIfHostedByStaff: false,
  minAccountAgeDays: 7,
  maxJoinsPerHour: 20,
  minDelayBetweenJoinsMs: 15000,
}
```

#### Trap Validation Rules:
1. **Keyword Screening:** If the embed title, description, or footer contains any `blacklistKeywords`, the message is flagged as `TRAP_SUSPECTED` and dropped immediately.
2. **Instant Giveaway Check:** If an embed has an expiration under 10 seconds from creation time, it is flagged as a speed-trap and ignored.
3. **Prize Whitelist Enforcement:** When enabled, giveaways without high-value keywords (e.g. random server roles, gag prizes) are bypassed to conserve action quotas.

### 4.4 Global Leaky-Bucket Rate Limiter

To avoid triggering Discord's global abuse thresholds:
- **Burst Limit:** No more than 2 interactions within any 10-second rolling window.
- **Hourly Cap:** Default maximum of 20 giveaways joined per hour across all servers.
- **Inter-Join Cooldown:** Enforced minimum 15-second pause between successive actions.

---

## 5. Auto-Reactor & Reaction Sniper Modes

Beyond giveaway joining, the module operates in four specialized auto-reaction sub-modes:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            AUTO-REACTOR MODES                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. GIVEAWAY JOINER    │ Detects and joins giveaways via buttons / reactions │
│ 2. KEYWORD SNIPER     │ Reacts with emojis when messages match regex terms  │
│ 3. TARGET USER ECHO   │ Mirrors reactions placed by specified user IDs      │
│ 4. FIRST-REACT RACER  │ Snipes first reaction slots on announcements/drops  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.1 Mode 1: Giveaway Joiner
- Focuses exclusively on verified giveaway embeds from known or heuristic bots.
- Automatically selects the optimal entry vector: Button Interaction -> Bot Emoji Reaction -> Universal `🎉` Reaction.

### 5.2 Mode 2: Keyword Auto-Reactor
- Configurable rule sets mapping keywords to an array of emojis:
  - `"gg"` -> `['🔥', '🏆', '🎉']`
  - `"poll"` / `"votação"` -> `['👍', '👎']`
  - `"rip"` -> `['🪦', '🫡']`
- Evaluates guild/channel boundaries and user permissions before reacting.

### 5.3 Mode 3: Target User Reaction Echo (Mirroring)
- Listens to `MESSAGE_REACTION_ADD`.
- If `userId === targetUserId` (e.g., server owner, partner, friend), the selfbot immediately or with human jitter reacts with the identical emoji.

### 5.4 Mode 4: First-React Speed Racer
- Designed for speed drops, announcement claims, or limited-slot rewards.
- Bypasses long Gaussian delays in favor of an optimized **Low-Latency Jitter Profile** (400ms – 950ms) with anti-burst throttling.

---

## 6. PhantomClear V2 Integration Architecture

### 6.1 Backend Service Implementation (`server/features/auto-reactor`)

The module is housed under `server/features/auto-reactor/`:
- `auto-reactor.service.ts`: Core state machine, gateway listeners, queue manager.
- `auto-reactor.routes.ts`: Express REST endpoints for configuration, manual triggers, and history.
- `index.ts`: Feature export and registry hook.

#### 6.1.1 Service Interface & Schema Definition

```typescript
export interface AutoReactorLog {
  id: string
  type: 'giveaway_button' | 'giveaway_reaction' | 'keyword_react' | 'echo_react'
  guildId?: string
  guildName?: string
  channelId: string
  channelName?: string
  messageId: string
  author: string
  prize?: string
  actionSummary: string
  status: 'entered' | 'reacted' | 'rejected' | 'failed' | 'trapped' | 'captcha'
  latencyMs: number
  ephemeralFeedback?: string
  timestamp: string
}

export interface AutoReactorConfig {
  enabled: boolean
  // Giveaway Joiner Settings
  giveawaysEnabled: boolean
  preferButtonsOverReactions: boolean
  autoDetectUnknownBots: boolean
  minDelayMs: number
  maxDelayMs: number
  meanDelayMs: number
  stdDevDelayMs: number
  simulateChannelAck: boolean
  // Safety Filters
  safety: SafetyFilterConfig
  // Auto-Reactor Settings
  keywordReactorsEnabled: boolean
  keywordRules: Array<{
    keywords: string[]
    emojis: string[]
    guildIds?: string[]
    channelIds?: string[]
  }>
  reactionEchoEnabled: boolean
  echoTargetUserIds: string[]
  webhookNotificationUrl?: string
}
```

#### 6.1.2 Express REST API Endpoints

```typescript
// GET /tools/auto-reactor/config
// Retrieves active configuration
router.get('/tools/auto-reactor/config', (req, res) => {
  res.json({ success: true, data: autoReactorService.getConfig() })
})

// POST /tools/auto-reactor/config
// Updates active configuration with immediate persistence
router.post('/tools/auto-reactor/config', (req, res) => {
  const updated = autoReactorService.updateConfig(req.body)
  res.json({ success: true, data: updated })
})

// GET /tools/auto-reactor/status
// Retrieves telemetry metrics, active counters, and current queue state
router.get('/tools/auto-reactor/status', (req, res) => {
  res.json({ success: true, data: autoReactorService.getStatus() })
})

// GET /tools/auto-reactor/logs
// Retrieves rolling audit log of recent entries, reactions, and blocked traps
router.get('/tools/auto-reactor/logs', (req, res) => {
  res.json({ success: true, data: autoReactorService.getLogs() })
})

// POST /tools/auto-reactor/clear-logs
router.post('/tools/auto-reactor/clear-logs', (req, res) => {
  autoReactorService.clearLogs()
  res.json({ success: true })
})
```

#### 6.1.3 WebSocket Broadcast Events
The service dispatches real-time events to the React frontend via `broadcastWSEvent`:
- `auto-reactor:giveaway-detected`: When an eligible giveaway enters parsing.
- `auto-reactor:action-completed`: When a button interaction or reaction succeeds.
- `auto-reactor:trap-blocked`: When a honeypot or trap is thwarted.
- `auto-reactor:captcha-alert`: When a bot interaction demands human modal completion.

---

## 7. Frontend UI/UX Specification

### 7.1 Navigation & Placement
- **Route:** `/auto-reactor` (with redirect from `/giveaway-joiner`).
- **Sidebar Position:** Under **"Automação & Snipers"** in `src/components/layout/sidebar.tsx`:
  ```tsx
  {
    titulo: "Auto-Reactor & Sorteios",
    icone: <Gift size={16} className="text-[#00e5ff]" />,
    href: "/auto-reactor"
  }
  ```

### 7.2 Component Architecture & Layout Wireframe

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Auto-Reactor & Giveaway Joiner HUD                 [ ● RUNNING ]  [ SAVE ]  │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ │
│ │  GIVEAWAYS     │ │  REACTIONS     │ │  AVG LATENCY   │ │  TRAPS BLOCKED │ │
│ │  42 Joined     │ │  158 Sent      │ │  4,210 ms      │ │  7 Neutralized │ │
│ └────────────────┘ └────────────────┘ └────────────────┘ └────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│ TAB NAVIGATION: [ Giveaways & Snipers ] [ Auto-Reactor Rules ] [ Anti-Bot ] │
├──────────────────────────────────────┬──────────────────────────────────────┤
│ CONFIGURATION PANEL                  │ REAL-TIME AUDIT FEED                 │
│                                      │                                      │
│ [x] Enable Giveaway Joiner           │ 14:22:01 | [GiveawayBot] Entered     │
│ [x] Prioritize Buttons Over Reacts   │   Prize: Discord Nitro 1 Mês         │
│ [x] Auto-Detect Unknown Bot Embeds   │   Guild: CyberHub | Delay: 4,320ms   │
│                                      │ 14:18:45 | [TRAP BLOCKED] Ignored    │
│ Timing & Jitter Profile:             │   Pattern: 'selfbot ban test'        │
│   Mean Delay: [ 4500 ms ]            │   Guild: DarkVibe | Channel: #bot-t  │
│   Std Dev:    [ 1200 ms ]            │ 14:10:12 | [Carl-bot] Reacted 🎉     │
│                                      │   Prize: 100k Dream Coins            │
│ Prize Whitelist (Optional):          │   Guild: GamingZone | Delay: 3,980ms │
│   [ nitro, steam, robux, giftcard ]  │ 13:58:20 | [KEYWORD] Reacted 🔥     │
│                                      │   Keyword: 'drop' in #geral          │
│ Safety Thresholds:                   │                                      │
│   Max Joins/Hour: [ 20 ]             │                                      │
│   Min Interval:   [ 15 s ]           │                                      │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

### 7.3 Visual Style Tokens & UI Components
- **Telemetry HUD Cards:** Styled using `Card` with top border glow matching status tokens (`neon-green`, `cyber-cyan`, `solar-coral`).
- **Interactive Badges:**
  - Status `entered`: `<Badge className="bg-[#00cc6a]/20 text-[#00cc6a] border-[#00cc6a]/40">ENTERED</Badge>`
  - Status `trapped`: `<Badge className="bg-[#f97316]/20 text-[#f97316] border-[#f97316]/40">TRAP DETECTED</Badge>`
  - Status `captcha`: `<Badge className="bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/40">MODAL REQ</Badge>`
- **Live Feed Table:** Built with virtualization or smooth auto-scroll, showing exact timestamp, server name, bot icon, target prize, entry mechanism, and latency breakdown.

---

## 8. Ephemeral Parsing, Error Recovery & Edge Cases

### 8.1 Ephemeral Message Verification
When clicking a button interaction, Discord sends an ephemeral message (`flags: 64`). The module parses the text content for verification:
1. **Positive Confirmations:**
   - Patterns: `/entered|participando|registered|sucesso|inscrito|entry confirmed/i`
   - Outcome: Logged as `entered`, updates success metrics.
2. **Role & Permission Rejections:**
   - Patterns: `/must have role|requires|cargo necessário|nível mínimo|level required/i`
   - Outcome: Logged as `rejected` with role requirements logged. Prevents repeated attempts on the same message.
3. **Double Entry Prevention:**
   - If the bot responds with "You have already entered", the message ID is added to the internal persistent cache to prevent duplicate interactions.

### 8.2 Modals and hCaptcha Challenges
If a bot replies with `INTERACTION_MODAL_CREATE`:
- The module extracts the modal `title` and input fields.
- Instead of attempting a broken submission, the engine flags the log as `CAPTCHA_REQUIRED`.
- If Desktop Notifications are enabled, a native notification is fired:
  - Title: `"PhantomClear Giveaway Alert"`
  - Body: `"O sorteio em {server} requer preenchimento manual (Modal/Captcha)."`

### 8.3 Rate Limit Throttling (HTTP 429)
- If Discord REST returns HTTP 429, the module reads the `retry_after` header (or JSON payload), pauses all operations for `retry_after * 1000 + 500ms`, and broadcasts a rate-limit event to the UI telemetry dashboard.

---

## 9. Implementation Checklist & Verification Matrix

- [x] **Gateway Event Hooks:** Bind `messageCreate`, `messageUpdate`, and `messageReactionAdd` in `discord.service.ts`.
- [x] **Interaction Component V2:** Validate button clicks with custom `nonce` generation and active `sessionId`.
- [x] **Box-Muller Gaussian Jitter:** Unit test mathematical distribution to ensure bell-curve delay spread.
- [x] **Channel ACK Simulation:** Dispatch `POST /channels/{id}/messages/{id}/ack` prior to interaction.
- [x] **Anti-Honeypot Scanner:** Verify regex rejection on suspicious phrases and micro-second timers.
- [x] **Express Backend Routes:** Add `/tools/auto-reactor` suite to `registry.ts`.
- [x] **React Cyber HUD:** Build responsive UI matching PhantomClear V2 Obsidian theme.
- [x] **Webhook Dispatcher:** Test external Discord webhook notification for wins and high-tier entries.

---

*PhantomClear V2 Technical Specifications — Engineered for Performance, Privacy, and Undetectability.*
