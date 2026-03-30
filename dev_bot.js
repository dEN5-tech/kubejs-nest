const mineflayer = require('mineflayer')
const chokidar = require('chokidar')
const path = require('path')

const HOST = process.env.DEV_BOT_HOST || 'localhost'
const PORT = Number(process.env.DEV_BOT_PORT || 25565)
const USERNAME = process.env.DEV_BOT_USERNAME || 'DevBot'
const RELOAD_COMMAND = process.env.DEV_BOT_RELOAD_CMD || '/kubejs reload server_scripts'
const RECONNECT_DELAY_MS = Number(process.env.DEV_BOT_RECONNECT_MS || 3000)

// Можно переопределить через ENV: DEV_BOT_WATCH="src,dist,kubejs/server_scripts"
const WATCH_TARGETS = (process.env.DEV_BOT_WATCH || 'src,kubejs/server_scripts')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)
  .map(p => path.join(__dirname, p))

let bot = null
let connected = false
let reconnectTimer = null

let watcherStarted = false
let reloadCooldown = false
let pendingReloadReason = null

function sendReload(reason) {
  if (!bot || !connected) {
    pendingReloadReason = reason
    console.log(`[HotReload] queued (bot offline): ${reason}`)
    return
  }

  if (reloadCooldown) {
    pendingReloadReason = reason
    return
  }

  reloadCooldown = true
  try {
    console.log(`[HotReload] ${reason} -> ${RELOAD_COMMAND}`)
    bot.chat(RELOAD_COMMAND)
  } catch (err) {
    console.log('⚠️ Failed to send chat command:', err)
    pendingReloadReason = reason
  }

  setTimeout(() => {
    reloadCooldown = false
    if (pendingReloadReason) {
      const nextReason = pendingReloadReason
      pendingReloadReason = null
      sendReload(nextReason)
    }
  }, 500)
}

function startWatcherIfNeeded() {
  if (watcherStarted) return
  watcherStarted = true

  const watcher = chokidar.watch(WATCH_TARGETS, {
    ignored: /(^|[\\/])\../,
    persistent: true,
    ignoreInitial: true,
  })

  const onChange = filePath => {
    sendReload(`${path.basename(filePath)} changed`)
  }

  watcher.on('add', onChange)
  watcher.on('change', onChange)
  watcher.on('unlink', onChange)

  console.log(`👀 Watching: ${WATCH_TARGETS.join(', ')}`)
}

function scheduleReconnect(reason) {
  if (reconnectTimer) return
  console.log(`🔁 Reconnecting in ${RECONNECT_DELAY_MS}ms (${reason})...`)
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    createAndRunBot()
  }, RECONNECT_DELAY_MS)
}

function createAndRunBot() {
  bot = mineflayer.createBot({
    host: HOST,
    port: PORT,
    username: USERNAME,
  })

  bot.once('spawn', () => {
    connected = true
    console.log(`✅ Dev bot joined as ${USERNAME} (${HOST}:${PORT})`)

    startWatcherIfNeeded()
    if (pendingReloadReason) {
      const reason = pendingReloadReason
      pendingReloadReason = null
      sendReload(reason)
    }
  })

  bot.on('error', err => {
    console.log('❌ Bot error:', err)
  })

  bot.on('kicked', reason => {
    connected = false
    const text = String(reason)
    console.log('⚠️ Bot kicked:', text)

    if (text.includes('duplicate_login')) {
      console.log('ℹ️ duplicate_login: change DEV_BOT_USERNAME or stop other DevBot instance.')
    }
  })

  bot.on('end', () => {
    connected = false
    scheduleReconnect('connection ended')
  })
}

createAndRunBot()
