import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

const pkgPath = path.join(rootDir, 'package.json')
const lockPath = path.join(rootDir, 'package-lock.json')

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
const currentVersion = pkg.version || '1.4.4'

const parts = currentVersion.split('.').map(Number)
if (parts.length === 3 && parts.every((n) => !isNaN(n))) {
  parts[2] += 1
} else {
  parts[parts.length - 1] += 1
}

const newVersion = parts.join('.')
pkg.version = newVersion
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8')
console.log(`[Version Bump] package.json updated: ${currentVersion} -> ${newVersion}`)

if (fs.existsSync(lockPath)) {
  try {
    const lock = JSON.parse(fs.readFileSync(lockPath, 'utf-8'))
    lock.version = newVersion
    if (lock.packages && lock.packages['']) {
      lock.packages[''].version = newVersion
    }
    fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2) + '\n', 'utf-8')
    console.log(`[Version Bump] package-lock.json updated: ${newVersion}`)
  } catch (err) {
    console.warn(`[Version Bump] Could not update package-lock.json: ${err.message}`)
  }
}
