/**
 * PhantomClear / BrunnoClear V2 - Text Transform & Utility Commands Catalog Engine
 * Fully typed, algorithmic text transformations and zero-auth free API clients
 * designed for Discord selfbot prefix command handling (in-place edits and replies).
 */

import crypto from 'node:crypto'

// ============================================================================
// Types & Contracts
// ============================================================================

export type CommandExecutionMode = 'edit' | 'reply' | 'file'

export interface CommandResult {
  mode: CommandExecutionMode
  content: string
  attachmentUrl?: string
  files?: Array<{ attachment: Buffer | string; name: string }>
  success: boolean
  error?: string
}

export interface CommandDefinition {
  name: string
  aliases: string[]
  category: 'stylistic' | 'ciphers' | 'formatting' | 'utilities'
  description: string
  usage: string
  mode: CommandExecutionMode
  execute: (args: string[], rawContent: string) => Promise<CommandResult> | CommandResult
}

// Discord message limits
export const DISCORD_LIMITS = {
  MAX_MESSAGE_LENGTH: 2000,
  NITRO_MESSAGE_LENGTH: 4000,
  EMBED_DESCRIPTION_LIMIT: 4096,
}

/**
 * Truncates text safely to respect Discord's 2000 character hard limit
 */
export function clampDiscord(text: string, limit = DISCORD_LIMITS.MAX_MESSAGE_LENGTH): string {
  if (text.length <= limit) return text
  const suffix = '... [Truncated]'
  return text.slice(0, limit - suffix.length) + suffix
}

// ============================================================================
// CATEGORY 1: Stylistic & Humorous Text Transforms (Algorithmic)
// ============================================================================

/**
 * 1. Mock / SpongeBob Case
 * Alternates uppercase and lowercase letters. Ignores spaces and punctuation
 * so the alternation cadence is not disrupted across word boundaries.
 */
export function transformMock(input: string, random = false): string {
  if (!input) return ''
  let upper = false
  return input
    .split('')
    .map((c) => {
      if (/[a-zA-Z]/.test(c)) {
        if (random) {
          return Math.random() > 0.5 ? c.toUpperCase() : c.toLowerCase()
        }
        upper = !upper
        return upper ? c.toUpperCase() : c.toLowerCase()
      }
      return c
    })
    .join('')
}

/**
 * 2. Emojify / Regional Indicators
 * Converts ASCII letters to Unicode Regional Indicator Symbols (🇦-🇿),
 * numbers to emoji keycaps, and spaces to double wide spaces.
 */
export function transformEmojify(input: string): string {
  if (!input) return ''
  const numMap: Record<string, string> = {
    '0': ':zero:',
    '1': ':one:',
    '2': ':two:',
    '3': ':three:',
    '4': ':four:',
    '5': ':five:',
    '6': ':six:',
    '7': ':seven:',
    '8': ':eight:',
    '9': ':nine:',
    '#': ':hash:',
    '*': ':asterisk:',
  }

  const result = input
    .toLowerCase()
    .split('')
    .map((char) => {
      if (char >= 'a' && char <= 'z') {
        // U+1F1E6 is Regional Indicator Symbol Letter A
        return String.fromCodePoint(0x1f1e6 + char.charCodeAt(0) - 97)
      }
      if (numMap[char]) {
        return numMap[char]
      }
      if (char === ' ') {
        return '   '
      }
      return char
    })
    .join(' ')

  return clampDiscord(result)
}

/**
 * 3. Spoilerize / Clapper
 * Wraps every single character in Discord spoiler tags (||c||).
 * Escapes internal pipe characters to prevent syntax breakdown.
 */
export function transformSpoilerize(input: string): string {
  if (!input) return ''
  // 5x expansion factor: 'a' -> '||a||'
  const maxInputSafeLength = Math.floor(DISCORD_LIMITS.MAX_MESSAGE_LENGTH / 5) - 10
  const safeInput = input.length > maxInputSafeLength ? input.slice(0, maxInputSafeLength) : input
  return safeInput
    .split('')
    .map((c) => (c === '|' ? '||\\|||' : `||${c}||`))
    .join('')
}

/**
 * 4. Vaporwave / Fullwidth
 * Shifts ASCII 0x21-0x7E by 0xFEE0 (65248) to Unicode Halfwidth and Fullwidth Forms,
 * and converts standard space 0x20 to Ideographic Space U+3000.
 */
export function transformVaporwave(input: string): string {
  if (!input) return ''
  return input
    .split('')
    .map((c) => {
      const code = c.charCodeAt(0)
      if (code === 32) return '\u3000'
      if (code >= 33 && code <= 126) {
        return String.fromCharCode(code + 65248)
      }
      return c
    })
    .join('')
}

/**
 * 5. Flip / Upside-Down Text
 * Reverses string order and substitutes glyphs using a bidirectional inverted Unicode table.
 */
const FLIP_MAP: Record<string, string> = {
  a: 'ɐ', b: 'q', c: 'ɔ', d: 'p', e: 'ǝ', f: 'ɟ', g: 'ƃ', h: 'ɥ', i: 'ᴉ',
  j: 'ɾ', k: 'ʞ', l: 'l', m: 'ɯ', n: 'u', o: 'o', p: 'd', q: 'b', r: 'ɹ',
  s: 's', t: 'ʇ', u: 'n', v: 'ʌ', w: 'ʍ', x: 'x', y: 'ʎ', z: 'z',
  A: '∀', B: '𐐒', C: 'Ɔ', D: '◖', E: 'Ǝ', F: 'Ⅎ', G: '⅁', H: 'H', I: 'I',
  J: 'ſ', K: 'ʞ', L: '˥', M: 'W', N: 'N', O: 'O', P: 'Ԁ', Q: 'Ò', R: 'ᴚ',
  S: 'S', T: '⊥', U: '∩', V: 'Λ', W: 'M', X: 'X', Y: '⅄', Z: 'Z',
  '1': '⇂', '2': 'ᄅ', '3': 'Ɛ', '4': 'ㄣ', '5': 'ϛ', '6': '9', '7': 'ㄥ',
  '8': '8', '9': '6', '0': '0',
  '.': '˙', ',': "'", "'": ',', '"': '„', '?': '¿', '!': '¡',
  '(': ')', ')': '(', '[': ']', ']': '[', '{': '}', '}': '{',
  '<': '>', '>': '<', '_': '‾', ';': '؛', '&': '⅋',
}

export function transformFlip(input: string): string {
  if (!input) return ''
  return input
    .split('')
    .reverse()
    .map((char) => FLIP_MAP[char] || char)
    .join('')
}

/**
 * 6. Zalgo / Glitch Text
 * Stacks combining diacritical marks (above, middle, and below) onto each character.
 * Uses bounded intensity to prevent Discord payload truncation or client rendering crashes.
 */
