# PhantomClear V2 — Account Cleanup & Backup Technical Specification

**Module:** `/account-cleanup` (Sub-modules: `/sair-servidores`, `/fechar-dms`, `/remover-amigos`, `/backups`)  
**Version:** 2.0.0-PROD  
**Target Platform:** Electron 33 + Node.js Express Backend + React 19 + Tailwind CSS v4 + Radix UI + Lucide React + vendored `discord.js-selfbot-v13`  
**Status:** Architecture, REST Endpoints, Anti-Detection & UI/UX Ready for Implementation  

---

## 1. Executive Summary & Architecture Overview

### 1.1 Product Vision
The **Account Cleanup & Backup** suite in PhantomClear V2 provides a military-grade, fully automated maintenance system for Discord selfbot accounts. Whether resetting compromised credentials, pruning legacy social attachments, wiping unwanted channels, or migrating social graphs between tokens, this module delivers high-throughput bulk operations coupled with advanced anti-detection heuristics and cryptographic state snapshots.

The suite is engineered around four core operational pillars:
1. **Mass Guild Leave (`/sair-servidores`):** High-speed departure from unpinned guilds with owner-lock shields and community server preservation.
2. **Mass DM & Group Close (`/fechar-dms`):** Clean-slate closure of 1-on-1 direct messages and stealth departures from Group DMs (`silent: true`).
3. **Unfriend Inactive & Mass Social Prune (`/remover-amigos`):** Algorithmic social triage based on Discord snowflake message timestamps, friendship age (`since`), mutual server intersection, and deleted account heuristics.
4. **Account Social Graph Export & Restore (`/backups`):** Cryptographic JSON serialization of relationships, guilds, and settings, backed by an automated re-friending engine featuring CAPTCHA resilience and exponential rate-limit backoff.

### 1.2 System Architecture Diagram

```
                             ┌───────────────────────────────────┐
                             │    React 19 Cyber-Dark HUD UI     │
                             │  - Sair Servidores (/sair)        │
                             │  - Fechar DMs (/fechar-dms)       │
                             │  - Remover Amigos (/remover)      │
                             │  - Social Backup (/backups)       │
                             └─────────────────┬─────────────────┘
                                               │ HTTP / WebSocket RPC
                                               ▼
                             ┌───────────────────────────────────┐
                             │       Express REST Backend        │
                             │  - Zod Request Validation         │
                             │  - Token Authentication Guard     │
                             │  - Task Manager Async Controller  │
                             └─────────────────┬─────────────────┘
                                               │
                      ┌────────────────────────┼────────────────────────┐
                      ▼                        ▼                        ▼
        ┌──────────────────────────┐ ┌───────────────────┐ ┌──────────────────────────┐
        │   Guild Removal Engine   │ │  DM Purge Engine  │ │  Social Graph Engine     │
        │ - Owner Guild Shield     │ │ - 1-on-1 DM Close │ │ - Inactivity Analyzer    │
        │ - Vanity/Invite Scraper  │ │ - Group DM Leave  │ │ - Snowflake Timestamping │
        │ - 429 Adaptive Throttle  │ │ - Silent Exit     │ │ - Backup / Re-friender   │
        └─────────────┬────────────┘ └─────────┬─────────┘ └────────────┬─────────────┘
                      │                        │                        │
                      └────────────────────────┼────────────────────────┘
                                               │
                                               ▼
                             ┌───────────────────────────────────┐
                             │ Anti-Detection & Telemetry Layer  │
                             │  - X-Super-Properties Injection   │
                             │  - X-Context-Properties (Base64)  │
                             │  - Box-Muller Gaussian Jitter     │
                             │  - Leaky-Bucket Rate Limiter      │
                             └─────────────────┬─────────────────┘
                                               │
                                               ▼
                             ┌───────────────────────────────────┐
                             │      Discord REST API v9/v10      │
                             │  - /users/@me/guilds/{id}         │
                             │  - /channels/{id}                 │
                             │  - /users/@me/relationships/{id}  │
                             └───────────────────────────────────┘
```

---

## 2. Discord REST Endpoints & Protocol Specifications

### 2.1 HTTP Headers & Telemetry Emulation

Every outbound request issued to the Discord REST API (`https://discord.com/api/v9`) must present headers indistinguishable from the official Discord desktop client (Electron build):

```http
Authorization: <USER_TOKEN>
Content-Type: application/json
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) discord/1.0.9168 Chrome/128.0.6613.186 Electron/32.2.0 Safari/537.36
X-Super-Properties: <BASE64_ENCODED_CLIENT_TELEMETRY>
X-Context-Properties: <BASE64_ENCODED_LOCATION_CONTEXT>
X-Discord-Locale: pt-BR
X-Discord-Timezone: America/Sao_Paulo
X-Debug-Options: bugReporterEnabled
Sec-Ch-Ua: "Chromium";v="128", "Not;A=Brand";v="24", "Discord";v="1"
Sec-Ch-Ua-Mobile: ?0
Sec-Ch-Ua-Platform: "Windows"
Sec-Fetch-Dest: empty
Sec-Fetch-Mode: cors
Sec-Fetch-Site: same-origin
```

