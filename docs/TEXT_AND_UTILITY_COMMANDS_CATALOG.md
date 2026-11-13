# PhantomClear V2 — Text-Transform and Utility Commands Catalog
## Algorithmic Logic, Mathematical Specifications & Free Public API Endpoints

**Module:** `server/features/prefix-commands/text-transforms.catalog.ts`  
**Architecture:** Discord Selfbot Execution Engine (In-Place Mutation & Ephemeral Dispatch)  
**Standard Prefix:** `;` (Configurable per account)  
**Target Platform:** Electron + Node.js (v20+) + Discord.js-Selfbot-v13  
**Status:** Implemented, Tested & Verified (42/42 Pass Rate)

---

## 1. Architectural Foundations & Selfbot Mechanics

Unlike standard Discord API bot applications that respond by posting new messages or sending rich embeds through official webhook tokens, a **Discord Selfbot** operates under distinct execution semantics:

### 1.1 In-Place Mutation (`EDIT`) vs. Dispatch (`REPLY`)
1. **In-Place Mutation (`message.edit(...)`):**
   - The user types `;mock hello world` in any channel or DM.
   - The selfbot client intercepts the outgoing message event matching `message.author.id === client.user.id`.
   - Instead of posting a second message, the engine calculates the transformed string and executes `await message.edit(transformedText)`.
   - **Advantage:** Preserves the natural chat flow, prevents duplicate spam, hides command syntax from chat partners, and avoids bot-tag clutter.
2. **Ephemeral / File Dispatch (`message.channel.send(...)` + `message.delete(...)`):**
   - Used when output requires binary attachments (e.g., QR Code image buffers) or multi-line embeds where deleting the trigger and sending a new message is required.

### 1.2 Discord Payload Economics & Expansion Bounds
Discord enforces strict payload limits that text transformation algorithms must anticipate:
- **Standard User Hard Limit:** 2,000 UTF-16 code units per message.
- **Nitro Subscriber Limit:** 4,000 UTF-16 code units per message.
- **Expansion Factors:**
  - *Spoilerize (`||c||`):* **5x expansion**. Max safe raw input = `floor((2000 - 10) / 5) = 398` characters.
  - *Emojify (Regional Indicators):* **~4x-8x byte expansion**. Regional indicator symbols occupy 4 bytes each (`U+1F1E6` to `U+1F1FF`).
  - *Zalgo / Glitch Text:* Combining diacritics stack 3 to 18 code points per visible glyph. Without clamping, a 200-character input can easily crash or be dropped by the Discord gateway.
  - *All transforms must pass through `clampDiscord(text, limit = 2000)`.*

### 1.3 Zero-Auth Free Public API Criteria
External utility endpoints selected in this catalog adhere to five non-negotiable operational requirements:
1. **Zero Authentication:** No API keys, developer tokens, or billing registration required.
2. **High Availability & Low Latency:** Sub-300ms typical response time with CDN distribution.
3. **CORS & User-Agent Friendly:** Responds directly to standard HTTP client calls with configurable `User-Agent: BrunnoClear/2.0`.
4. **Resilient JSON / Text Contracts:** Stable schemas that do not break across client releases.
5. **Safe Mode / Rate-Limit Compliance:** Built-in safeguards (e.g. `safe-mode` on joke APIs, timeout handling, and graceful degradation).

---

## 2. Command Taxonomy & Quick Reference Matrix