const ZALGO_MARKS = {
  up: [
    0x030d, 0x030e, 0x0304, 0x0305, 0x033f, 0x0311, 0x0306, 0x0310, 0x0352,
    0x0357, 0x0358, 0x0342, 0x0349, 0x0363, 0x0364, 0x036e, 0x036f,
  ],
  mid: [
    0x0315, 0x031b, 0x0340, 0x0341, 0x0358, 0x0321, 0x0322, 0x0327, 0x0328,
    0x0334, 0x0335, 0x0336, 0x0337, 0x0338,
  ],
  down: [
    0x0316, 0x0317, 0x0318, 0x0319, 0x031c, 0x031d, 0x031e, 0x031f, 0x0320,
    0x0324, 0x0325, 0x0326, 0x0329, 0x032a, 0x0330, 0x0331, 0x0332, 0x0333,
  ],
}

export function transformZalgo(input: string, intensity: 'low' | 'med' | 'high' = 'med'): string {
  if (!input) return ''
  const counts = { low: 1, med: 3, high: 6 }[intensity]
  let result = ''

  for (const char of input) {
    if (/\s/.test(char)) {
      result += char
      continue
    }
    result += char
    for (let i = 0; i < counts; i++) {
      const u = ZALGO_MARKS.up[Math.floor(Math.random() * ZALGO_MARKS.up.length)]
      const m = ZALGO_MARKS.mid[Math.floor(Math.random() * ZALGO_MARKS.mid.length)]
      const d = ZALGO_MARKS.down[Math.floor(Math.random() * ZALGO_MARKS.down.length)]
      result += String.fromCharCode(u, m, d)
    }
  }

  return clampDiscord(result)
}

/**
 * 7. Small Caps
 * Maps standard ASCII letters to Unicode Latin Small Capitals (Phonetic Extensions block).
 */
const SMALL_CAPS_MAP: Record<string, string> = {
  a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ꜰ', g: 'ɢ', h: 'ʜ', i: 'ɪ',
  j: 'ᴊ', k: 'ᴋ', l: 'ʟ', m: 'ᴍ', n: 'ɴ', o: 'ᴏ', p: 'ᴘ', q: 'Q', r: 'ʀ',
  s: 'ꜱ', t: 'ᴛ', u: 'ᴜ', v: 'ᴠ', w: 'ᴡ', x: 'x', y: 'ʏ', z: 'ᴢ',
}

export function transformSmallCaps(input: string): string {
  if (!input) return ''
  return input
    .toLowerCase()
    .split('')
    .map((c) => SMALL_CAPS_MAP[c] || c)
    .join('')
}

/**
 * 8. Superscript & Subscript
 * Replaces alphanumeric characters with Unicode superscript or subscript codepoints.
 */
const SUPER_MAP: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
  a: 'ᵃ', b: 'ᵇ', c: 'ᶜ', d: 'ᵈ', e: 'ᵉ', f: 'ᶠ', g: 'ᵍ', h: 'ʰ', i: 'ⁱ',
  j: 'ʲ', k: 'ᵏ', l: 'ˡ', m: 'ᵐ', n: 'ⁿ', o: 'ᵒ', p: 'ᵖ', r: 'ʳ', s: 'ˢ',
  t: 'ᵗ', u: 'ᵘ', v: 'ᵛ', w: 'ʷ', x: 'ˣ', y: 'ʸ', z: 'ᶻ',
}

const SUB_MAP: Record<string, string> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
  a: 'ₐ', e: 'ₑ', h: 'ₕ', i: 'ᵢ', j: 'ⱼ', k: 'ₖ', l: 'ₗ', m: 'ₘ', n: 'ₙ',
  o: 'ₒ', p: 'ₚ', r: 'ᵣ', s: 'ₛ', t: 'ₜ', u: 'ᵤ', v: 'ᵥ', x: 'ₓ',
}

export function transformScript(input: string, mode: 'super' | 'sub' = 'super'): string {
  if (!input) return ''
  const map = mode === 'super' ? SUPER_MAP : SUB_MAP
  return input
    .toLowerCase()
    .split('')
    .map((c) => map[c] || c)
    .join('')
}

/**
 * 9. Clap Text
 * Injects the clap emoji (👏) between every word and around the sentence.
 */
export function transformClap(input: string): string {
  if (!input.trim()) return ''
  const words = input.trim().split(/\s+/)
  return `👏 ${words.join(' 👏 ')} 👏`
}

/**
 * 10. Leet Speak (1337)
 * Substitutes alphabetic characters with classic leet numbers and symbols.
 */
const LEET_BASIC: Record<string, string> = {
  a: '4', b: '8', e: '3', g: '9', i: '1', l: '1', o: '0', s: '5', t: '7', z: '2',
}
const LEET_ADVANCED: Record<string, string> = {
  ...LEET_BASIC,
  c: '<', d: '|)', h: '|-|', k: '|<', m: '|\\/|', n: '|\\|', u: '|_|', v: '\\/', w: '\\/\\/', x: '><',
}

export function transformLeet(input: string, advanced = false): string {
  if (!input) return ''
  const dict = advanced ? LEET_ADVANCED : LEET_BASIC
  return input
    .toLowerCase()
    .split('')
    .map((c) => dict[c] || c)
    .join('')
}

/**
 * 11. Stutter Text
 * Adds dramatic or nervous hesitation to words beginning with consonants.
 */
export function transformStutter(input: string): string {
  if (!input) return ''
  return input
    .split(/\s+/)
    .map((word) => {
      if (word.length <= 2) return word
      const match = word.match(/^([bcdfghjklmnpqrstvwxyz]{1,2})/i)
      if (match) {
        const prefix = match[1]
        return `${prefix}-${prefix.toLowerCase()}-${word}`
      }
      return word
    })
    .join(' ')
}

/**
 * 12. Invisible Zero-Width Steganography (Hide & Reveal)
 * Encodes secret UTF-8 payloads invisibly into public cover text using
 * Zero-Width Space (U+200B) for '0' and Zero-Width Non-Joiner (U+200C) for '1'.
 */
export function steganographyHide(cover: string, secret: string): string {
  if (!secret) return cover
  const binary = Array.from(Buffer.from(secret, 'utf-8'))
    .map((byte) => byte.toString(2).padStart(8, '0'))
    .join('')

  const encodedZW = binary
    .split('')
    .map((bit) => (bit === '0' ? '\u200B' : '\u200C'))
    .join('') + '\u200D' // U+200D delimiter

  if (!cover) return encodedZW
  return cover.slice(0, 1) + encodedZW + cover.slice(1)
}

export function steganographyReveal(text: string): string | null {
  const match = text.match(/[\u200B\u200C]+/g)
  if (!match) return null
  const binary = match
    .join('')
    .replace(/\u200B/g, '0')
    .replace(/\u200C/g, '1')

  if (binary.length % 8 !== 0) return null
  const bytes: number[] = []
  for (let i = 0; i < binary.length; i += 8) {
    bytes.push(parseInt(binary.slice(i, i + 8), 2))
  }
  return Buffer.from(bytes).toString('utf-8')
}

// ============================================================================
// CATEGORY 2: Ciphers, Hashes & Cryptographic Utilities (Algorithmic)
// ============================================================================

/**
 * 13. Caesar & ROT13 Cipher
 * Circular alphabetical shift: C = (P + shift) % 26.
 */