#### X-Super-Properties Payload Structure
Decoded JSON representation:
```json
{
  "os": "Windows",
  "browser": "Discord Client",
  "release_channel": "stable",
  "client_version": "1.0.9168",
  "os_version": "10.0.19045",
  "os_arch": "x64",
  "app_arch": "x64",
  "system_locale": "pt-BR",
  "browser_user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) discord/1.0.9168 Chrome/128.0.6613.186 Electron/32.2.0 Safari/537.36",
  "browser_version": "32.2.0",
  "client_build_number": 344865,
  "native_build_number": null,
  "client_event_source": null
}
```

---

### 2.2 Pillar 1: Mass Leave Guilds (`/sair-servidores`)

#### Endpoints Matrix

| Action | HTTP Method | Endpoint Path | Query Params | Status Codes |
| :--- | :--- | :--- | :--- | :--- |
| **Fetch Joined Guilds** | `GET` | `/api/v9/users/@me/guilds` | `with_counts=true` | `200 OK` |
| **Leave Guild** | `DELETE` | `/api/v9/users/@me/guilds/{guild_id}` | — | `204 No Content`, `400 Bad Request` |
| **Delete Owned Guild** | `DELETE` | `/api/v9/guilds/{guild_id}` | — | `204 No Content`, `403 Forbidden` |
| **Transfer Ownership** | `PATCH` | `/api/v9/guilds/{guild_id}` | — | `200 OK`, `400 Bad Request` |

#### Leave Guild Request Specification
- **Method:** `DELETE`
- **URL:** `https://discord.com/api/v9/users/@me/guilds/{guild_id}`
- **Context Header:** `X-Context-Properties`
  ```json
  { "location": "Guild Context Menu" }
  ```
  *(Base64: `eyJsb2NhdGlvbiI6Ikd1aWxkIENvbnRleHQgTWVudSJ9`)*
- **Response:** `204 No Content`
- **Error Codes:**
  - `50007`: *Cannot leave a guild that you own.* Action: Catch error, check `ownerId === currentUserId`, skip or trigger deletion if user explicitly consented.
  - `40001`: *Unauthorized or invalid guild.* Skip to next.
  - `429`: *Too Many Requests.* Read `retry_after` from response body.

#### Ownership Shield & Transfer Payload
When deleting an owned guild (`DELETE /api/v9/guilds/{guild_id}`):
- Required Header if 2FA/MFA enforced: `X-Discord-MFA-Authorization: <MFA_TOKEN>`
When transferring ownership prior to leaving:
- **Method:** `PATCH`
- **URL:** `https://discord.com/api/v9/guilds/{guild_id}`
- **Body:**
  ```json
  { "owner_id": "<NEW_OWNER_SNOWFLAKE>" }
  ```

---

### 2.3 Pillar 2: Mass DM Close & Group Leave (`/fechar-dms`)

#### Endpoints Matrix

| Action | HTTP Method | Endpoint Path | Query Params | Status Codes |
| :--- | :--- | :--- | :--- | :--- |
| **List Open Channels** | `GET` | `/api/v9/users/@me/channels` | — | `200 OK` |
| **Close 1-on-1 DM** | `DELETE` | `/api/v9/channels/{channel_id}` | `silent=false` | `200 OK`, `404 Not Found` |
| **Leave Group DM (Stealth)** | `DELETE` | `/api/v9/channels/{channel_id}?silent=true` | `silent=true` | `200 OK`, `204 No Content` |
| **Leave Group DM (Explicit)** | `DELETE` | `/api/v9/channels/{channel_id}/recipients/@me` | — | `204 No Content` |
| **Decline Message Request** | `DELETE` | `/api/v9/channels/{channel_id}/recipients/@me` | — | `204 No Content` |
| **Accept Message Request** | `PUT` | `/api/v9/channels/{channel_id}/recipients/@me` | — | `204 No Content` |

#### 1-on-1 DM Close Request Specification
- **Method:** `DELETE`
- **URL:** `https://discord.com/api/v9/channels/{channel_id}`
- **Payload:** None
- **Context Header:** `X-Context-Properties`
  ```json
  { "location": "DM Channel Context Menu" }
  ```
- **Response Payload (`200 OK`):** Returns the closed Channel object (types: `1` = DM, `3` = Group DM).
- **Semantics:** Closing a DM removes it from the user's active DM list. The message history remains stored on Discord's backend and will reappear if either party transmits a new message.

#### Group DM Stealth Leave Specification
- **Method:** `DELETE`
- **URL:** `https://discord.com/api/v9/channels/{channel_id}?silent=true`
- **Significance of `silent=true`:** Prevents emission of the system audit message (`"<User> left the group"`) into the group DM feed, achieving a zero-trace stealth exit.

---

### 2.4 Pillar 3: Unfriend Inactive & Mass Unfriend (`/remover-amigos`)

#### Endpoints Matrix