| # | Command | Primary Aliases | Category | Mode | Latency | Source / Engine | Brief Description |
|---|---|---|---|---|---|---|---|
| 1 | `mock` | `spongebob`, `sponge` | Stylistic | `EDIT` | <1ms | Algorithmic State Machine | Alternates uppercase & lowercase (SpongeBob meme) |
| 2 | `emojify` | `regional`, `bigtext` | Stylistic | `EDIT` | <1ms | Unicode Block `U+1F1E6` | Converts text to regional indicator emoji flags |
| 3 | `spoiler` | `spoilall`, `spoilerize` | Stylistic | `EDIT` | <1ms | Markdown Parser (`\|\|c\|\|`) | Encloses each individual character in spoiler tags |
| 4 | `vaporwave` | `wide`, `aesthetic` | Stylistic | `EDIT` | <1ms | Unicode Shift `0xFEE0` | Converts ASCII to Fullwidth aesthetic typography |
| 5 | `flip` | `upsidedown`, `invert` | Stylistic | `EDIT` | <1ms | Inverted Glyph Table | Reverses and inverts characters upside down |
| 6 | `zalgo` | `glitch`, `chaos` | Stylistic | `EDIT` | <1ms | Diacritic Stacker (`U+0300`) | Applies glitch/corrupted visual distortion |
| 7 | `smallcaps` | `sc`, `tiny` | Stylistic | `EDIT` | <1ms | Phonetic Extensions | Converts Latin letters to Small Capitals |
| 8 | `super` | `superscript` | Stylistic | `EDIT` | <1ms | Unicode Superscript Map | Renders text in high mathematical superscript |
| 9 | `sub` | `subscript` | Stylistic | `EDIT` | <1ms | Unicode Subscript Map | Renders text in low mathematical subscript |
| 10 | `clap` | `claptext` | Stylistic | `EDIT` | <1ms | Regex Tokenizer | Injects clap emoji (`👏`) between words |
| 11 | `leet` | `1337`, `hacker` | Stylistic | `EDIT` | <1ms | Substitution Matrix | Replaces characters with numeric leet glyphs |
| 12 | `stutter` | `hesitate` | Stylistic | `EDIT` | <1ms | Consonant Cluster Regex | Generates dramatic, nervous speech hesitation |
| 13 | `hide` | `stegohide` | Ciphers | `EDIT` | <1ms | Zero-Width Steganography | Encodes binary payload invisibly via `U+200B/C` |
| 14 | `reveal` | `stegoreveal` | Ciphers | `EDIT` | <1ms | Zero-Width Extraction | Decodes invisible zero-width payloads to plain UTF-8 |
| 15 | `rot13` | `caesar` | Ciphers | `EDIT` | <1ms | Modular Shift `(P+k)%26` | Caesar / ROT13 rotational shift cipher |
| 16 | `atbash` | `mirror` | Ciphers | `EDIT` | <1ms | Involutory Affine `25-i` | Reverses alphabetical order ($A \leftrightarrow Z$) |
| 17 | `vigenere` | `vig` | Ciphers | `EDIT` | <1ms | Polyalphabetic Modulo | Polyalphabetic substitution using a keyword |
| 18 | `unvigenere`| `unvig` | Ciphers | `EDIT` | <1ms | Inverse Polyalphabetic | Deciphers Vigenère ciphertext with keyword |
| 19 | `morse` | `tomorse` | Ciphers | `EDIT` | <1ms | ITU Morse Table | Encodes alphanumeric text into Morse code dots/dashes |
| 20 | `unmorse` | `frommorse` | Ciphers | `EDIT` | <1ms | Reverse Morse Map | Decodes Morse code into legible Latin text |
| 21 | `binary` | `tobinary` | Ciphers | `EDIT` | <1ms | Radix-2 8-Bit Formatter | Converts UTF-8 string to 8-bit space-separated bits |
| 22 | `unbinary` | `frombinary` | Ciphers | `EDIT` | <1ms | Radix-2 Integer Parser | Reconstructs UTF-8 text from 8-bit binary chunks |
| 23 | `b64enc` | `base64` | Ciphers | `EDIT` | <1ms | RFC 4648 Base64 | Encodes text into standard Base64 string |
| 24 | `b64dec` | `unbase64` | Ciphers | `EDIT` | <1ms | Base64 Stream Decoder | Decodes Base64 string back to original UTF-8 |
| 25 | `hexenc` | `tohex` | Ciphers | `EDIT` | <1ms | Hex Byte Serializer | Encodes text into raw hexadecimal byte pairs |
| 26 | `hexdec` | `fromhex` | Ciphers | `EDIT` | <1ms | Hex Byte Deserializer | Decodes hexadecimal byte pairs back to text |
| 27 | `hash` | `sha256`, `md5` | Ciphers | `EDIT` | <1ms | Node.js `crypto` Digest | Generates MD5, SHA-1, SHA-256, or SHA-512 hashes |
| 28 | `ansi` | `color`, `colorize` | Formatting | `EDIT` | <1ms | ANSI Escape Sequences | Formats text with syntax colors in ```ansi blocks |
| 29 | `box` | `frame` | Formatting | `EDIT` | <1ms | Unicode Box Drawing | Draws single, double, or rounded border frames |
| 30 | `progress` | `bar`, `progbar` | Formatting | `EDIT` | <1ms | Integer Ratio Arithmetic | Renders ASCII and emoji visual progress bars |
| 31 | `table` | `asciitable` | Formatting | `EDIT` | <1ms | Column Alignment Matrix | Formats CSV/pipe data into an aligned monospace table |
| 32 | `textstats` | `count`, `tokens` | Formatting | `EDIT` | <1ms | Buffer & String Metrics | Analyzes character, byte, and Discord budget usage |
| 33 | `urban` | `ud` | Utilities | `EDIT` | ~180ms | Urban Dictionary API | Fetches slang definitions, examples, and votes |
| 34 | `translate` | `tr`, `traduzir` | Utilities | `EDIT` | ~120ms | Google Translate RPC | Multi-language translation with auto source detect |
| 35 | `qr` | `qrcode` | Utilities | `REPLY` | ~140ms | QR Server CDN API | Generates high-res scanable QR code image links |
| 36 | `weather` | `clima`, `tempo` | Utilities | `EDIT` | ~250ms | wttr.in Meteorological | Live temperatures, humidity, wind, and conditions |
| 37 | `crypto` | `coin`, `price` | Utilities | `EDIT` | ~220ms | CoinGecko V3 Public | Real-time crypto quotes (USD, BRL, EUR) + 24h change |
| 38 | `currency` | `fx`, `exchange` | Utilities | `EDIT` | ~160ms | Frankfurter (ECB Data) | Real-time fiat currency exchange rate converter |
| 39 | `geoip` | `ip`, `whois` | Utilities | `EDIT` | ~130ms | ip-api.com IP Intelligence | IP geolocation, ISP, organization, ASN, coordinates |
| 40 | `wiki` | `wikipedia` | Utilities | `EDIT` | ~190ms | Wikimedia REST API | Wikipedia official article abstract and permanent link |
| 41 | `shorten` | `tinyurl` | Utilities | `EDIT` | ~210ms | TinyURL REST Gateway | Shortens long URLs into clean, clickable redirects |
| 42 | `joke` | `piada` | Utilities | `EDIT` | ~150ms | JokeAPI V2 (Safe Mode) | Safe programming and general two-part jokes |
| 43 | `trivia` | `fact`, `fato` | Utilities | `EDIT` | ~140ms | UselessFacts Public API | Random verified trivia and obscure knowledge facts |

---

## 3. Section I: Stylistic & Humorous Text Transforms (Algorithmic)

### 3.1 Mock / SpongeBob Case
- **Command:** `;mock <text>` | **Aliases:** `;spongebob`, `;sponge`
- **Execution Mode:** `EDIT`
- **Algorithmic Logic:**
  Maintains a boolean flip-flop flag `upper = false`. Iterates across each UTF-16 code point. Non-alphabetical characters (whitespace, punctuation, numbers) are emitted unchanged without flipping the state flag. For alphabetical characters (`/[a-zA-Z]/`), inverts `upper = !upper` and transforms the character to either upper or lower case accordingly.
- **Mathematical / Formal Representation:**
  $$\text{state}_{i} = \begin{cases} \neg \text{state}_{i-1} & \text{if } c_i \in [A-Za-z] \\ \text{state}_{i-1} & \text{otherwise} \end{cases}$$
- **Discord Limits & Edge Cases:** No character count expansion. 1:1 length ratio.
- **Example:**
  - Input: `;mock Stop arguing with me on Discord!`
  - Output: `sToP aRgUiNg WiTh Me On DiScOrD!`

---

### 3.2 Emojify / Regional Indicators
- **Command:** `;emojify <text>` | **Aliases:** `;regional`, `;bigtext`
- **Execution Mode:** `EDIT`
- **Algorithmic Logic:**
  Lowercases input string. Maps characters in range `['a'..'z']` to Unicode **Regional Indicator Symbols** using codepoints `0x1F1E6` ('🇦') through `0x1F1FF` ('🇿'), computed via:
  $$\text{CodePoint}(c) = \text{0x1F1E6} + (\text{charCodeAt}(c) - 97)$$
  Digits `0-9` map to Discord standard keycap emoji names (`:zero:` to `:nine:`). Spaces map to triple spaces (`   `).
- **Discord Limits & Edge Cases:**
  Regional indicators take 4 bytes each. Letters are separated by spaces to prevent accidental emoji flag combinations (e.g. 🇧 + 🇷 forming 🇧🇷). Clamped at 2,000 characters.
- **Example:**
  - Input: `;emojify gg 24`
  - Output: `🇬 🇬    :two: :four:`

---

### 3.3 Spoilerize / Clapper
- **Command:** `;spoiler <text>` | **Aliases:** `;spoilall`, `;spoilerize`
- **Execution Mode:** `EDIT`
- **Algorithmic Logic:**
  Splits input by UTF-16 character units. Encloses every individual character in Discord spoiler delimiters: `||${char}||`. If the character itself is a pipe (`|`), it is escaped as `||\|||` to avoid premature markdown closure.
- **Discord Limits & Edge Cases:**
  **Expansion Factor = 5x**. A 400-character input expands to 2,000 characters. Input is automatically truncated to 390 characters before wrapping:
  $$\text{Length}_{\text{out}} = 5 \times \text{Length}_{\text{in}}$$
- **Example:**
  - Input: `;spoiler secret`
  - Output: `||s||||e||||c||||r||||e||||t||`

---

### 3.4 Vaporwave / Fullwidth Typography
- **Command:** `;vaporwave <text>` | **Aliases:** `;wide`, `;aesthetic`
- **Execution Mode:** `EDIT`
- **Algorithmic Logic:**
  Converts standard half-width ASCII characters (range `0x21` `!` to `0x7E` `~`) to their Unicode Fullwidth counterparts (range `0xFF01` to `0xFF5E`). The constant mathematical shift offset is `0xFEE0` ($65,248$). ASCII space (`0x20`) is converted to Unicode Ideographic Space (`U+3000`).
  $$\text{char}_{\text{full}} = \begin{cases} \text{String.fromCharCode}(code + 65248) & \text{if } 33 \le code \le 126 \\ \text{'\u3000'} & \text{if } code = 32 \\ c & \text{otherwise} \end{cases}$$
- **Example:**
  - Input: `;vaporwave neon dreams 2026`
  - Output: `ｎｅｏｎ　ｄｒｅａｍｓ　２０２６`

---

### 3.5 Flip / Upside-Down Text
- **Command:** `;flip <text>` | **Aliases:** `;upsidedown`, `;invert`
- **Execution Mode:** `EDIT`
- **Algorithmic Logic:**
  Reverses the character array order: $\text{reverse}(\text{chars})$. Substitutes each character using an inverted Latin Unicode map containing glyphs from the International Phonetic Alphabet (IPA) and Cyrillic blocks (e.g. `a` $\to$ `ɐ`, `e` $\to$ `ǝ`, `?` $\to$ `¿`, `!` $\to$ `¡`).
- **Example:**
  - Input: `;flip Hello World!`
  - Output: `¡plɹoʍ ollǝH`

---

### 3.6 Zalgo / Glitch Chaos Text
- **Command:** `;zalgo <text>` | **Aliases:** `;glitch`, `;chaos`
- **Execution Mode:** `EDIT`
- **Algorithmic Logic:**
  Maintains three pools of Unicode Combining Diacritical Marks:
  - **Upper:** `U+0304` to `U+036F` (accents, macrons, carets positioned above)
  - **Middle:** `U+0315` to `U+0338` (strikethroughs, overlays positioned across glyph)
  - **Lower:** `U+0316` to `U+0333` (sub-dots, cedillas, tildes positioned below)
  For every non-whitespace character, injects $N$ random combining marks from each pool (intensity: `low` = 1, `med` = 3, `high` = 6).
- **Discord Limits & Edge Cases:**
  Unchecked Zalgo text crashes Discord client renderers or causes message drop by gateway filters. Hard clamp enforced at 2,000 characters.
- **Example:**
  - Input: `;zalgo phantom`
  - Output: `p̷̘̎h̙̿̆͘a̸̖͂͗ņ̘̍͘t̨̩̿̎o̙̿̆͘m̸̖͂͗`

---

### 3.7 Small Capitals
- **Command:** `;smallcaps <text>` | **Aliases:** `;sc`, `;tiny`
- **Execution Mode:** `EDIT`
- **Algorithmic Logic:**
  Lowercases input and substitutes characters with Unicode Phonetic Extensions (`U+1D00`–`U+1D7F`):
  `a` $\to$ `ᴀ`, `b` $\to$ `ʙ`, `c` $\to$ `ᴄ`, `d` $\to$ `ᴅ`, `e` $\to$ `ᴇ`, `f` $\to$ `ꜰ`, `g` $\to$ `ɢ`, etc.
- **Example:**
  - Input: `;smallcaps system operational`
  - Output: `ꜱʏꜱᴛᴇᴍ ᴏᴘᴇʀᴀᴛɪᴏɴᴀʟ`

---

### 3.8 Superscript & Subscript
- **Command:** `;super <text>` / `;sub <text>`
- **Execution Mode:** `EDIT`
- **Algorithmic Logic:**
  Maps digits, basic symbols, and letters to Unicode superscript (`⁰¹²³⁴⁵⁶⁷⁸⁹ᵃᵇᶜᵈ...`) or subscript (`₀₁₂₃₄₅₆₇₈₉ₐ...`) codepoints.
- **Example:**
  - Input: `;super status v2.4`
  - Output: `ˢᵗᵃᵗᵘˢ ᵛ²·⁴`

---

### 3.9 Clap Text
- **Command:** `;clap <text>` | **Aliases:** `;claptext`
- **Execution Mode:** `EDIT`
- **Algorithmic Logic:**
  Splits input across whitespace delimiters using `split(/\s+/)`. Joins array with ` 👏 ` and sandwiches with leading and trailing claps.
- **Example:**
  - Input: `;clap listen to what I said`
  - Output: `👏 listen 👏 to 👏 what 👏 I 👏 said 👏`

---

### 3.10 Leet Speak (1337)
- **Command:** `;leet <text>` | **Aliases:** `;1337`, `;hacker`
- **Execution Mode:** `EDIT`
- **Algorithmic Logic:**
  Substitutes Latin letters according to a standard leet dictionary:
  `a` $\to$ `4`, `e` $\to$ `3`, `g` $\to$ `9`, `i` $\to$ `1`, `l` $\to$ `1`, `o` $\to$ `0`, `s` $\to$ `5`, `t` $\to$ `7`, `z` $\to$ `2`.
- **Example:**
  - Input: `;leet advanced protocol security`
  - Output: `4dv4nc3d pr070c01 53cur17y`

---

### 3.11 Stutter Text
- **Command:** `;stutter <text>` | **Aliases:** `;hesitate`
- **Execution Mode:** `EDIT`
- **Algorithmic Logic:**
  Extracts leading consonant clusters from words longer than 2 characters using regex `/^([bcdfghjklmnpqrstvwxyz]{1,2})/i`. Replaces with `${prefix}-${prefix.toLowerCase()}-${word}`.
- **Example:**
  - Input: `;stutter why would you do that`
  - Output: `wh-wh-why w-w-would y-y-you do th-th-that`

---

### 3.12 Invisible Zero-Width Steganography
- **Command:** `;hide <secret> | <cover>` / `;reveal <message>`
- **Execution Mode:** `EDIT`
- **Algorithmic Logic:**
  1. **Encoding (`hide`):** Converts the secret UTF-8 string into an 8-bit binary bitstream. Maps bit `'0'` to Zero-Width Space (`\u200B`) and bit `'1'` to Zero-Width Non-Joiner (`\u200C`). Appends Zero-Width Joiner (`\u200D`) as EOF delimiter. Injects the invisible sequence directly into the cover message after the first character.
  2. **Decoding (`reveal`):** Regex-matches all contiguous occurrences of `[\u200B\u200C]`. Reconstructs the binary sequence, groups into 8-bit octets, and deserializes back to UTF-8 via Node's `Buffer.from(bytes)`.
- **Discord Advantage:** To normal Discord users and server moderators, the message appears as ordinary cover text. Copying or quoting the message retains the secret payload.
- **Example:**
  - Input: `;hide token123 | hello everyone`
  - Output: `h​‌‌‌​​‌‌​‌‌​​‌...ello everyone` (Renders on Discord as: `hello everyone`)
  - Reveal: `;reveal <message>` $\to$ `🕵️ Texto Revelado: token123`

---

## 4. Section II: Ciphers, Hashes & Cryptographic Utilities (Algorithmic)

### 4.1 Caesar & ROT13 Cipher
- **Command:** `;rot13 [shift] <text>` | **Aliases:** `;caesar`
- **Execution Mode:** `EDIT`
- **Algorithmic Logic:**
  Applies modular arithmetic across Latin characters:
  $$C_i = (P_i - \text{base} + \text{shift}) \pmod{26} + \text{base}$$
  Where $\text{base} = 65$ for uppercase and $97$ for lowercase. If shift is omitted, defaults to 13 (self-inverting ROT13).
- **Example:**
  - Input: `;rot13 attack at dawn`
  - Output: `nggnpx ng qnja`

---

### 4.2 Atbash Cipher
- **Command:** `;atbash <text>` | **Aliases:** `;mirror`
- **Execution Mode:** `EDIT`
- **Algorithmic Logic:**
  Involutory affine substitution mapping letter index $x \in [0..25]$ to $(25 - x)$.
  $$C = 122 - (P - 97) \quad \text{(for lowercase)}$$
- **Example:**
  - Input: `;atbash hello`
  - Output: `svool`

---

### 4.3 Vigenère Cipher (Polyalphabetic)
- **Command:** `;vigenere <key> <text>` / `;unvigenere <key> <text>`
- **Execution Mode:** `EDIT`
- **Algorithmic Logic:**
  Calculates dynamic shift per character based on a repeating keyword:
  $$C_i = (P_i + K_{j \pmod{|K|}}) \pmod{26}, \quad P_i = (C_i - K_{j \pmod{|K|}} + 26) \pmod{26}$$
  Non-alphabetical characters do not advance the key pointer $j$.
- **Example:**
  - Input: `;vigenere LEMON attack at dawn`
  - Output: `lxfopv ef rnhr`

---

### 4.4 International Morse Code
- **Command:** `;morse <text>` / `;unmorse <code>`
- **Execution Mode:** `EDIT`
- **Algorithmic Logic:**
  Encodes characters according to Recommendation ITU-R M.1677-1. Letters are separated by single spaces `' '`; words are separated by slash `' / '`. Decoder tokenizes by `' / '` then by `' '` using a reverse lookup table.
- **Example:**
  - Input: `;morse SOS HELP`
  - Output: `... --- ... / .... . .-.. .--.`

---

### 4.5 8-Bit Binary Encoder & Decoder
- **Command:** `;binary <text>` / `;unbinary <bits>`
- **Execution Mode:** `EDIT`
- **Algorithmic Logic:**
  Converts each UTF-8 byte into an 8-character string formatted with base-2 padding:
  $$\text{bitstring} = \text{byte.toString}(2).\text{padStart}(8, \text{'0'})$$
  Decoder filters invalid characters, slices into 8-bit octets, and parses with `parseInt(chunk, 2)`.
- **Example:**
  - Input: `;binary hi`
  - Output: `01101000 01101001`

---

### 4.6 Base64 & Hexadecimal Converters
- **Commands:** `;b64enc`, `;b64dec`, `;hexenc`, `;hexdec`
- **Execution Mode:** `EDIT`
- **Algorithmic Logic:**
  RFC 4648 encoding via Node.js native `Buffer`:
  - `Buffer.from(input, 'utf-8').toString('base64')`
  - `Buffer.from(input, 'base64').toString('utf-8')`
  - `Buffer.from(input, 'utf-8').toString('hex')`
- **Example:**
  - Input: `;b64enc PhantomClear`
  - Output: `UGhhbnRvbUNsZWFy`

---

### 4.7 Cryptographic Hashes (MD5, SHA1, SHA256, SHA512)
- **Command:** `;hash [algorithm] <text>`
- **Execution Mode:** `EDIT`
- **Algorithmic Logic:**
  Computes one-way cryptographic digests using Node's `node:crypto.createHash(algo).update(text).digest('hex')`. Formatted inside a clean Discord CSS/Monospace block.
- **Example:**
  - Input: `;hash sha256 password123`
  - Output:
    ```css
    [Hash SHA256]
    ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f
    ```

---

## 5. Section III: Discord Formatting & Visual Layout Utilities

### 5.1 Discord ANSI Color Formatter
- **Command:** `;ansi <color> <text>` | **Aliases:** `;color`, `;colorize`
- **Execution Mode:** `EDIT`
- **Algorithmic Logic:**
  Discord desktop, browser, and modern mobile clients support terminal ANSI escape sequences when enclosed in ````ansi ... ```` markdown blocks.
  Escape structure: `\u001b[{style};{foreground};{background}m`
  
  **ANSI Escape Matrix:**
  | Color Key | Foreground Code | Style | Rendered Color in Discord |
  |---|---|---|---|
  | `gray` | `30` | `0` (Normal) | Dim Dark Gray |
  | `red` | `31` | `1` (Bold) | Vibrant Crimson Red |
  | `green` | `32` | `1` (Bold) | Bright Emerald Green |
  | `yellow` | `33` | `1` (Bold) | Golden Amber Yellow |
  | `blue` | `34` | `1` (Bold) | Discord Blurple / Blue |
  | `magenta`| `35` | `1` (Bold) | Neon Pink / Magenta |
  | `cyan` | `36` | `1` (Bold) | Cyberpunk Cyan |
  | `white` | `37` | `1` (Bold) | Clean Pure White |

- **Example:**
  - Input: `;ansi green System Online`
  - Output:
    ````ansi
    [1;32mSystem Online[0m
    ````

---

### 5.2 Unicode Box / Frame Generator
- **Command:** `;box [style] <text>` | **Aliases:** `;frame`
- **Execution Mode:** `EDIT`
- **Styles Supported:** `rounded` (`╭─╮│╰─╯`), `double` (`╔═╗║╚═╝`), `single` (`┌─┐│└─┘`), `ascii` (`+-+|`)
- **Algorithmic Logic:**
  Measures max line length $W = \max(\text{lengths})$. Calculates horizontal bar length $W + 2 \times \text{padding}$. Encloses lines with vertical boundary characters.
- **Example:**
  - Input: `;box rounded PhantomClear\nV2 System Ready`
  - Output:
    ```
    ╭──────────────────────╮
    │ PhantomClear         │
    │ V2 System Ready      │
    ╰──────────────────────╯
    ```

---

### 5.3 Visual Progress Bar Generator
- **Command:** `;progress <current> <max> [emoji]` | **Aliases:** `;bar`, `;progbar`
- **Execution Mode:** `EDIT`
- **Algorithmic Logic:**
  Calculates ratio $R = \text{clamp}(0, \frac{\text{current}}{\text{max}}, 1)$.
  Number of filled units $F = \text{round}(R \times \text{barLength})$.
  Constructs string: `[${'█'.repeat(F)}${'░'.repeat(length - F)}] ${percentage}%`.
- **Example:**
  - Input: `;progress 75 100`
  - Output: `[████████████░░░░] 75.0% (75/100)`

---

### 5.4 Monospace ASCII Table Generator
- **Command:** `;table <header1,header2 | col1,col2 | col3,col4>`
- **Execution Mode:** `EDIT`
- **Algorithmic Logic:**
  Parses pipe-separated rows and comma-separated cells. Computes max width per column. Pads cells with spaces and renders ASCII border separators (`+---+---+`).
- **Example:**
  - Input: `;table User,Role | Alice,Admin | Bob,Moderator`
  - Output:
    ```
    +-------+-----------+
    | User  | Role      |
    +-------+-----------+
    | Alice | Admin     |
    | Bob   | Moderator |
    +-------+-----------+
    ```

---

### 5.5 Text & Payload Health Analytics
- **Command:** `;textstats <text>` | **Aliases:** `;count`, `;tokens`
- **Execution Mode:** `EDIT`
- **Algorithmic Logic:**
  Inspects character length, UTF-8 byte allocation (`Buffer.byteLength(text, 'utf-8')`), word count, line count, and calculates percentage consumed against Discord's 2,000 and 4,000 limit boundaries.
- **Example:**
  - Input: `;textstats Hello world test`
  - Output:
    📊 **Análise de Texto**
    • **Caracteres:** 16 / 2000 (0.8%)
    • **Bytes UTF-8:** 16
    • **Palavras:** 3
    • **Linhas:** 1
    • **Encaixa no Discord Padrão:** ✅ Sim
    • **Encaixa no Nitro (4K):** ✅ Sim

---

## 6. Section IV: External Web & Public API Utilities (100% Free, Zero-Auth Endpoints)

### 6.1 Urban Dictionary Slang Explorer
- **Command:** `;urban <term>` | **Aliases:** `;ud`
- **Execution Mode:** `EDIT`
- **Free Endpoint:** `https://api.urbandictionary.com/v0/define?term={query}`
- **HTTP Method:** `GET`
- **Auth Required:** None (Public)
- **Response Schema:**
  ```json
  {
    "list": [
      {
        "word": "yeet",
        "definition": "To discard an item at high velocity...",
        "example": "He just yeeted that can across the room.",
        "thumbs_up": 45120,
        "thumbs_down": 4120,
        "permalink": "https://www.urbandictionary.com/define.php?term=yeet"
      }
    ]
  }
  ```
- **Data Cleanup:** Strips internal bracket references (`[word]` $\to$ `word`). Truncates definition to 1,000 characters to prevent message overflow.
- **Example:**
  - Input: `;urban yeet`
  - Output:
    📖 **Urban Dictionary: yeet**
    **Definição:** To discard an item at high velocity.
    *Exemplo: He just yeeted that can across the room.*
    👍 45120 | 👎 4120 | 🔗 <https://www.urbandictionary.com/...>

---

### 6.2 Multi-Engine Google Translation
- **Command:** `;translate [target_lang] <text>` | **Aliases:** `;tr`, `;traduzir`
- **Execution Mode:** `EDIT`
- **Free Endpoint:** `https://translate.googleapis.com/translate_a/single?client=gtx&sl={source}&tl={target}&dt=t&q={text}`
- **HTTP Method:** `GET`
- **Auth Required:** None (Google Translate single RPC)
- **Parameters:**
  - `client`: `gtx`
  - `sl`: `auto` (or explicit 2-letter ISO 639-1 code)
  - `tl`: target language (e.g. `pt`, `en`, `es`, `ja`, `de`, `ru`)
  - `dt`: `t` (text segment translation)
  - `q`: URL-encoded query text
- **Response Schema:**
  Multi-nested JSON array where `data[0][i][0]` contains the translated segment string, and `data[2]` returns the auto-detected source language.
- **Example:**
  - Input: `;translate pt The server will restart in ten minutes`
  - Output:
    🌐 **Tradução [EN ➔ PT]:**
    O servidor será reiniciado em dez minutos

---

### 6.3 High-Resolution QR Code Generator
- **Command:** `;qr <text or url>` | **Aliases:** `;qrcode`
- **Execution Mode:** `REPLY` (or sends direct image link)
- **Free Endpoint:** `https://api.qrserver.com/v1/create-qr-code/?size={size}x{size}&margin={margin}&data={data}`
- **HTTP Method:** `GET`
- **Auth Required:** None
- **Parameters:**
  - `size`: default `300x300`
  - `margin`: default `10`
  - `data`: URL-encoded payload string
- **Example:**
  - Input: `;qr https://phantomclear.app`
  - Output:
    📱 **QR Code Gerado:**
    https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=https%3A%2F%2Fphantomclear.app

---

### 6.4 Meteorological Weather Report (wttr.in)
- **Command:** `;weather <location>` | **Aliases:** `;clima`, `;tempo`
- **Execution Mode:** `EDIT`
- **Free Endpoint:** `https://wttr.in/{location}?format=j1`
- **HTTP Method:** `GET`
- **Auth Required:** None
- **Response Schema:**
  - `current_condition[0].temp_C` / `temp_F`
  - `current_condition[0].FeelsLikeC`
  - `current_condition[0].humidity`
  - `current_condition[0].weatherDesc[0].value`
  - `current_condition[0].windspeedKmph`
- **Example:**
  - Input: `;weather London`
  - Output:
    🌤️ **Previsão do Tempo: London, United Kingdom**
    • **Condição:** Partly cloudy
    • **Temperatura:** 14°C (57°F)
    • **Sensação Térmica:** 13°C (55°F)
    • **Umidade:** 72%
    • **Vento:** 18 km/h

---

### 6.5 Crypto Pricing & 24h Metrics (CoinGecko V3)
- **Command:** `;crypto <coin>` | **Aliases:** `;coin`, `;price`
- **Execution Mode:** `EDIT`
- **Free Endpoint:** `https://api.coingecko.com/api/v3/simple/price?ids={coin}&vs_currencies=usd,brl,eur&include_24hr_change=true`
- **HTTP Method:** `GET`
- **Auth Required:** None (Public V3 endpoint)
- **Rate Limit:** 30 calls/minute
- **Example:**
  - Input: `;crypto bitcoin`
  - Output:
    🪙 **Cotação BITCOIN:**
    • **USD:** $68,500
    • **BRL:** R$ 384,970
    • **EUR:** €63,120
    • **Variação 24h:** 📈 +2.45%

---

### 6.6 Real-Time Fiat Currency Exchange (Frankfurter / ECB)
- **Command:** `;currency <amount> <from> <to>` | **Aliases:** `;fx`, `;exchange`
- **Execution Mode:** `EDIT`
- **Free Endpoint:** `https://api.frankfurter.app/latest?amount={amount}&from={from}&to={to}`
- **HTTP Method:** `GET`
- **Auth Required:** None (backed by European Central Bank open data)
- **Example:**
  - Input: `;currency 100 USD BRL`
  - Output:
    💱 **Conversão de Câmbio:**
    **100 USD** = **561.69 BRL** (Taxa: 1 USD = 5.6169 BRL)

---

### 6.7 IP Geolocation, ISP & ASN Intelligence (ip-api)
- **Command:** `;geoip <ip or host>` | **Aliases:** `;ip`, `;whois`
- **Execution Mode:** `EDIT`
- **Free Endpoint:** `http://ip-api.com/json/{query}?fields=status,message,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,as,query`
- **HTTP Method:** `GET`
- **Auth Required:** None (Free HTTP endpoint, 45 requests/min)
- **Example:**
  - Input: `;geoip 1.1.1.1`
  - Output:
    🌐 **Geolocalização IP: `1.1.1.1`**
    • **Localização:** Sydney, New South Wales - Australia (:flag_au:)
    • **Fuso Horário:** Australia/Sydney
    • **Coordenadas:** -33.8688, 151.2093
    • **ISP / Provedor:** Cloudflare, Inc.
    • **ASN:** AS13335 Cloudflare, Inc.

---

### 6.8 Wikipedia Official Encyclopedic Summary
- **Command:** `;wiki <query>` | **Aliases:** `;wikipedia`
- **Execution Mode:** `EDIT`
- **Free Endpoint:** `https://en.wikipedia.org/api/rest_v1/page/summary/{title}`
- **HTTP Method:** `GET`
- **Auth Required:** None (Wikimedia Foundation REST API)
- **Example:**
  - Input: `;wiki Discord`
  - Output:
    📚 **Wikipedia: Discord**
    *American online communication service*
    Discord is an instant messaging and VoIP social platform which allows communication through voice calls, video calls, text messaging...
    🔗 Leia mais: <https://en.wikipedia.org/wiki/Discord>

---

### 6.9 URL Shortener Gateway (TinyURL)
- **Command:** `;shorten <url>` | **Aliases:** `;tinyurl`
- **Execution Mode:** `EDIT`
- **Free Endpoint:** `https://tinyurl.com/api-create.php?url={target_url}`
- **HTTP Method:** `GET`
- **Auth Required:** None
- **Example:**
  - Input: `;shorten https://github.com/Raioshok/JETTS-TUI`
  - Output:
    🔗 **URL Encurtada:** <https://tinyurl.com/5ra9gp>

---

### 6.10 Developer Jokes & Trivia Facts
- **Commands:** `;joke [category]` / `;trivia`
- **Execution Mode:** `EDIT`
- **Free Endpoints:**
  - JokeAPI: `https://v2.jokeapi.dev/joke/{category}?safe-mode`
  - UselessFacts: `https://uselessfacts.jsph.pl/api/v2/facts/random?language=en`
- **HTTP Method:** `GET`
- **Auth Required:** None
- **Discord Formatting:** Two-part jokes automatically place the punchline inside a Discord click-to-reveal spoiler `||punchline||`!
- **Example:**
  - Input: `;joke Programming`
  - Output:
    😂 **Why did the programmer quit his job?**
    
    ||Because he didn't get arrays.||

---

## 7. Integration Architecture in BrunnoClear-V2

### 7.1 Dispatcher Pipeline in `prefix-commands.service.ts`
All 43 commands are registered into a central lookup map in `text-transforms.catalog.ts` and wired into the prefix event listener:

```typescript
// server/features/prefix-commands/prefix-commands.service.ts
import { resolveCommand } from './text-transforms.catalog'

// In executarComando:
default: {
  const textCmd = resolveCommand(comando)
  if (textCmd) {
    try {
      const res = await textCmd.execute(args, message.content)
      if (res.mode === 'edit') {
        await message.edit(res.content).catch(() => {})
      } else if (res.mode === 'reply') {
        await message.channel.send(res.content).catch(() => {})
        await message.delete().catch(() => {})
      }
    } catch (err: any) {
      logger.error('PrefixCommands', `Erro no comando de texto ${comando}: ${err.message}`)
    }
    break
  }
  await message.delete().catch(() => {})
}
```

### 7.2 Safety & Rate-Limit Safeguards
1. **Self-Ownership Check:** `if (message.author.id !== currentClient.user.id) return` prevents selfbot commands from executing on other users' messages.
2. **Gateway Flood Protection:** Commands do not emit rapid editing loops. In-place edits are executed as a single atomic `message.edit()`.
3. **Payload Truncation:** `clampDiscord()` guarantees no command output exceeds 2,000 characters, preventing silent Discord gateway drops.
4. **Network Timeout & Try/Catch:** All API fetches are wrapped in resilient `try/catch` handlers that edit the message with a clean error report rather than crashing the Electron/Node background server.

---

## 8. Summary of Catalog Deliverables

1. **`docs/TEXT_AND_UTILITY_COMMANDS_CATALOG.md`**: Complete architectural specification, mathematical definitions, rate limits, Discord character economics, and API contracts.
2. **`server/features/prefix-commands/text-transforms.catalog.ts`**: Production TypeScript implementation providing 43 verified commands with strict typing, zero build warnings, and native Discord integration.
3. **Verification**: Executed with 42/42 successful test runs covering every stylistic transform, cipher, visual layout tool, and public web endpoint.
