const Koa = require('koa')
const debug = require('debug')('ssb-compose')
const fs = require('fs')
const opn = require('opn')
const path = require('path')
const crypto = require('crypto')
const ssbConfig = require('ssb-config/inject')
const ssbServer = require('ssb-server')
  .use(require('ssb-server/plugins/master'))
  .use(require('ssb-ws'))

const caps = {
  shs: '1KHLiKZvAvjbY1ziZEHMXawbCEIM6qwjCDm3VYRan/s='
}

const customConfig = {
  caps,
  connections: {
    incoming: {
      ws: [{
        scope: ['device'],
        port: 9000,
        transform: 'shs'
      }]
    }
  }
}

const config = ssbConfig('ssb', customConfig)

module.exports = () => {
  const token = crypto.randomBytes(256).toString('hex')
  ssbServer(config)

  const app = new Koa()
  const port = 8000

  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'build', 'index.html'), 'utf8')

  app.use(async (ctx, next) => {
    if (ctx.request.url === '/?' + token) {
      const ssbSecret = JSON.stringify(config.keys)
      const script = `<script>window.ssbSecret = ${ssbSecret}</script>`
      ctx.response.body = indexHtml + script
      return next()
    } else {
      ctx.throw(401, 'unauthorized')
    }
  })

  app.listen(port)

  const url = `http://localhost:${port}/?${token}`
  debug(`opening browser: ${url}`)
  opn(url)
}