| Action | HTTP Method | Endpoint Path | Payload / Context | Status Codes |
| :--- | :--- | :--- | :--- | :--- |
| **Fetch All Relationships** | `GET` | `/api/v9/users/@me/relationships` | — | `200 OK` |
| **Remove Friend** | `DELETE` | `/api/v9/users/@me/relationships/{user_id}` | Context: `ContextMenu` / `Friends` | `204 No Content` |
| **Cancel Outgoing Request** | `DELETE` | `/api/v9/users/@me/relationships/{user_id}` | Context: `Friends` | `204 No Content` |
| **Accept Incoming Request** | `PUT` | `/api/v9/users/@me/relationships/{user_id}` | Body: `{}` | `204 No Content` |
| **Fetch Target Mini-Profile** | `GET` | `/api/v9/users/{user_id}/profile` | Query: `with_mutual_guilds=true` | `200 OK` |

#### Relationships Schema (`GET /api/v9/users/@me/relationships`)
Returns an array of relationship objects:
```json
[
  {
    "id": "281489028198203392",
    "type": 1,
    "nickname": "Crypto Partner",
    "since": "2022-03-15T18:24:00.124000+00:00",
    "user": {
      "id": "281489028198203392",
      "username": "phantom_dev",
      "discriminator": "0",
      "global_name": "Phantom",
      "avatar": "a_12948192a8b9401284",
      "public_flags": 64
    }
  }
]
```

**Relationship Types Enumeration:**
- `0`: `NONE`
- `1`: `FRIEND`
- `2`: `BLOCKED`
- `3`: `PENDING_INCOMING` (Received friend request)
- `4`: `PENDING_OUTGOING` (Sent friend request)
- `5`: `IMPLICIT` (Friend suggestion)

#### Unfriend Request Specification
- **Method:** `DELETE`
- **URL:** `https://discord.com/api/v9/users/@me/relationships/{user_id}`
- **Context Header:** `X-Context-Properties`
  ```json
  { "location": "ContextMenu" }
  ```
  *(Base64: `eyJsb2NhdGlvbiI6IkNvbnRleHRNZW51In0=`)*
- **Response:** `204 No Content`

---

### 2.5 Pillar 4: Social Graph Export & Restore Engine (`/backups`)

#### Endpoints Matrix

| Action | HTTP Method | Endpoint Path | Query Params | Status Codes |
| :--- | :--- | :--- | :--- | :--- |
| **Fetch Current Relationships** | `GET` | `/api/v9/users/@me/relationships` | — | `200 OK` |
| **Fetch Current Guilds** | `GET` | `/api/v9/users/@me/guilds` | `with_counts=true` | `200 OK` |
| **Create Guild Invite (Backup)** | `POST` | `/api/v9/channels/{channel_id}/invites` | `{ "max_age": 0 }` | `200 OK` |
| **Restore Friend (by ID)** | `PUT` | `/api/v9/users/@me/relationships/{user_id}` | Body: `{}` | `204 No Content`, `400 Bad Request` |
| **Restore Friend (by Tag)** | `POST` | `/api/v9/users/@me/relationships` | Body: `{ "username": "..." }` | `204 No Content`, `400 Bad Request` |
| **Restore Guild (Re-join)** | `POST` | `/api/v9/invites/{invite_code}` | — | `200 OK`, `400 Bad Request` |

#### Send Friend Request Payload & CAPTCHA Response
When restoring friendships:
- **Method:** `PUT`
- **URL:** `https://discord.com/api/v9/users/@me/relationships/{user_id}`
- **Body:** `{}`
- **Headers:** `X-Context-Properties: {"location": "User Profile"}`
- **CAPTCHA Interception (HTTP 400 Bad Request):**
  When Discord's risk-scoring engine flags outbound friend requests, it returns:
  ```json
  {
    "captcha_key": ["response_submitting_verification_code"],
    "captcha_sitekey": "4c672d35-0701-42b2-88c3-78380b0db560",
    "captcha_service": "hcaptcha",
    "captcha_rqdata": "D1y7qN...",
    "captcha_rqtoken": "eyJhbGciOi..."
  }
  ```
  **Handling Strategy:**
  1. Catch HTTP 400 with `captcha_service === 'hcaptcha'`.
  2. Emit `task:captcha_required` WebSocket event to UI.
  3. If Anti-Captcha / 2Captcha API key is configured in settings, dispatch solving request.
  4. Retry request supplying headers:
     `X-Captcha-Key: <SOLVED_HCAPTCHA_TOKEN>`
     `X-Captcha-Rqtoken: <RAW_CAPTCHA_RQTOKEN>`

---

## 3. Inactive Friends Detection Heuristics

To distinguish between active companions and dead accounts, PhantomClear V2 executes a multi-factor algorithmic audit pipeline:

```
                          ┌──────────────────────────┐
                          │ Target Friend Candidate  │
                          └────────────┬─────────────┘
                                       │
                                       ▼
                     [1. Check Deleted / Disabled Account]
                     - Username starts with "deleted_user"
                     - Discriminator is "0000" with default avatar
                                       │
                      ┌────────────────┴────────────────┐
                   YES│                                 │NO
                      ▼                                 ▼
             { Flag: INACTIVE }           [2. Check Mutual Server Overlap]
             (Reason: Deleted)            - Count cached mutual guilds
                                                        │
                               ┌────────────────────────┴────────────────┐
                         0     │                                         │ > 0
                               ▼                                         ▼
                   [3. Inspect DM Snowflake]                 [3b. Low-weight Penalty]
                   - Fetch recipient channel                 - Has active shared chat
                   - Extract last_message_id
                               │
               ┌───────────────┴───────────────┐
          NULL │                               │ VALID SNOWFLAKE
               ▼                               ▼
      { Flag: INACTIVE }              [4. Calculate Timestamp]
      (Reason: No chat)               Epoch = (snowflake >> 22) + 1420070400000
                                               │
                               ┌───────────────┴───────────────┐
                     > Threshold Days │                       │ < Threshold Days
                                      ▼                       ▼
                              { Flag: INACTIVE }       { Flag: ACTIVE }
                              (Reason: Expired)        (Preserve Friend)
```

### 3.1 Snowflake Timestamp Extraction Formula
Discord snowflakes are 64-bit unsigned integers. The 42 most significant bits represent milliseconds elapsed since the Discord Epoch (`2015-01-01T00:00:00.000Z` or `1420070400000` ms).

```typescript
export function getSnowflakeTimestamp(snowflake: string): number {
  try {
    const snowflakeBigInt = BigInt(snowflake)
    const timestampMs = Number(snowflakeBigInt >> 22n) + 1420070400000
    return timestampMs
  } catch {
    return 0
  }
}
```

### 3.2 Inactivity Decision Matrix

| Metric | Condition | Classification | Confidence Score |
| :--- | :--- | :--- | :--- |
| **Account State** | `username.startsWith('deleted_user')` | `INACTIVE_DELETED` | 100% |
| **Friendship Age** | `since > 180 days` AND `last_message_id === null` | `INACTIVE_DORMANT` | 95% |
| **Last Message** | `now - lastInteractionTime > thresholdDays` | `INACTIVE_EXPIRED` | 90% |
| **Mutual Overlap** | `mutualGuilds === 0` AND `last_message_id === null` | `INACTIVE_ISOLATED` | 90% |
| **Mutual Overlap** | `mutualGuilds > 0` AND `last_message_id === null` | `SUSPECT_LOW_ACTIVITY` | 40% (Warn user) |
| **Recent Message** | `now - lastInteractionTime < thresholdDays` | `ACTIVE_ENGAGED` | 0% (Protected) |

---

## 4. Anti-Detection, Rate-Limiting & Jitter Mechanics

### 4.1 Rate Limit Buckets & Evasion
Bulk operations on user tokens without rate-limit respect cause immediate account quarantine (SMS phone verification lock) or account disabling.

#### Discord Rate-Limit Headers
```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1731468000
X-RateLimit-Reset-After: 4.821
X-RateLimit-Bucket: e069b7bb26402ecf0eecb08f4c281df6
```

### 4.2 Gaussian Box-Muller Jitter Model
Fixed delays (e.g., exactly `1000ms`) are flagged by Cloudflare WAF and Discord's behavioral anti-cheat. PhantomClear V2 implements a Gaussian (Normal) distribution around a configured mean:

```typescript
/**
 * Box-Muller transform to generate normally distributed random numbers
 */
export function gaussianRandom(mean: number, stdev: number): number {
  let u = 1 - Math.random()
  let v = Math.random()
  let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
  return Math.max(mean * 0.4, Math.round(mean + z * stdev))
}

export async function jitterSleep(baseDelayMs: number): Promise<void> {
  const delay = gaussianRandom(baseDelayMs, baseDelayMs * 0.25)
  return new Promise(resolve => setTimeout(resolve, delay))
}
```

### 4.3 Recommended Delay Profiles

| Operation | Min Delay | Base Delay | Stdev | Anti-Spam Safety Level |
| :--- | :--- | :--- | :--- | :--- |
| **Mass Guild Leave** | 800ms | 1,400ms | 350ms | **HIGH** (Leaves > 20/min trigger phone check) |
| **Mass DM Close** | 600ms | 1,100ms | 250ms | **MEDIUM** (Low risk, local sidebar removal) |
| **Group DM Stealth Leave** | 1,000ms | 1,800ms | 400ms | **HIGH** (Group state sync triggers gateway) |
| **Unfriend Inactive** | 900ms | 1,500ms | 350ms | **HIGH** (Relationship delete is aggressively bucketed) |
| **Friend Restore (Add)** | 3,500ms | 5,500ms | 1,200ms | **CRITICAL** (Add friend triggers CAPTCHA < 5 reqs) |

---

## 5. Backup & Restore Data Schema Specification

### 5.1 Account Backup JSON Specification (`version: 2.0.0`)
Stored under `.data/backups/account_backup_{userId}_{timestamp}.json`:

```json
{
  "version": "2.0.0",
  "generatedAt": "2026-11-13T02:45:00.000Z",
  "account": {
    "id": "184920491029402941",
    "username": "phantom_user",
    "discriminator": "0",
    "globalName": "Phantom Master",
    "avatarUrl": "https://cdn.discordapp.com/avatars/184920491029402941/9a8b7c6d5e4f3a2b.png",
    "flags": 64,
    "totalFriends": 142,
    "totalGuilds": 78,
    "totalBlocked": 12
  },
  "friends": [
    {
      "id": "281489028198203392",
      "username": "companion_one",
      "discriminator": "0",
      "globalName": "First Companion",
      "nickname": "Best Friend",
      "since": "2023-01-10T12:00:00.000Z",
      "avatarUrl": "https://cdn.discordapp.com/avatars/281489028198203392/1a2b3c4d5e6f.png",
      "publicFlags": 64,
      "mutualGuilds": 5,
      "lastInteractionAt": "2026-10-25T14:32:00.000Z"
    }
  ],
  "blocked": [
    {
      "id": "992817263541029384",
      "username": "spammer_user",
      "discriminator": "0",
      "blockedAt": "2026-05-12T08:15:00.000Z"
    }
  ],
  "pendingIncoming": [
    {
      "id": "334455667788990011",
      "username": "random_applicant",
      "since": "2026-11-01T20:00:00.000Z"
    }
  ],
  "pendingOutgoing": [
    {
      "id": "445566778899001122",
      "username": "requested_user",
      "since": "2026-11-05T10:00:00.000Z"
    }
  ],
  "guilds": [
    {
      "id": "887766554433221100",
      "name": "Phantom Development Community",
      "iconUrl": "https://cdn.discordapp.com/icons/887766554433221100/abcdef123456.png",
      "isOwner": false,
      "permissions": "104324161",
      "memberCount": 1542,
      "inviteCode": "phantomdev",
      "vanityUrlCode": "phantomdev"
    }
  ]
}
```

---

## 6. Backend Engineering & Service Implementation

### 6.1 TypeScript Interfaces & Configuration Contracts

```typescript
// server/features/account-tools/account-tools.types.ts

export interface InactiveFilterCriteria {
  thresholdDays: number
  removeDeletedAccounts: boolean
  removeNoChatHistory: boolean
  removeZeroMutualGuilds: boolean
  whitelistUserIds: string[]
}

export interface MassLeaveGuildsConfig {
  tokenId: string
  delay: number
  guildIds?: string[]
  ignoreOwned: boolean
  whitelistGuildIds?: string[]
}

export interface MassCloseDmsConfig {
  tokenId: string
  delay: number
  modo: 'dms' | 'grupos' | 'ambos'
  whitelistChannelIds?: string[]
  silentGroupLeave?: boolean
}

export interface UnfriendInactiveConfig {
  tokenId: string
  delay: number
  criteria: InactiveFilterCriteria
  dryRun?: boolean
}

export interface AccountRestoreConfig {
  tokenId: string
  backupId: string
  restoreFriends: boolean
  restoreGuilds: boolean
  delayFriends: number
  delayGuilds: number
  autoSolveCaptcha: boolean
  whitelistUserIds?: string[]
}
```

### 6.2 Inactive Friends Audit Service (`server/features/remover-amigos/inactive-friends.service.ts`)