export function cipherCaesar(input: string, shift = 13): string {
  if (!input) return ''
  const s = ((shift % 26) + 26) % 26
  return input
    .split('')
    .map((c) => {
      if (c >= 'a' && c <= 'z') {
        return String.fromCharCode(((c.charCodeAt(0) - 97 + s) % 26) + 97)
      }
      if (c >= 'A' && c <= 'Z') {
        return String.fromCharCode(((c.charCodeAt(0) - 65 + s) % 26) + 65)
      }
      return c
    })
    .join('')
}

/**
 * 14. Atbash Cipher
 * Classical Hebrew substitution: A <-> Z, B <-> Y. Involutory (self-reversing).
 */
export function cipherAtbash(input: string): string {
  if (!input) return ''
  return input
    .split('')
    .map((c) => {
      if (c >= 'a' && c <= 'z') {
        return String.fromCharCode(122 - (c.charCodeAt(0) - 97))
      }
      if (c >= 'A' && c <= 'Z') {
        return String.fromCharCode(90 - (c.charCodeAt(0) - 65))
      }
      return c
    })
    .join('')
}

/**
 * 15. Vigenère Cipher (Polyalphabetic)
 */
export function cipherVigenere(input: string, key: string, decrypt = false): string {
  if (!input) return ''
  const cleanKey = key.toUpperCase().replace(/[^A-Z]/g, '')
  if (!cleanKey) return input

  let keyIndex = 0
  return input
    .split('')
    .map((c) => {
      if (/[a-zA-Z]/.test(c)) {
        const isUpper = c === c.toUpperCase()
        const base = isUpper ? 65 : 97
        const shift = cleanKey.charCodeAt(keyIndex % cleanKey.length) - 65
        keyIndex++
        const offset = c.charCodeAt(0) - base
        const newOffset = decrypt
          ? (offset - shift + 26) % 26
          : (offset + shift) % 26
        return String.fromCharCode(base + newOffset)
      }
      return c
    })
    .join('')
}

/**
 * 16. International Morse Code (Encode & Decode)
 */
const MORSE_MAP: Record<string, string> = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....',
  I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.',
  Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
  Y: '-.--', Z: '--..', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
  '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.', '0': '-----',
  '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.', '!': '-.-.--',
  '/': '-..-.', '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...',
  ';': '-.-.-.', '=': '-...-', '+': '.-.-.', '-': '-....-', '_': '..--.-',
  '"': '.-..-.', '$': '...-..-', '@': '.--.-.',
}

const INV_MORSE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(MORSE_MAP).map(([k, v]) => [v, k])
)

export function morseEncode(input: string): string {
  if (!input) return ''
  return input
    .toUpperCase()
    .split('')
    .map((c) => {
      if (c === ' ') return '/'
      return MORSE_MAP[c] || c
    })
    .join(' ')
}

export function morseDecode(input: string): string {
  if (!input) return ''
  return input
    .trim()
    .split(' / ')
    .map((word) =>
      word
        .split(' ')
        .map((tok) => INV_MORSE_MAP[tok] || tok)
        .join('')
    )
    .join(' ')
}

/**
 * 17. 8-Bit Binary String Converter
 */
export function binaryEncode(input: string): string {
  if (!input) return ''
  return Array.from(Buffer.from(input, 'utf-8'))
    .map((byte) => byte.toString(2).padStart(8, '0'))
    .join(' ')
}

export function binaryDecode(input: string): string {
  if (!input) return ''
  const clean = input.trim().replace(/[^01\s]/g, '')
  const chunks = clean.split(/\s+/)
  const bytes = chunks
    .filter((c) => c.length === 8)
    .map((c) => parseInt(c, 2))
  return Buffer.from(bytes).toString('utf-8')
}

/**
 * 18. Base64 & Hexadecimal Converters
 */
export function base64Encode(input: string): string {
  return Buffer.from(input, 'utf-8').toString('base64')
}

export function base64Decode(input: string): string {
  return Buffer.from(input, 'base64').toString('utf-8')
}

export function hexEncode(input: string): string {
  return Buffer.from(input, 'utf-8').toString('hex')
}

export function hexDecode(input: string): string {
  const clean = input.replace(/[^0-9a-fA-F]/g, '')
  return Buffer.from(clean, 'hex').toString('utf-8')
}

/**
 * 19. Cryptographic Hashes (MD5, SHA1, SHA256, SHA512)
 */
export function computeHash(
  input: string,
  algorithm: 'md5' | 'sha1' | 'sha256' | 'sha512' = 'sha256'
): { algorithm: string; hash: string; length: number } {
  const hash = crypto.createHash(algorithm).update(input, 'utf-8').digest('hex')
  return { algorithm, hash, length: hash.length }
}

// ============================================================================
// CATEGORY 3: Discord Formatting, Layout & Visual Utilities
// ============================================================================

/**
 * 20. Discord ANSI Color Highlighter
 * Wraps text inside Discord's syntax-highlighted ```ansi block.
 */
export const ANSI_STYLES = {
  reset: 0,
  bold: 1,
  underline: 4,
}

export const ANSI_COLORS = {
  gray: 30,
  red: 31,
  green: 32,
  yellow: 33,
  blue: 34,
  magenta: 35,
  cyan: 36,
  white: 37,
}

export const ANSI_BG = {
  fireflyDarkBlue: 40,
  orange: 41,
  marbleBlue: 42,
  grayishTurquoise: 43,
  gray: 44,
  indigo: 45,
  lightGray: 46,
  white: 47,
}

export function formatAnsi(
  text: string,
  color: keyof typeof ANSI_COLORS = 'green',
  style: keyof typeof ANSI_STYLES = 'bold',
  bg?: keyof typeof ANSI_BG
): string {
  const cCode = ANSI_COLORS[color] ?? 32
  const sCode = ANSI_STYLES[style] ?? 1
  const bgCode = bg ? `;${ANSI_BG[bg]}` : ''
  const sequence = `\u001b[${sCode};${cCode}${bgCode}m`
  const reset = `\u001b[0m`
  return `\`\`\`ansi\n${sequence}${text}${reset}\n\`\`\``
}

/**
 * 21. Unicode Box / Frame Generator
 * Draws decorative borders around text lines with auto-padding and column alignment.
 */
export type BoxStyle = 'single' | 'double' | 'rounded' | 'ascii'

