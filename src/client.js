const css = require('sheetify')
const ssbClient = require('ssb-client')
const ssbConfigInject = require('ssb-config/inject')
const ssbMarkdown = require('ssb-markdown')
var choo = require('choo')
var devtools = require('choo-devtools')
var html = require('choo/html')
var raw = require('nanohtml/raw')

var app = choo()
app.use(devtools())
app.use(identityStore)
app.use(textStore)
app.route('/', mainView)
app.mount('body')

function mainView (state, emit) {
  let keys = window.ssbSecret

  const ssbConfig = ssbConfigInject('ssb', { keys })
  let remote = null

  if (state.id == null) {
    const shortKey = keys.public.split('.')[0]
    remote = `ws://localhost:9000~shs:${shortKey}`
    ssbClient(keys, {
      caps: ssbConfig.caps,
      remote,
      manifest: {
        createFeedStream: 'source',
        whoami: 'sync'
      }
    }, (err, api) => {
      if (err) throw err

      api.whoami((err, whoiam) => {
        if (err) throw err
        emit('id', whoiam.id)
      })
    })
  }

  function setOutput (change) {
    emit('markdown', change.target.value)
  }

  const body = css`
    :host {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
      font-size: 16px;
      text-align: center;
    }
    `

  const container = css`
    :host {
      display: flex;
      text-align: left;
    }

    :host > textarea {
      flex: 1;
      min-height: 16em;
      margin: 1rem;
      padding: 1rem;
    }

    :host > div {
      flex: 1;
      margin: 1rem;
      padding: 1rem;
      background-color: #f8f8f8;
    }
    `

  function publish () {
    if (remote == null) {
      throw new Error('why is remote null? this is unexpected')
    }

    ssbClient(keys, {
      caps: ssbConfig.caps,
      remote,
      manifest: {
        publish: 'async'
      }
    }, (err, api) => {
      if (err) throw err

      api.publish({ type: 'post', text: state.markdown }, (err, res) => {
        if (err) throw err
        console.log(res)
        emit('markdown', '')
      })
    })
  }

  function maybeButton () {
    if (state.id) {
      return html`<button name="button" onclick=${publish}>publish! (no undo)</button>`
    } else {
      return html`<p>you aren't logged in yet -- maybe something is broken?</p>`
    }
  }

  return html`
    <body class=${body}>
      <div class=${container}>
        <textarea oninput="${setOutput}">${state.markdown}</textarea>
        <div>
          ${state.html}
        </div>
      </div>
      ${maybeButton()}
    </body>
  `
}

function identityStore (state, emitter) {
  state.id = null
  emitter.on('id', function (identity) {
    state.id = identity
    emitter.emit('render')
  })
}

function textStore (state, emitter) {
  state.html = null
  state.markdown = null

  emitter.on('markdown', function (md) {
    state.markdown = md
    state.html = raw(ssbMarkdown.block(md))
    emitter.emit('render')
  })
}