```typescript
import { discord } from '../../services/discord.service'
import { getSnowflakeTimestamp } from '../../utils/helpers'
import type { InactiveFilterCriteria } from '../account-tools/account-tools.types'

export interface FriendAuditResult {
  id: string
  username: string
  globalName: string | null
  avatarUrl: string | null
  friendSince: string
  lastMessageTimestamp: number | null
  lastMessageDate: string | null
  mutualGuildsCount: number
  isDeleted: boolean
  eligibleForRemoval: boolean
  removalReason: string | null
}

export async function auditFriendsActivity(
  criteria: InactiveFilterCriteria
): Promise<FriendAuditResult[]> {
  const client = discord.getActiveClient()
  if (!client || !client.isReady()) {
    throw Object.assign(new Error('Nenhuma conta conectada'), { statusCode: 400 })
  }

  const whitelist = new Set(criteria.whitelistUserIds || [])
  const now = Date.now()
  const thresholdMs = criteria.thresholdDays * 86400000

  // 1. Fetch live relationships from REST API
  const token = discord.getActiveToken()
  const rawRelationships = await discord.request<any[]>('/users/@me/relationships', token)
  const friendsList = rawRelationships.filter(r => r.type === 1)

  // 2. Map open DMs by recipient ID
  const dmChannels = client.channels.cache.filter((c: any) => c.type === 'DM')
  const dmByRecipient = new Map<string, any>()
  for (const [, dm] of dmChannels) {
    if (dm.recipientId) {
      dmByRecipient.set(dm.recipientId, dm)
    }
  }

  const results: FriendAuditResult[] = []

  for (const rel of friendsList) {
    const user = rel.user
    const userId = user.id

    // Check whitelist
    if (whitelist.has(userId)) {
      continue
    }

    const isDeleted = 
      user.username.toLowerCase().startsWith('deleted_user') || 
      user.discriminator === '0000' && !user.avatar

    // Find DM channel & last message timestamp
    const dm = dmByRecipient.get(userId)
    let lastMsgTimestamp: number | null = null
    if (dm && dm.lastMessageId) {
      lastMsgTimestamp = getSnowflakeTimestamp(dm.lastMessageId)
    }

    // Mutual guilds count
    const mutualGuilds = client.guilds.cache.filter((g: any) => g.members?.cache?.has(userId)).size

    let eligible = false
    let reason: string | null = null

    if (isDeleted && criteria.removeDeletedAccounts) {
      eligible = true
      reason = 'Conta deletada / desativada'
    } else if (lastMsgTimestamp === null && criteria.removeNoChatHistory) {
      eligible = true
      reason = 'Nenhum histórico de mensagens'
    } else if (lastMsgTimestamp !== null && (now - lastMsgTimestamp) > thresholdMs) {
      eligible = true
      const days = Math.round((now - lastMsgTimestamp) / 86400000)
      reason = `Inativo há ${days} dias`
    } else if (mutualGuilds === 0 && criteria.removeZeroMutualGuilds && (!lastMsgTimestamp || (now - lastMsgTimestamp) > 30 * 86400000)) {
      eligible = true
      reason = '0 servidores mútuos e sem interação recente'
    }

    results.push({
      id: userId,
      username: user.username,
      globalName: user.global_name || null,
      avatarUrl: user.avatar ? `https://cdn.discordapp.com/avatars/${userId}/${user.avatar}.png` : null,
      friendSince: rel.since,
      lastMessageTimestamp: lastMsgTimestamp,
      lastMessageDate: lastMsgTimestamp ? new Date(lastMsgTimestamp).toISOString() : null,
      mutualGuildsCount: mutualGuilds,
      isDeleted,
      eligibleForRemoval: eligible,
      removalReason: reason
    })
  }

  return results
}
```

### 6.3 Social Graph Restore Engine (`server/features/backup/restore.service.ts`)

```typescript
import { discord } from '../../services/discord.service'
import { taskManager } from '../../services/task-manager.service'
import { jitterSleep } from '../../utils/helpers'
import { logger } from '../../core/logger'
import type { AccountRestoreConfig } from '../account-tools/account-tools.types'
import type { AccountBackupData } from './backup.types'

export async function executeAccountRestore(
  backupData: AccountBackupData,
  cfg: AccountRestoreConfig
) {
  const client = discord.getActiveClient()
  const totalSteps = (cfg.restoreFriends ? backupData.friends.length : 0) +
                     (cfg.restoreGuilds ? backupData.guilds.length : 0)

  const task = taskManager.createTask('account-restore', { total: totalSteps })
  taskManager.startTask(task.id)

  ;(async () => {
    let processed = 0
    let addedFriends = 0
    let joinedGuilds = 0

    // 1. RESTORE FRIENDS
    if (cfg.restoreFriends) {
      taskManager.updateProgress(task.id, processed, totalSteps, 'Restaurando amigos...', 'running')

      for (const friend of backupData.friends) {
        if (taskManager.isAborted(task.id)) break

        // Skip if already in friends cache
        if (client.relationships?.cache?.get(friend.id) === 1) {
          processed++
          continue
        }

        try {
          // Attempt PUT request to add friend
          await client.api.users['@me'].relationships[friend.id].put({
            data: {},
            DiscordContext: { location: 'User Profile' }
          })
          addedFriends++
        } catch (err: any) {
          // Detect CAPTCHA challenge
          if (err?.code === 400 && err?.rawError?.captcha_sitekey) {
            logger.warn('RestoreEngine', `CAPTCHA detectado ao adicionar ${friend.username} (${friend.id})`)
            taskManager.updateProgress(task.id, processed, totalSteps, `Pausado: CAPTCHA exigido para ${friend.username}`, 'paused')
            // Emit WS event for user resolution
            discord.emit('captcha_required', {
              sitekey: err.rawError.captcha_sitekey,
              service: err.rawError.captcha_service,
              rqdata: err.rawError.captcha_rqdata,
              taskId: task.id
            })
            break
          }
          logger.warn('RestoreEngine', `Falha ao adicionar amigo ${friend.id}: ${err.message}`)
        }

        processed++
        taskManager.updateProgress(task.id, processed, totalSteps, `Amigos: ${addedFriends}/${backupData.friends.length}`, 'running')
        await jitterSleep(cfg.delayFriends)
      }
    }

    // 2. RESTORE GUILDS (Via Invite Codes)
    if (cfg.restoreGuilds && !taskManager.isAborted(task.id)) {
      taskManager.updateProgress(task.id, processed, totalSteps, 'Reconectando aos servidores...', 'running')

      for (const guild of backupData.guilds) {
        if (taskManager.isAborted(task.id)) break

        if (client.guilds.cache.has(guild.id)) {
          processed++
          continue
        }

        const invite = guild.vanityUrlCode || guild.inviteCode
        if (invite) {
          try {
            await client.api.invites[invite].post({
              DiscordContext: { location: 'Join Guild' }
            })
            joinedGuilds++
          } catch (err) {
            logger.warn('RestoreEngine', `Não foi possível entrar no servidor ${guild.name} via convite ${invite}`)
          }
        }

        processed++
        taskManager.updateProgress(task.id, processed, totalSteps, `Servidores: ${joinedGuilds}/${backupData.guilds.length}`, 'running')
        await jitterSleep(cfg.delayGuilds)
      }
    }

    taskManager.completeTask(task.id)
    logger.success('RestoreEngine', `Restauração concluída: +${addedFriends} amigos, +${joinedGuilds} servidores`)
  })().catch((err) => {
    taskManager.failTask(task.id, String(err))
  })

  return { taskId: task.id, total: totalSteps }
}
```

---

## 7. Express API Routes & Controller Contracts

### 7.1 Routes Registry (`server/routes/account-cleanup.routes.ts`)

```typescript
import { Router } from 'express'
import { z } from 'zod'
import { validate } from '../middleware'
import { asyncHandler, requireConnected } from '../features/_shared'
import { auditFriendsActivity } from '../features/remover-amigos/inactive-friends.service'
import { removerAmigos } from '../features/remover-amigos/remover-amigos.service'
import { removerServidores } from '../features/remover-servidores/remover-servidores.service'
import { fecharDms } from '../features/fechar-dms/fechar-dms.service'
import { exportAccountSnapshot } from '../features/backup/backup.service'
import { executeAccountRestore } from '../features/backup/restore.service'

