import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

function run(cmd) {
  console.log(`\n> ${cmd}`)
  execSync(cmd, { cwd: rootDir, stdio: 'inherit' })
}

// 1. Bump version
run('node scripts/bump-version.mjs')

// 2. Read new version
const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8'))
const version = pkg.version
const tag = `v${version}`

console.log(`\n🚀 Preparing automated release for ${tag}...`)

// 3. Build frontend and electron
run('npm run build')
run('npx tsc -p tsconfig.electron.json')

// 4. Build Windows installer & portable binaries
run('npx electron-builder --win')

// 5. Commit & Tag Git
run('git add package.json package-lock.json')
run(`git commit -m "release: ${tag}"`)
run(`git tag ${tag}`)
run('git push origin main')
run(`git push origin ${tag}`)

// 6. Publish to GitHub Releases via gh CLI
const setupExe = `release/PhantomClear-Setup-${version}.exe`
const portableExe = `release/PhantomClear-Portable-${version}.exe`
const blockmap = `release/PhantomClear-Setup-${version}.exe.blockmap`
const latestYml = `release/latest.yml`
const icon = `public/icon.png`

console.log(`\n📦 Uploading assets to GitHub release ${tag}...`)
run(`gh release create ${tag} "${setupExe}" "${portableExe}" "${blockmap}" "${latestYml}" "${icon}" --title "PhantomClear V2 — ${tag}" --notes "Automated release ${tag}"`)

console.log(`\n✅ Release ${tag} published successfully to GitHub!`)
