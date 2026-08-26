#!/usr/bin/env node
/**
 * Interactive setup for the ClaudePress self-service password-reset flow.
 *
 * Run once per site (or re-run any time — it is idempotent):
 *
 *   node scripts/setup-password-reset.mjs
 *
 * What it does, against a site's PocketBase, authenticated as a superuser:
 *   1. Retargets the `users` password-reset email so its link points at the
 *      site's own frontend page: <FRONTEND>/reset-password?token={TOKEN}
 *      (not PocketBase's built-in /_/ reset UI, which sites put behind
 *      Cloudflare Access).
 *   2. Optionally configures SMTP (host/port/credentials/sender).
 *   3. Sends a test password-reset email so you can confirm delivery.
 *   4. Optionally flips the frontend flag by appending
 *      NUXT_PUBLIC_PASSWORD_RESET_ENABLED=true to a .env you point it at.
 *
 * Superuser auth and every write go through PocketBase's /api endpoints, so
 * this works even when the /_/ admin UI is gated by Cloudflare Access.
 *
 * Nothing here touches the frontend runtime except the optional .env append —
 * after that you still redeploy the frontend for the flag to take effect.
 */

import PocketBase from 'pocketbase'
import readline from 'node:readline'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

// ---- tiny prompt helpers (no external deps) --------------------------------
//
// One shared readline interface for the whole run. Creating a new interface per
// prompt drops buffered stdin between prompts (fine when a human types, broken
// under piped input) — so we keep a single `rl` and mute it for secrets.

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
let mutePrompt = false
rl._writeToOutput = (str) => {
  if (!mutePrompt) process.stdout.write(str)
  else if (str.includes('\n')) process.stdout.write('\n')
}

function ask(query, def = '') {
  const suffix = def ? ` [${def}]` : ''
  return new Promise((resolve) => {
    rl.question(`${query}${suffix}: `, (answer) => resolve(answer.trim() || def))
  })
}

function askHidden(query) {
  return new Promise((resolve) => {
    // Print the prompt un-muted, then mute the echo of what's typed.
    process.stdout.write(`${query}: `)
    mutePrompt = true
    rl.question('', (answer) => {
      mutePrompt = false
      resolve(answer)
    })
  })
}

async function askYesNo(query, def = false) {
  const hint = def ? 'Y/n' : 'y/N'
  const a = (await ask(`${query} (${hint})`)).toLowerCase()
  if (!a) return def
  return a.startsWith('y')
}

const log = (m) => console.log(m)
const ok = (m) => console.log(`  \x1b[32m✓\x1b[0m ${m}`)
const warn = (m) => console.log(`  \x1b[33m!\x1b[0m ${m}`)
const die = (m) => { console.error(`\n\x1b[31m✗ ${m}\x1b[0m`); process.exit(1) }

// ---- main ------------------------------------------------------------------