const router = Router()

// 1. Audit Inactive Friends (Dry-Run / Preview)
const auditSchema = z.object({
  thresholdDays: z.number().min(7).default(90),
  removeDeletedAccounts: z.boolean().default(true),
  removeNoChatHistory: z.boolean().default(true),
  removeZeroMutualGuilds: z.boolean().default(true),
  whitelistUserIds: z.array(z.string()).default([])
})

router.post('/cleanup/audit-inactive', validate(auditSchema), asyncHandler(async (req, res) => {
  const data = await auditFriendsActivity(req.body)
  res.json({ success: true, count: data.length, data })
}))

// 2. Mass Leave Guilds
const massLeaveSchema = z.object({
  tokenId: z.string(),
  delay: z.number().min(500).default(1400),
  guildIds: z.array(z.string()).optional(),
  ignoreOwned: z.boolean().default(true),
  whitelistGuildIds: z.array(z.string()).default([])
})

router.post('/cleanup/leave-guilds', validate(massLeaveSchema), asyncHandler(async (req, res) => {
  await requireConnected(req.body.tokenId)
  const result = await removerServidores(req.body)
  res.status(201).json({ success: true, data: result })
}))

// 3. Mass Close DMs & Group Leave
const massCloseDmsSchema = z.object({
  tokenId: z.string(),
  delay: z.number().min(400).default(1100),
  modo: z.enum(['dms', 'grupos', 'ambos']).default('ambos'),
  whitelistChannelIds: z.array(z.string()).default([]),
  silentGroupLeave: z.boolean().default(true)
})

router.post('/cleanup/close-dms', validate(massCloseDmsSchema), asyncHandler(async (req, res) => {
  await requireConnected(req.body.tokenId)
  const result = await fecharDms(req.body)
  res.status(201).json({ success: true, data: result })
}))

// 4. Export Social Graph Snapshot
router.post('/cleanup/export-backup', asyncHandler(async (req, res) => {
  const result = await exportAccountSnapshot()
  res.json({ success: true, data: result })
}))

// 5. Restore Account Social Graph
const restoreSchema = z.object({
  tokenId: z.string(),
  backupId: z.string(),
  restoreFriends: z.boolean().default(true),
  restoreGuilds: z.boolean().default(false),
  delayFriends: z.number().min(2500).default(5500),
  delayGuilds: z.number().min(1500).default(3000),
  autoSolveCaptcha: z.boolean().default(false)
})

router.post('/cleanup/restore-backup', validate(restoreSchema), asyncHandler(async (req, res) => {
  await requireConnected(req.body.tokenId)
  const result = await executeAccountRestore(req.body)
  res.status(201).json({ success: true, data: result })
}))