const BOX_CHARS = {
  single: { tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│' },
  double: { tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║' },
  rounded: { tl: '╭', tr: '╮', bl: '╰', br: '╯', h: '─', v: '│' },
  ascii: { tl: '+', tr: '+', bl: '+', br: '+', h: '-', v: '|' },
}

export function drawBox(text: string, style: BoxStyle = 'rounded', padding = 1): string {
  const chars = BOX_CHARS[style] || BOX_CHARS.rounded
  const lines = text.split('\n')
  const maxLen = Math.max(...lines.map((l) => l.length), 1)
  const pad = ' '.repeat(padding)
  const width = maxLen + padding * 2

  const top = chars.tl + chars.h.repeat(width) + chars.tr
  const middle = lines
    .map((l) => `${chars.v}${pad}${l.padEnd(maxLen, ' ')}${pad}${chars.v}`)
    .join('\n')
  const bottom = chars.bl + chars.h.repeat(width) + chars.br

  return `\`\`\`\n${top}\n${middle}\n${bottom}\n\`\`\``
}

/**
 * 22. Visual Progress Bar Generator
 */
export function generateProgressBar(
  current: number,
  max: number,
  length = 15,
  emoji = false
): string {
  const safeMax = max <= 0 ? 1 : max
  const ratio = Math.min(1, Math.max(0, current / safeMax))
  const filled = Math.round(ratio * length)
  const empty = length - filled
  const percent = (ratio * 100).toFixed(1)

  if (emoji) {
    return `[${'🟩'.repeat(filled)}${'⬛'.repeat(empty)}] **${percent}%** (${current}/${max})`
  }
  return `\`[${'█'.repeat(filled)}${'░'.repeat(empty)}]\` **${percent}%** (${current}/${max})`
}

/**
 * 23. Monospace ASCII Table Generator
 * Parses CSV or pipe-delimited data and outputs an aligned monospace table.
 */
export function generateAsciiTable(rows: string[][]): string {
  if (!rows || rows.length === 0) return ''
  const colCount = Math.max(...rows.map((r) => r.length))
  const colWidths = Array(colCount).fill(0)

  for (const row of rows) {
    for (let c = 0; c < colCount; c++) {
      const val = row[c] ?? ''
      if (val.length > colWidths[c]) {
        colWidths[c] = val.length
      }
    }
  }

  const sep = '+' + colWidths.map((w) => '-'.repeat(w + 2)).join('+') + '+'
  const formatRow = (r: string[]) =>
    '| ' +
    Array.from({ length: colCount })
      .map((_, i) => (r[i] ?? '').padEnd(colWidths[i], ' '))
      .join(' | ') +
    ' |'

  const header = rows[0] ? formatRow(rows[0]) : ''
  const body = rows.slice(1).map(formatRow).join('\n')

  return `\`\`\`\n${sep}\n${header}\n${sep}${body ? '\n' + body + '\n' + sep : ''}\n\`\`\``
}

/**
 * 24. Text Analysis & Discord Payload Health
 */
export function analyzeText(text: string) {
  const charCount = text.length
  const byteCount = Buffer.byteLength(text, 'utf-8')
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
  const lineCount = text.split('\n').length
  const fitsStandard = charCount <= DISCORD_LIMITS.MAX_MESSAGE_LENGTH
  const fitsNitro = charCount <= DISCORD_LIMITS.NITRO_MESSAGE_LENGTH

  return {
    charCount,
    byteCount,
    wordCount,
    lineCount,
    fitsStandard,
    fitsNitro,
    percentOfLimit: ((charCount / DISCORD_LIMITS.MAX_MESSAGE_LENGTH) * 100).toFixed(1),
  }
}

// ============================================================================
// CATEGORY 4: Web & External API Utilities (Zero-Auth Free Public Endpoints)
// ============================================================================

/**
 * 25. Urban Dictionary Slang Lookup
 * Free API: https://api.urbandictionary.com/v0/define?term={query}
 */
export async function apiUrbanDictionary(term: string) {
  const url = `https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(term)}`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'BrunnoClear/2.0' },
  })
  if (!res.ok) throw new Error(`UrbanDictionary API error (${res.status})`)
  const data = (await res.json()) as {
    list: Array<{
      word: string
      definition: string
      example: string
      thumbs_up: number
      thumbs_down: number
      permalink: string
    }>
  }

  if (!data.list || data.list.length === 0) {
    return null
  }

  const top = data.list[0]
  // Strip bracket references [word] -> word
  const cleanDef = top.definition.replace(/\[(.*?)\]/g, '$1')
  const cleanEx = top.example.replace(/\[(.*?)\]/g, '$1')

  return {
    word: top.word,
    definition: cleanDef.slice(0, 1000),
    example: cleanEx.slice(0, 500),
    upvotes: top.thumbs_up,
    downvotes: top.thumbs_down,
    url: top.permalink,
  }
}

/**
 * 26. Google Multi-Language Translate (Single RPC)
 * Free API: https://translate.googleapis.com/translate_a/single?client=gtx&sl={from}&tl={to}&dt=t&q={text}
 */
export async function apiTranslate(text: string, targetLang = 'en', sourceLang = 'auto') {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  })
  if (!res.ok) throw new Error(`Google Translate error (${res.status})`)
  const raw = (await res.json()) as any

  let translated = ''
  if (Array.isArray(raw[0])) {
    for (const segment of raw[0]) {
      if (segment[0]) translated += segment[0]
    }
  }
  const detectedSource = raw[2] || sourceLang

  return {
    sourceLanguage: detectedSource,
    targetLanguage: targetLang,
    originalText: text,
    translatedText: translated,
  }
}

/**
 * 27. QR Code Generation
 * Free API: https://api.qrserver.com/v1/create-qr-code/?size={size}&data={query}
 */
export function getQrCodeUrl(data: string, size = 300, margin = 10): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=${margin}&data=${encodeURIComponent(data)}`
}

/**
 * 28. Meteorological Weather Report (wttr.in)
 * Free API: https://wttr.in/{location}?format=j1
 */
export async function apiWeather(location: string) {
  const url = `https://wttr.in/${encodeURIComponent(location)}?format=j1`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'BrunnoClear/2.0' },
  })
  if (!res.ok) throw new Error(`Weather service returned ${res.status}`)
  const data = (await res.json()) as any

  const current = data.current_condition?.[0]
  const nearest = data.nearest_area?.[0]

  if (!current) throw new Error('No weather data available for this query')

  return {
    location: `${nearest?.areaName?.[0]?.value || location}, ${nearest?.country?.[0]?.value || ''}`,
    tempC: current.temp_C,
    tempF: current.temp_F,
    feelsLikeC: current.FeelsLikeC,
    feelsLikeF: current.FeelsLikeF,
    humidity: current.humidity,
    weatherDesc: current.weatherDesc?.[0]?.value || 'N/A',
    windKmph: current.windspeedKmph,
    precipitationMm: current.precipMM,
  }
}

/**
 * 29. Crypto Pricing & 24h Metrics (CoinGecko V3 Public)
 * Free API: https://api.coingecko.com/api/v3/simple/price?ids={coin}&vs_currencies=usd,brl,eur&include_24hr_change=true
 */
export async function apiCrypto(coinId = 'bitcoin') {
  const cleanId = coinId.toLowerCase().trim()
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(cleanId)}&vs_currencies=usd,brl,eur&include_24hr_change=true`
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`CoinGecko API returned ${res.status}`)
  const data = (await res.json()) as Record<
    string,
    {
      usd: number
      brl: number
      eur: number
      usd_24h_change?: number
    }
  >

  const coin = data[cleanId]
  if (!coin) throw new Error(`Cryptocurrency '${coinId}' not found`)

  return {
    coin: cleanId.toUpperCase(),
    usd: coin.usd,
    brl: coin.brl,
    eur: coin.eur,
    change24h: coin.usd_24h_change?.toFixed(2) ?? '0.00',
  }
}

/**
 * 30. Fiat Currency Exchange (Frankfurter ECB Public)
 * Free API: https://api.frankfurter.app/latest?amount={amount}&from={from}&to={to}
 */
export async function apiCurrency(amount = 1, from = 'USD', to = 'BRL') {
  const url = `https://api.frankfurter.app/latest?amount=${amount}&from=${from.toUpperCase()}&to=${to.toUpperCase()}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Currency API returned ${res.status}`)
  const data = (await res.json()) as {
    amount: number
    base: string
    date: string
    rates: Record<string, number>
  }

  const rate = data.rates[to.toUpperCase()]
  return {
    amount: data.amount,
    from: data.base,
    to: to.toUpperCase(),
    result: rate,
    rate: rate / amount,
    date: data.date,
  }
}

