<div align="center">

<img src="https://raw.githubusercontent.com/Raioshok/PhantomClear/main/public/icon.png" width="130" height="130" alt="PhantomClear Logo" style="border-radius: 28px;" />

# PhantomClear V2

**High-performance, offline-first Discord multi-account orchestration and privacy suite.**  
Built with Electron 33, React 19, Vite 8, and an embedded local Express/WebSocket micro-backend.

<br />

[![Release](https://img.shields.io/github/v/release/Raioshok/PhantomClear?style=for-the-badge&color=00f59b&label=RELEASE)](https://github.com/Raioshok/PhantomClear/releases/latest)
&nbsp;
[![Platform](https://img.shields.io/badge/PLATFORM-WINDOWS%20x64-00d2ff?style=for-the-badge&logo=windows)](https://github.com/Raioshok/PhantomClear/releases/latest)
&nbsp;
[![License](https://img.shields.io/badge/LICENSE-GPL--3.0-5865F2?style=for-the-badge)](./LICENSE)
&nbsp;
[![Zero Telemetry](https://img.shields.io/badge/PRIVACY-100%25%20LOCAL-black?style=for-the-badge)](https://github.com/Raioshok/PhantomClear)

<br />

### [⬇️ Download Latest Installer (v1.4.4)](https://github.com/Raioshok/PhantomClear/releases/latest)

<sub>Available as standalone NSIS Setup (`PhantomClear-Setup-1.4.4.exe`) and zero-install Portable (`PhantomClear-Portable-1.4.4.exe`).</sub>

</div>

---

## ⚡ Overview

**PhantomClear V2** is a modular desktop toolkit designed for deep account management, bulk data purging, server maintenance, call utilities, and real-time monitoring across multiple Discord tokens simultaneously.

- 🔒 **100% Local & Isolated** — All network operations run directly on `127.0.0.1:3777`. Zero external telemetries, no cloud intermediaries, and no analytics collection.
- ⚡ **Local Gateway Engine** — Vendored `discord.js-selfbot-v13` engine (`packages/discord.js-selfbot-v13`) patched for modern Discord client build signatures (`455964`), dynamic launch signatures (`launch_signature: randomUUID()`), and updated WebSocket properties.
- 👥 **Multi-Account Manager** — Instant token switching with local persistence, health validation, avatar caching, and account state checks.
- 📡 **Reactive Real-Time UI** — Bidirectional WebSocket bridge delivering sub-millisecond progress updates, rate-limit queue telemetry, and task cancellation.
- 🎨 **Adaptive Theming Engine** — Obsidian default palette (`#08080b`), Windows XP retro mode, Manga, and Neo-Brutalist design systems.

---

## 🧰 Core Modules & Capabilities

### 1. 💬 Message & Data Management
| Tool | Description |
| :--- | :--- |
| **Limpar DM** | Targeted deletion of your messages in private conversations or specific channels with custom speed adjustments. |
| **Limpar DMs Abertas** | Batch traversal and clean-up across all active direct messages with automatic rate-limit throttling. |
| **Limpar Package** | Ingests official Discord GDPR data archives (`package.zip` / JSON), extracts message IDs across entire account histories, and scrubs them automatically. |
| **Analise de Package** | Deep analytics on user message frequency, top DM interlocutors, guild activity, and attachment metrics. |
| **Backup de Conversas** | Forensic export of conversation histories including text, attachments, embeds, and stickers to offline JSON. |

### 2. 🏠 Guild & Social Operations
| Tool | Description |
| :--- | :--- |
| **Clonar Servidor** | Replicates complete guild structures: categories, channels, permissions, roles, and emojis into a target server. |
| **Sair de Servidores** | Mass server departure with granular whitelist exemptions. |
| **Remover Amigos** | Batch friend list pruner with selective preservation. |
| **Scraper de Ícones** | Automated harvester for guild icons, banners, and channel media pipelines. |

### 3. 📞 VoIP & Audio Engineering
| Tool | Description |
| :--- | :--- |
| **Farm Call** | Automated persistent voice-channel presence maintainer with auto-reconnect and randomized keep-alives. |
| **Call Management** | Batch move, disconnect, mute, and deafen operations with voice-state introspection. |
| **Listar Participantes** | Real-time participant state auditor (streaming state, deaf/mute flags, session duration). |

### 4. 🛰️ Real-Time Intelligence & Auditing
| Tool | Description |
| :--- | :--- |
| **Monitoramento de DMs** | Background listeners capturing incoming/outgoing messages, mentions, and ghost-ping events. |
| **Auto-Media Mirror** | Automatic offline downloader for monitored channel and DM media attachments. |
| **Token Scanner** | Automated local discovery for active Discord client tokens residing in desktop leveldb sessions. |

### 5. 🎮 Discord Rich Presence (RPC)
| Tool | Description |
| :--- | :--- |
| **Application ID Customizer** | Connects directly to custom registered Discord Developer applications via local IPC. |
| **Live Presence Editor** | Customizable game name, state, details, timestamps, buttons, and direct asset resolution with Imgur album normalization. |

---

## 🚀 Quickstart

### Pre-built Binaries (Recommended)
1. Download `PhantomClear-Setup-1.4.4.exe` from [GitHub Releases](https://github.com/Raioshok/PhantomClear/releases/latest).
2. Run the installer and launch **PhantomClear**.
3. Add your token in the **Contas** modal (or utilize the built-in **Scanner de Tokens**).
4. Select your module and execute actions with real-time logging.

### Building From Source
Ensure you have **Node.js 20+** and **pnpm** installed:

```bash
# Clone the repository
git clone https://github.com/Raioshok/PhantomClear.git
cd PhantomClear

# Install dependencies (respecting local vendor packages)
pnpm install

# Run development environment (Vite frontend + Electron + Express API)
npm run dev:electron

# Compile production frontend & electron bundle
npm run build
npx tsc -p tsconfig.electron.json

# Package Windows NSIS & Portable executables
npm run build:electron
```

The resulting binaries will be output to `release/`:
* `PhantomClear-Setup-1.4.4.exe`
* `PhantomClear-Portable-1.4.4.exe`

---

## 🧱 Architecture

```
PhantomClear V2
├── electron/                  # Electron main & preload scripts
│   ├── main.ts                # Window lifecycle, IPC routing, tray management
│   ├── preload.ts             # ContextBridge isolation interface
│   └── updater.ts             # GitHub Release auto-update poller
├── server/                    # Embedded local Express & WebSocket server (127.0.0.1:3777)
│   ├── core/                  # HTTP app initialization & WebSocket pub-sub
│   ├── features/              # Modular task implementations (purging, backup, calls)
│   ├── services/              # Discord service, RPC client, task workers, storage
│   └── routes/                # REST endpoints consumed by the UI
├── src/                       # React 19 Frontend (Vite + Tailwind CSS + Lucide)
│   ├── app/                   # App routes & dashboard views
│   ├── components/            # Reusable UI primitives, modals & navigation
│   └── lib/                   # API clients, WebSocket hooks, and theme engine
└── packages/
    └── discord.js-selfbot-v13 # Vendored selfbot engine with modernized gateway patch
```

---

## 🔒 Security & Privacy Notice

* **Zero Cloud Architecture**: PhantomClear operates strictly as a local client. All tokens, configuration files, and downloaded media remain exclusively within `%APPDATA%\PhantomClear`.
* **Token Isolation**: Authentication tokens are dispatched only to the official Discord REST API (`https://discord.com/api/v10`) and Discord Gateway WebSockets (`wss://gateway.discord.gg`).
* **Disclaimer**: Self-bots and account automation violate Discord's [Terms of Service](https://discord.com/terms). This software is provided for educational and administrative auditing purposes. Use responsibly.

---

<div align="center">

Developed and maintained by **[@Raioshok](https://github.com/Raioshok)**  
Distributed under the **GNU General Public License v3.0**.

</div>