async function main() {
  log('\nClaudePress — password-reset setup\n' + '─'.repeat(36))

  // 1. Connect + authenticate as superuser.
  const pbUrl = await ask('PocketBase URL', process.env.NUXT_PUBLIC_PB_URL || 'http://localhost:8090')
  const pb = new PocketBase(pbUrl)
  pb.autoCancellation(false)

  const suEmail = await ask('Superuser email')
  const suPass = await askHidden('Superuser password')
  try {
    await pb.collection('_superusers').authWithPassword(suEmail, suPass)
  } catch (e) {
    die(`Superuser login failed: ${e?.response?.message || e?.message || e}`)
  }
  ok(`Authenticated as ${suEmail}`)

  // 2. Frontend origin → retarget the reset email template.
  let frontend = await ask('\nPublic frontend origin (where /reset-password is served)',
    'http://localhost:3000')
  frontend = frontend.replace(/\/+$/, '')
  if (!/^https?:\/\//.test(frontend)) die('Frontend origin must start with http:// or https://')

  const resetLink = `${frontend}/reset-password?token={TOKEN}`

  const users = await pb.collections.getOne('users')
  const tmpl = users.resetPasswordTemplate || {}
  if (!tmpl.body) die('users collection has no resetPasswordTemplate to update')

  // Replace whatever href currently carries {TOKEN} (PB default or a prior run).
  const newBody = tmpl.body.replace(/href="[^"]*\{TOKEN\}[^"]*"/, `href="${resetLink}"`)
  if (newBody === tmpl.body && !tmpl.body.includes(resetLink)) {
    warn('Could not find the reset link in the template body — leaving it unchanged.')
    warn('Set the button href manually to: ' + resetLink)
  } else if (newBody === tmpl.body) {
    ok('Reset email already points at ' + resetLink)
  } else {
    await pb.collections.update('users', {
      resetPasswordTemplate: { subject: tmpl.subject, body: newBody },
    })
    ok('Reset email now links to ' + resetLink)
  }

  // 3. Configure SMTP — but only prompt when it isn't already set up.
  const settings = await pb.settings.getAll()
  const smtpOn = settings?.smtp?.enabled
  let configureSmtp = false
  if (smtpOn) {
    ok(`SMTP already configured (${settings.smtp.host}) — skipping. The test send below confirms it works.`)
  } else {
    log('\n\x1b[33mSMTP is not configured\x1b[0m — no reset email can be sent without it.')
    configureSmtp = await askYesNo('Configure SMTP now?', true)
  }
  if (configureSmtp) {
    const host = await ask('  SMTP host', settings?.smtp?.host || '')
    const port = parseInt(await ask('  SMTP port', String(settings?.smtp?.port || 587)), 10)
    const username = await ask('  SMTP username', settings?.smtp?.username || '')
    const password = await askHidden('  SMTP password')
    const tls = await askYesNo('  Use implicit TLS (usually yes for port 465, no for 587)', port === 465)
    const senderName = await ask('  Sender name', settings?.meta?.senderName || 'Support')
    const senderAddress = await ask('  Sender address (from:)', settings?.meta?.senderAddress || username)

    await pb.settings.update({
      smtp: {
        enabled: true,
        host,
        port,
        username,
        // Leave password unchanged if left blank on a re-run.
        ...(password ? { password } : {}),
        tls,
        authMethod: settings?.smtp?.authMethod || '',
        localName: settings?.smtp?.localName || '',
      },
      meta: { ...settings.meta, senderName, senderAddress },
    })
    ok('SMTP settings saved')
  }

  // 4. Test send.
  if (await askYesNo('\nSend a test password-reset email now?', true)) {
    const to = await ask('  Send test to', suEmail)
    try {
      await pb.settings.testEmail('users', to, 'password-reset')
      ok(`Test email dispatched to ${to} — check the inbox (and spam).`)
    } catch (e) {
      warn(`Test send failed: ${e?.response?.message || e?.message || e}`)
      warn('Fix SMTP and re-run; the template change above is already saved.')
    }
  }

  // 5. Frontend flag (optional .env append).
  log('\nOne frontend step remains: the "Forgot password?" link and pages are')
  log('gated by NUXT_PUBLIC_PASSWORD_RESET_ENABLED (default off).')
  if (await askYesNo('Append NUXT_PUBLIC_PASSWORD_RESET_ENABLED=true to a .env file?', false)) {
    const envPath = await ask('  Path to .env')
    if (!envPath) {
      warn('No path given — skipping.')
    } else if (!existsSync(envPath)) {
      warn(`${envPath} does not exist — skipping. Add the line manually.`)
    } else {
      let content = readFileSync(envPath, 'utf8')
      const line = 'NUXT_PUBLIC_PASSWORD_RESET_ENABLED=true'
      if (/^NUXT_PUBLIC_PASSWORD_RESET_ENABLED=.*$/m.test(content)) {
        content = content.replace(/^NUXT_PUBLIC_PASSWORD_RESET_ENABLED=.*$/m, line)
      } else {
        content = content.replace(/\n?$/, '\n') + line + '\n'
      }
      writeFileSync(envPath, content)
      ok(`Set ${line} in ${envPath}`)
    }
    warn('Redeploy/recreate the frontend for the flag to take effect.')
  } else {
    log('  → Add NUXT_PUBLIC_PASSWORD_RESET_ENABLED=true to the frontend env and redeploy.')
  }

  log('\n\x1b[32mDone.\x1b[0m Reset flow: /login → Forgot password? → email → /reset-password.\n')
}

main()
  .then(() => rl.close())
  .catch((e) => die(e?.stack || e?.message || String(e)))