/**
 * 31. IP Geolocation & ASN Intelligence (ip-api)
 * Free API: http://ip-api.com/json/{query}
 */
export async function apiGeoIp(target: string) {
  const url = `http://ip-api.com/json/${encodeURIComponent(target)}?fields=status,message,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,as,query`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`GeoIP service error (${res.status})`)
  const data = (await res.json()) as any

  if (data.status !== 'success') {
    throw new Error(data.message || 'Lookup failed')
  }

  return {
    ip: data.query,
    country: data.country,
    countryCode: data.countryCode,
    region: data.regionName,
    city: data.city,
    zip: data.zip,
    coordinates: `${data.lat}, ${data.lon}`,
    timezone: data.timezone,
    isp: data.isp,
    org: data.org,
    as: data.as,
  }
}

/**
 * 32. Wikipedia Encyclopedic Summary
 * Free API: https://en.wikipedia.org/api/rest_v1/page/summary/{title}
 */
export async function apiWikipedia(title: string, lang = 'en') {
  const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'BrunnoClear/2.0 (contact@phantomclear.local)' },
  })
  if (!res.ok) throw new Error(`Wikipedia returned ${res.status}`)
  const data = (await res.json()) as any

  return {
    title: data.title,
    description: data.description || 'No description available',
    extract: data.extract,
    url: data.content_urls?.desktop?.page || '',
    thumbnail: data.thumbnail?.source,
  }
}

/**
 * 33. URL Shortener (TinyURL)
 * Free API: https://tinyurl.com/api-create.php?url={url}
 */
export async function apiShortenUrl(longUrl: string): Promise<string> {
  if (!/^https?:\/\//i.test(longUrl)) {
    throw new Error('Invalid URL protocol. Must start with http:// or https://')
  }
  const url = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Shortener returned ${res.status}`)
  return (await res.text()).trim()
}

/**
 * 34. Joke & Trivia Generators (JokeAPI & UselessFacts)
 */
export async function apiJoke(category = 'Any'): Promise<{ joke: string; punchline?: string }> {
  const url = `https://v2.jokeapi.dev/joke/${encodeURIComponent(category)}?safe-mode`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Joke service returned ${res.status}`)
  const data = (await res.json()) as any

  if (data.type === 'single') {
    return { joke: data.joke }
  } else {
    return { joke: data.setup, punchline: data.delivery }
  }
}

