const Koa = require('koa')
const debug = require('debug')('ssb-compose')
const fs = require('fs')
const opn = require('opn')
const path = require('path')
const ssbConfig = require('ssb-config/inject')
const ssbServer = require('ssb-server')
  .use(require('ssb-server/plugins/master'))
  .use(require('ssb-ws'))

debug.enabled = true

const caps = {
  shs: '1KHLiKZvAvjbY1ziZEHMXawbCEIM6qwjCDm3VYRan/s='
}

const customConfig = {
  caps,
  connections: {
    incoming: {
      ws: [{
        scope: ['public', 'local', 'device'],
        port: 9000,
        transform: 'shs'
      }]
    }
  }
}

const config = ssbConfig('ssb', customConfig)

ssbServer(config)

const app = new Koa()
const port = 8000

const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'build', 'index.html'), 'utf8')

app.use(async (ctx, next) => {
  ctx.response.body = indexHtml
  return next()
})

const encodedKeys = Buffer.from(JSON.stringify(config.keys)).toString('base64')

app.listen(port)
debug('opening browser')
const url = `http://localhost:${port}?secret=${encodedKeys}`

opn(url)