export default router
```

---

## 8. Frontend UI/UX Specification (Cyber-Dark HUD)

### 8.1 Visual Hierarchy & Component Tokens

Following PhantomClear V2's design system:
- **Card Substrate:** `bg-[#0e0e14] border border-[#1d1e2a] hover:border-primary/40`
- **Accent Palettes:**
  - `Destructive Crimson` (`#ef4444`): Mass Leave, Mass DM Close, Unfriend triggers.
  - `Neon Emerald` (`#00cc6a`): Backup creation, completed task markers, active state.
  - `Cyber Cyan` (`#00e5ff`): Inactive audit calculations, telemetry gauges, restore progression.
  - `Molten Amber` (`#f59e0b`): Dry-run warnings, owner guild skip banners, CAPTCHA alerts.

### 8.2 Inactive Friends Audit Preview Table (`src/components/inactive-audit-modal.tsx`)

A high-density cyber table allowing granular selection prior to execution:

```tsx
<div className="rounded-xl border border-[#1d1e2a] bg-[#0e0e14] p-4">
  <div className="flex items-center justify-between pb-3 border-b border-[#1d1e2a]">
    <div className="flex items-center gap-2">
      <Users className="w-5 h-5 text-[#00e5ff]" />
      <span className="font-semibold text-white tracking-wide">Amigos Inativos Detectados</span>
      <span className="px-2 py-0.5 text-xs rounded-full bg-[#14141c] text-[#00e5ff] font-mono border border-[#00e5ff]/30">
        {selectedCount} / {auditResults.length} selecionados
      </span>
    </div>
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={toggleSelectAll}>
        {allSelected ? 'Desmarcar Todos' : 'Selecionar Elegíveis'}
      </Button>
      <Button variant="destructive" size="sm" onClick={handleConfirmPurge}>
        <Trash2 className="w-4 h-4 mr-1.5" /> Remover Selecionados
      </Button>
    </div>
  </div>

  <ScrollArea className="h-96 mt-2">
    <table className="w-full text-left text-xs font-mono">
      <thead className="text-[#64748b] border-b border-[#1d1e2a]">
        <tr>
          <th className="p-2">Alvo</th>
          <th className="p-2">Amizade Desde</th>
          <th className="p-2">Último Chat</th>
          <th className="p-2">Servidores Mútuos</th>
          <th className="p-2">Motivo da Inatividade</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[#1d1e2a]/50">
        {auditResults.map(friend => (
          <tr key={friend.id} className={cn("hover:bg-[#14141c]/50 transition-colors", friend.eligibleForRemoval && "text-red-300")}>
            <td className="p-2 flex items-center gap-2">
              <Checkbox checked={selectedIds.has(friend.id)} onCheckedChange={() => toggleSelection(friend.id)} />
              <Avatar className="w-6 h-6">
                <AvatarImage src={friend.avatarUrl} />
                <AvatarFallback>{friend.username[0]}</AvatarFallback>
              </Avatar>
              <span className="font-sans font-medium text-white">{friend.globalName || friend.username}</span>
            </td>
            <td className="p-2 text-[#94a3b8]">{new Date(friend.friendSince).toLocaleDateString()}</td>
            <td className="p-2 text-[#94a3b8]">{friend.lastMessageDate ? new Date(friend.lastMessageDate).toLocaleDateString() : 'Nunca'}</td>
            <td className="p-2 text-center">{friend.mutualGuildsCount}</td>
            <td className="p-2">
              <Badge variant="outline" className="text-red-400 border-red-500/20 bg-red-500/5">
                {friend.removalReason}
              </Badge>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </ScrollArea>
</div>
```

---

## 9. Failure Modes, Edge Cases & Verification Matrix

| Scenario | Discord API Reaction | PhantomClear V2 Handling Engine |
| :--- | :--- | :--- |
| **User is Guild Owner** | `400 Bad Request` (`code: 50007`) | Skip guild if `ignoreOwned: true`; if user opted to delete, prompt for 2FA and call `DELETE /guilds/{id}`. |
| **429 Rate Limited (Too Many Requests)** | `429` with `retry_after: 3.5` | Automatically pause execution for `(retry_after * 1000) + 500ms`, then retry current payload. |
| **Friend Request CAPTCHA Challenge** | `400` with `captcha_sitekey` | Pause task, emit `task:captcha_required` to UI, trigger automatic solver or wait for user input. |
| **Group DM Silent Exit** | `200 OK` (Channel Object) | Append `?silent=true` to suppress public leave notice in group conversation feed. |
| **Deleted User Account** | User avatar null, discriminator `0000` | Flag with 100% confidence for immediate deletion. |
| **User Abort / Cancel Task** | In-flight REST calls | `taskManager.isAborted()` checked before each iteration; drains safely without leaving orphaned state. |
| **Network Socket Drop / ETIMEDOUT** | Network error | Exponential backoff retry (up to 3 attempts with 2s, 4s, 8s backoff) before failing task. |

---

## 10. Summary of Deliverables & Implementation Checklist

- [x] **Complete REST Endpoint Specifications:** Exhaustive HTTP methods, path params, headers (`X-Super-Properties`, `X-Context-Properties`), payload schemas, and response codes.
- [x] **Inactivity Detection Algorithm:** Mathematical formula for Discord snowflake decoding (`(snowflake >> 22) + 1420070400000`), relationship age triage, and mutual server intersection.
- [x] **Backup JSON Schema V2:** Cryptographically organized snapshot format for friends, blocked, pending requests, and joined guilds.
- [x] **Restore Engine Architecture:** Re-friending execution engine with CAPTCHA trap detection and re-invite guild joining.
- [x] **Anti-Detection & Jitter Subsystem:** Gaussian Box-Muller delay randomization and delay recommendation matrix for maximum account safety.
- [x] **Express Backend Service & Routes:** Production-ready TypeScript controller, Express routes, and Zod validation schemas.
- [x] **Cyber-Dark HUD UI Architecture:** Table preview, selective checkboxes, dry-run modal, and real-time progress indicators.