export async function apiTriviaFact(): Promise<string> {
  const url = 'https://uselessfacts.jsph.pl/api/v2/facts/random?language=en'
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Trivia service returned ${res.status}`)
  const data = (await res.json()) as any
  return data.text || 'Did you know that computers are cool?'
}

// ============================================================================
// MASTER COMMAND DISPATCHER CATALOG
// ============================================================================

export const COMMAND_CATALOG: Record<string, CommandDefinition> = {
  // --- Stylistic Transforms ---
  mock: {
    name: 'mock',
    aliases: ['spongebob', 'sponge'],
    category: 'stylistic',
    description: 'Alterna maiúsculas e minúsculas no texto (SpongeBob meme)',
    usage: ';mock <texto>',
    mode: 'edit',
    execute: (args, raw) => ({
      mode: 'edit',
      success: true,
      content: transformMock(args.join(' ')),
    }),
  },

  emojify: {
    name: 'emojify',
    aliases: ['regional', 'bigtext'],
    category: 'stylistic',
    description: 'Converte letras e números em emojis regionais grandes',
    usage: ';emojify <texto>',
    mode: 'edit',
    execute: (args) => ({
      mode: 'edit',
      success: true,
      content: transformEmojify(args.join(' ')),
    }),
  },

  spoiler: {
    name: 'spoiler',
    aliases: ['spoilall', 'spoilerize'],
    category: 'stylistic',
    description: 'Envolve cada letra individualmente em tags de spoiler',
    usage: ';spoiler <texto>',
    mode: 'edit',
    execute: (args) => ({
      mode: 'edit',
      success: true,
      content: transformSpoilerize(args.join(' ')),
    }),
  },

  vaporwave: {
    name: 'vaporwave',
    aliases: ['vapor', 'wide', 'aesthetic'],
    category: 'stylistic',
    description: 'Converte texto para largura total (Fullwidth aesthetic)',
    usage: ';vaporwave <texto>',
    mode: 'edit',
    execute: (args) => ({
      mode: 'edit',
      success: true,
      content: transformVaporwave(args.join(' ')),
    }),
  },

  flip: {
    name: 'flip',
    aliases: ['upsidedown', 'invert'],
    category: 'stylistic',
    description: 'Gira o texto de cabeça para baixo e inverte a ordem',
    usage: ';flip <texto>',
    mode: 'edit',
    execute: (args) => ({
      mode: 'edit',
      success: true,
      content: transformFlip(args.join(' ')),
    }),
  },

  zalgo: {
    name: 'zalgo',
    aliases: ['glitch', 'chaos'],
    category: 'stylistic',
    description: 'Aplica distorção e corrupção Zalgo com marcas diacríticas',
    usage: ';zalgo <texto>',
    mode: 'edit',
    execute: (args) => ({
      mode: 'edit',
      success: true,
      content: transformZalgo(args.join(' '), 'med'),
    }),
  },

  smallcaps: {
    name: 'smallcaps',
    aliases: ['sc', 'tiny'],
    category: 'stylistic',
    description: 'Converte texto em letras maiúsculas em miniatura (Small Capitals)',
    usage: ';smallcaps <texto>',
    mode: 'edit',
    execute: (args) => ({
      mode: 'edit',
      success: true,
      content: transformSmallCaps(args.join(' ')),
    }),
  },

  super: {
    name: 'super',
    aliases: ['superscript'],
    category: 'stylistic',
    description: 'Converte caracteres para sobrescrito (superscript)',
    usage: ';super <texto>',
    mode: 'edit',
    execute: (args) => ({
      mode: 'edit',
      success: true,
      content: transformScript(args.join(' '), 'super'),
    }),
  },

  sub: {
    name: 'sub',
    aliases: ['subscript'],
    category: 'stylistic',
    description: 'Converte caracteres para subscrito (subscript)',
    usage: ';sub <texto>',
    mode: 'edit',
    execute: (args) => ({
      mode: 'edit',
      success: true,
      content: transformScript(args.join(' '), 'sub'),
    }),
  },

  clap: {
    name: 'clap',
    aliases: ['claptext'],
    category: 'stylistic',
    description: 'Insere palmas entre as palavras',
    usage: ';clap <texto>',
    mode: 'edit',
    execute: (args) => ({
      mode: 'edit',
      success: true,
      content: transformClap(args.join(' ')),
    }),
  },

  leet: {
    name: 'leet',
    aliases: ['1337', 'hacker'],
    category: 'stylistic',
    description: 'Traduz texto para l33t sp34k',
    usage: ';leet <texto>',
    mode: 'edit',
    execute: (args) => ({
      mode: 'edit',
      success: true,
      content: transformLeet(args.join(' ')),
    }),
  },

  stutter: {
    name: 'stutter',
    aliases: ['hesitate'],
    category: 'stylistic',
    description: 'Gera gagueira dramática nas primeiras sílabas',
    usage: ';stutter <texto>',
    mode: 'edit',
    execute: (args) => ({
      mode: 'edit',
      success: true,
      content: transformStutter(args.join(' ')),
    }),
  },

  hide: {
    name: 'hide',
    aliases: ['stegohide'],
    category: 'ciphers',
    description: 'Esconde texto secreto invisível dentro de uma mensagem de capa',
    usage: ';hide <segredo> | <capa>',
    mode: 'edit',
    execute: (args, raw) => {
      const full = args.join(' ')
      const parts = full.split('|')
      const secret = parts[0]?.trim() || ''
      const cover = parts[1]?.trim() || '...'
      return {
        mode: 'edit',
        success: true,
        content: steganographyHide(cover, secret),
      }
    },
  },

  reveal: {
    name: 'reveal',
    aliases: ['stegoreveal'],
    category: 'ciphers',
    description: 'Revela texto secreto oculto com caracteres de largura zero',
    usage: ';reveal <mensagem>',
    mode: 'edit',
    execute: (args) => {
      const secret = steganographyReveal(args.join(' '))
      return {
        mode: 'edit',
        success: true,
        content: secret ? `🕵️ **Texto Revelado:** \`${secret}\`` : '❌ Nenhum texto oculto encontrado.',
      }
    },
  },

  // --- Ciphers & Hashes ---
  rot13: {
    name: 'rot13',
    aliases: ['caesar'],
    category: 'ciphers',
    description: 'Aplica cifra de César / rotação alfabética ROT13',
    usage: ';rot13 [shift] <texto>',
    mode: 'edit',
    execute: (args) => {
      let shift = 13
      let text = args.join(' ')
      if (/^\d+$/.test(args[0])) {
        shift = parseInt(args[0], 10)
        text = args.slice(1).join(' ')
      }
      return {
        mode: 'edit',
        success: true,
        content: cipherCaesar(text, shift),
      }
    },
  },

  atbash: {
    name: 'atbash',
    aliases: ['mirror'],
    category: 'ciphers',
    description: 'Aplica a cifra Atbash (espelhamento A <-> Z)',
    usage: ';atbash <texto>',
    mode: 'edit',
    execute: (args) => ({
      mode: 'edit',
      success: true,
      content: cipherAtbash(args.join(' ')),
    }),
  },

  vigenere: {
    name: 'vigenere',
    aliases: ['vig'],
    category: 'ciphers',
    description: 'Cifra ou decifra texto com Vigenère usando uma palavra-chave',
    usage: ';vigenere <chave> <texto>',
    mode: 'edit',
    execute: (args) => {
      const key = args[0] || 'KEY'
      const text = args.slice(1).join(' ')
      return {
        mode: 'edit',
        success: true,
        content: cipherVigenere(text, key, false),
      }
    },
  },

  unvigenere: {
    name: 'unvigenere',
    aliases: ['unvig'],
    category: 'ciphers',
    description: 'Decifra texto cifrado com Vigenère',
    usage: ';unvigenere <chave> <texto>',
    mode: 'edit',
    execute: (args) => {
      const key = args[0] || 'KEY'
      const text = args.slice(1).join(' ')
      return {
        mode: 'edit',
        success: true,
        content: cipherVigenere(text, key, true),
      }
    },
  },

  morse: {
    name: 'morse',
    aliases: ['tomorse'],
    category: 'ciphers',
    description: 'Converte texto em Código Morse Internacional',
    usage: ';morse <texto>',
    mode: 'edit',
    execute: (args) => ({
      mode: 'edit',
      success: true,
      content: morseEncode(args.join(' ')),
    }),
  },

  unmorse: {
    name: 'unmorse',
    aliases: ['frommorse'],
    category: 'ciphers',
    description: 'Decodifica Código Morse para texto legível',
    usage: ';unmorse <morse>',
    mode: 'edit',
    execute: (args) => ({
      mode: 'edit',
      success: true,
      content: morseDecode(args.join(' ')),
    }),
  },

  binary: {
    name: 'binary',
    aliases: ['tobinary'],
    category: 'ciphers',
    description: 'Converte texto em binário de 8 bits',
    usage: ';binary <texto>',
    mode: 'edit',
    execute: (args) => ({
      mode: 'edit',
      success: true,
      content: binaryEncode(args.join(' ')),
    }),
  },

  unbinary: {
    name: 'unbinary',
    aliases: ['frombinary'],
    category: 'ciphers',
    description: 'Converte sequência de bits binários em texto',
    usage: ';unbinary <bits>',
    mode: 'edit',
    execute: (args) => ({
      mode: 'edit',
      success: true,
      content: binaryDecode(args.join(' ')),
    }),
  },

  b64enc: {
    name: 'b64enc',
    aliases: ['base64'],
    category: 'ciphers',
    description: 'Codifica string para Base64 (RFC 4648)',
    usage: ';b64enc <texto>',
    mode: 'edit',
    execute: (args) => ({
      mode: 'edit',
      success: true,
      content: base64Encode(args.join(' ')),
    }),
  },

  b64dec: {
    name: 'b64dec',
    aliases: ['unbase64'],
    category: 'ciphers',
    description: 'Decodifica string em Base64 para texto original',
    usage: ';b64dec <base64>',
    mode: 'edit',
    execute: (args) => ({
      mode: 'edit',
      success: true,
      content: base64Decode(args.join(' ')),
    }),
  },

  hexenc: {
    name: 'hexenc',
    aliases: ['tohex'],
    category: 'ciphers',
    description: 'Codifica texto em bytes hexadecimais',
    usage: ';hexenc <texto>',
    mode: 'edit',
    execute: (args) => ({
      mode: 'edit',
      success: true,
      content: hexEncode(args.join(' ')),
    }),
  },

  hexdec: {
    name: 'hexdec',
    aliases: ['fromhex'],
    category: 'ciphers',
    description: 'Decodifica sequência hexadecimal para texto',
    usage: ';hexdec <hex>',
    mode: 'edit',
    execute: (args) => ({
      mode: 'edit',
      success: true,
      content: hexDecode(args.join(' ')),
    }),
  },

  hash: {
    name: 'hash',
    aliases: ['sha256', 'md5'],
    category: 'ciphers',
    description: 'Gera hashes criptográficos (MD5, SHA1, SHA256, SHA512)',
    usage: ';hash [md5|sha1|sha256|sha512] <texto>',
    mode: 'edit',
    execute: (args) => {
      const allowed = ['md5', 'sha1', 'sha256', 'sha512']
      let algo: any = 'sha256'
      let text = args.join(' ')
      if (allowed.includes(args[0]?.toLowerCase())) {
        algo = args[0].toLowerCase()
        text = args.slice(1).join(' ')
      }
      const res = computeHash(text, algo)
      return {
        mode: 'edit',
        success: true,
        content: `\`\`\`css\n[Hash ${res.algorithm.toUpperCase()}]\n${res.hash}\n\`\`\``,
      }
    },
  },

  // --- Formatting & Visuals ---
  ansi: {
    name: 'ansi',
    aliases: ['color', 'colorize'],
    category: 'formatting',
    description: 'Formata texto em bloco ANSI colorido no chat',
    usage: ';ansi <cor> <texto>',
    mode: 'edit',
    execute: (args) => {
      const color = (args[0] as keyof typeof ANSI_COLORS) || 'green'
      const text = args.slice(1).join(' ') || 'Exemplo Colorido'
      return {
        mode: 'edit',
        success: true,
        content: formatAnsi(text, color, 'bold'),
      }
    },
  },

  box: {
    name: 'box',
    aliases: ['frame'],
    category: 'formatting',
    description: 'Cria moldura decorativa em caixa Unicode (rounded, double, single)',
    usage: ';box [rounded|double|single] <texto>',
    mode: 'edit',
    execute: (args) => {
      let style: BoxStyle = 'rounded'
      let text = args.join(' ')
      if (['rounded', 'double', 'single', 'ascii'].includes(args[0])) {
        style = args[0] as BoxStyle
        text = args.slice(1).join(' ')
      }
      return {
        mode: 'edit',
        success: true,
        content: drawBox(text, style),
      }
    },
  },

  progress: {
    name: 'progress',
    aliases: ['bar', 'progbar'],
    category: 'formatting',
    description: 'Calcula e renderiza barra visual de progresso',
    usage: ';progress <atual> <maximo> [emoji]',
    mode: 'edit',
    execute: (args) => {
      const cur = parseFloat(args[0]) || 50
      const max = parseFloat(args[1]) || 100
      const emoji = args[2] === 'emoji' || args[2] === 'true'
      return {
        mode: 'edit',
        success: true,
        content: generateProgressBar(cur, max, 16, emoji),
      }
    },
  },

  table: {
    name: 'table',
    aliases: ['asciitable'],
    category: 'formatting',
    description: 'Gera tabela monospace alinhada a partir de linhas separadas por vírgula',
    usage: ';table Nome,Idade,Cargo | Alice,24,Dev | Bob,30,Admin',
    mode: 'edit',
    execute: (args) => {
      const raw = args.join(' ')
      const rows = raw.split('|').map((r) => r.split(',').map((c) => c.trim()))
      return {
        mode: 'edit',
        success: true,
        content: generateAsciiTable(rows),
      }
    },
  },

  textstats: {
    name: 'textstats',
    aliases: ['count', 'tokens'],
    category: 'formatting',
    description: 'Analisa contagem de caracteres, bytes, palavras e limites do Discord',
    usage: ';textstats <texto>',
    mode: 'edit',
    execute: (args) => {
      const stats = analyzeText(args.join(' '))
      return {
        mode: 'edit',
        success: true,
        content:
          `📊 **Análise de Texto**\n` +
          `• **Caracteres:** ${stats.charCount} / ${DISCORD_LIMITS.MAX_MESSAGE_LENGTH} (${stats.percentOfLimit}%)\n` +
          `• **Bytes UTF-8:** ${stats.byteCount}\n` +
          `• **Palavras:** ${stats.wordCount}\n` +
          `• **Linhas:** ${stats.lineCount}\n` +
          `• **Encaixa no Discord Padrão:** ${stats.fitsStandard ? '✅ Sim' : '❌ Não'}\n` +
          `• **Encaixa no Nitro (4K):** ${stats.fitsNitro ? '✅ Sim' : '❌ Não'}`,
      }
    },
  },

  // --- External API Utilities ---
  urban: {
    name: 'urban',
    aliases: ['ud'],
    category: 'utilities',
    description: 'Pesquisa significado de gíria no Urban Dictionary',
    usage: ';urban <termo>',
    mode: 'edit',
    execute: async (args) => {
      const term = args.join(' ')
      if (!term) return { mode: 'edit', success: false, content: '❌ Informe um termo para pesquisar.' }
      try {
        const res = await apiUrbanDictionary(term)
        if (!res) return { mode: 'edit', success: true, content: `❌ Nenhuma definição encontrada para "${term}".` }
        return {
          mode: 'edit',
          success: true,
          content:
            `📖 **Urban Dictionary: ${res.word}**\n\n` +
            `**Definição:**\n${res.definition}\n\n` +
            `*Exemplo:*\n*${res.example}*\n\n` +
            `👍 ${res.upvotes} | 👎 ${res.downvotes} | 🔗 <${res.url}>`,
        }
      } catch (err: any) {
        return { mode: 'edit', success: false, content: `❌ Erro ao consultar Urban Dictionary: ${err.message}` }
      }
    },
  },

  translate: {
    name: 'translate',
    aliases: ['tr', 'traduzir'],
    category: 'utilities',
    description: 'Traduz texto para qualquer idioma via Google Translate',
    usage: ';translate [idioma_destino] <texto>',
    mode: 'edit',
    execute: async (args) => {
      if (args.length === 0) return { mode: 'edit', success: false, content: '❌ Informe o texto para traduzir.' }
      let target = 'pt'
      let text = args.join(' ')
      // Check if first arg is 2-letter language code
      if (/^[a-z]{2}$/i.test(args[0]) && args.length > 1) {
        target = args[0].toLowerCase()
        text = args.slice(1).join(' ')
      }
      try {
        const res = await apiTranslate(text, target)
        return {
          mode: 'edit',
          success: true,
          content: `🌐 **Tradução [${res.sourceLanguage.toUpperCase()} ➔ ${res.targetLanguage.toUpperCase()}]:**\n${res.translatedText}`,
        }
      } catch (err: any) {
        return { mode: 'edit', success: false, content: `❌ Erro na tradução: ${err.message}` }
      }
    },
  },

  qr: {
    name: 'qr',
    aliases: ['qrcode'],
    category: 'utilities',
    description: 'Gera link ou imagem de QR Code para qualquer link ou texto',
    usage: ';qr <texto ou link>',
    mode: 'reply',
    execute: (args) => {
      const data = args.join(' ')
      if (!data) return { mode: 'reply', success: false, content: '❌ Informe o texto ou URL para gerar o QR Code.' }
      const url = getQrCodeUrl(data)
      return {
        mode: 'reply',
        success: true,
        content: `📱 **QR Code Gerado:**\n${url}`,
        attachmentUrl: url,
      }
    },
  },

  weather: {
    name: 'weather',
    aliases: ['clima', 'tempo'],
    category: 'utilities',
    description: 'Exibe previsão do tempo e condições meteorológicas atuais',
    usage: ';weather <cidade/país>',
    mode: 'edit',
    execute: async (args) => {
      const query = args.join(' ') || 'Sao Paulo'
      try {
        const w = await apiWeather(query)
        return {
          mode: 'edit',
          success: true,
          content:
            `🌤️ **Previsão do Tempo: ${w.location}**\n` +
            `• **Condição:** ${w.weatherDesc}\n` +
            `• **Temperatura:** ${w.tempC}°C (${w.tempF}°F)\n` +
            `• **Sensação Térmica:** ${w.feelsLikeC}°C (${w.feelsLikeF}°F)\n` +
            `• **Umidade:** ${w.humidity}%\n` +
            `• **Vento:** ${w.windKmph} km/h\n` +
            `• **Precipitação:** ${w.precipitationMm} mm`,
        }
      } catch (err: any) {
        return { mode: 'edit', success: false, content: `❌ Erro ao obter previsão: ${err.message}` }
      }
    },
  },

  crypto: {
    name: 'crypto',
    aliases: ['coin', 'price'],
    category: 'utilities',
    description: 'Consulta cotação e variação 24h de criptomoedas',
    usage: ';crypto <bitcoin|ethereum|solana>',
    mode: 'edit',
    execute: async (args) => {
      const coin = args[0] || 'bitcoin'
      try {
        const c = await apiCrypto(coin)
        const arrow = parseFloat(c.change24h) >= 0 ? '📈' : '📉'
        return {
          mode: 'edit',
          success: true,
          content:
            `🪙 **Cotação ${c.coin}:**\n` +
            `• **USD:** $${c.usd.toLocaleString('en-US')}\n` +
            `• **BRL:** R$ ${c.brl.toLocaleString('pt-BR')}\n` +
            `• **EUR:** €${c.eur.toLocaleString('de-DE')}\n` +
            `• **Variação 24h:** ${arrow} ${c.change24h}%`,
        }
      } catch (err: any) {
        return { mode: 'edit', success: false, content: `❌ Criptomoeda não encontrada: ${err.message}` }
      }
    },
  },

  currency: {
    name: 'currency',
    aliases: ['fx', 'exchange'],
    category: 'utilities',
    description: 'Converte valores entre moedas fiduciárias em tempo real',
    usage: ';currency <valor> <de> <para>',
    mode: 'edit',
    execute: async (args) => {
      const amount = parseFloat(args[0]) || 1
      const from = (args[1] || 'USD').toUpperCase()
      const to = (args[2] || 'BRL').toUpperCase()
      try {
        const res = await apiCurrency(amount, from, to)
        return {
          mode: 'edit',
          success: true,
          content: `💱 **Conversão de Câmbio:**\n**${amount} ${from}** = **${res.result.toFixed(2)} ${to}** (Taxa: 1 ${from} = ${res.rate.toFixed(4)} ${to})`,
        }
      } catch (err: any) {
        return { mode: 'edit', success: false, content: `❌ Erro ao converter moedas: ${err.message}` }
      }
    },
  },

  geoip: {
    name: 'geoip',
    aliases: ['ip', 'whois'],
    category: 'utilities',
    description: 'Geolocalização, Provedor ISP e ASN de endereço IP ou host',
    usage: ';geoip <ip ou domínio>',
    mode: 'edit',
    execute: async (args) => {
      const target = args[0] || '1.1.1.1'
      try {
        const res = await apiGeoIp(target)
        return {
          mode: 'edit',
          success: true,
          content:
            `🌐 **Geolocalização IP: \`${res.ip}\`**\n` +
            `• **Localização:** ${res.city}, ${res.region} - ${res.country} (:flag_${res.countryCode.toLowerCase()}:)\n` +
            `• **Fuso Horário:** ${res.timezone}\n` +
            `• **Coordenadas:** ${res.coordinates}\n` +
            `• **ISP / Provedor:** ${res.isp}\n` +
            `• **Organização:** ${res.org}\n` +
            `• **ASN:** ${res.as}`,
        }
      } catch (err: any) {
        return { mode: 'edit', success: false, content: `❌ Erro ao consultar IP: ${err.message}` }
      }
    },
  },

  wiki: {
    name: 'wiki',
    aliases: ['wikipedia'],
    category: 'utilities',
    description: 'Consulta resumo enciclopédico oficial na Wikipedia',
    usage: ';wiki <termo>',
    mode: 'edit',
    execute: async (args) => {
      const term = args.join(' ')
      if (!term) return { mode: 'edit', success: false, content: '❌ Informe o termo para pesquisar na Wikipedia.' }
      try {
        const w = await apiWikipedia(term)
        return {
          mode: 'edit',
          success: true,
          content:
            `📚 **Wikipedia: ${w.title}**\n` +
            `*${w.description}*\n\n` +
            `${w.extract.slice(0, 1200)}\n\n` +
            `🔗 Leia mais: <${w.url}>`,
        }
      } catch (err: any) {
        return { mode: 'edit', success: false, content: `❌ Artigo não encontrado na Wikipedia: ${err.message}` }
      }
    },
  },

  shorten: {
    name: 'shorten',
    aliases: ['tinyurl'],
    category: 'utilities',
    description: 'Encurta URLs longas usando TinyURL',
    usage: ';shorten <url>',
    mode: 'edit',
    execute: async (args) => {
      const url = args[0]
      if (!url) return { mode: 'edit', success: false, content: '❌ Informe a URL para encurtar.' }
      try {
        const short = await apiShortenUrl(url)
        return {
          mode: 'edit',
          success: true,
          content: `🔗 **URL Encurtada:** <${short}>`,
        }
      } catch (err: any) {
        return { mode: 'edit', success: false, content: `❌ Erro ao encurtar URL: ${err.message}` }
      }
    },
  },

  joke: {
    name: 'joke',
    aliases: ['piada'],
    category: 'utilities',
    description: 'Gera piada aleatória em inglês (modo seguro)',
    usage: ';joke [Programming|Misc|Pun]',
    mode: 'edit',
    execute: async (args) => {
      const cat = args[0] || 'Any'
      try {
        const j = await apiJoke(cat)
        if (j.punchline) {
          return {
            mode: 'edit',
            success: true,
            content: `😂 **${j.joke}**\n\n||${j.punchline}||`,
          }
        }
        return {
          mode: 'edit',
          success: true,
          content: `😂 ${j.joke}`,
        }
      } catch (err: any) {
        return { mode: 'edit', success: false, content: `❌ Erro ao carregar piada: ${err.message}` }
      }
    },
  },

  trivia: {
    name: 'trivia',
    aliases: ['fact', 'fato'],
    category: 'utilities',
    description: 'Exibe um fato curioso e inútil aleatório',
    usage: ';trivia',
    mode: 'edit',
    execute: async () => {
      try {
        const fact = await apiTriviaFact()
        return {
          mode: 'edit',
          success: true,
          content: `💡 **Você sabia?**\n*${fact}*`,
        }
      } catch (err: any) {
        return { mode: 'edit', success: false, content: `❌ Erro ao buscar fato: ${err.message}` }
      }
    },
  },
}

/**
 * Resolves a command by exact name or registered alias
 */
export function resolveCommand(commandName: string): CommandDefinition | null {
  const normalized = commandName.toLowerCase().trim()
  if (COMMAND_CATALOG[normalized]) {
    return COMMAND_CATALOG[normalized]
  }

  for (const cmd of Object.values(COMMAND_CATALOG)) {
    if (cmd.aliases.includes(normalized)) {
      return cmd
    }
  }

  return null
}
