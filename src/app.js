/**
 * Created by carlen on 3/14/17.
 */
import Koa from 'koa'
import _ from 'koa-route'
import Router from 'koa-trie-router'
import cors from 'koa2-cors'
import RedisMQ from 'rsmq'
import bodyParser from 'koa-bodyparser'
import IO from 'koa-socket'
import { createClient } from 'then-redis'

const app = new Koa()
const io = new IO()
const router = new Router()

app.use(cors())
app.use(bodyParser())
io.attach(app)

const wesh = msg => console.log(msg)
const size = 17
const tsize = 64
const maxRandom = 3
const db = createClient()
const rsmq = new RedisMQ({ host: "127.0.0.1", port: 6379, ns: "rsmq" })

const fill = (nb, value) => Array(nb).fill(value)

const generateMap = size => {
    let array = fill(size, [])
    for (let i = 0; i < size; ++i) array[i] = fill(size, 0)
    return array
}

const getRandom = max => Math.floor(Math.random() * max) + 1

const generateMapObj = (size, map) => {
    for (let i = 0; i < size; ++i) for (let j = 0; j < size; ++j) map[i][j] = getRandom(maxRandom)
    return JSON.stringify({
        cols: size,
        rows: size,
        tsize,
        tiles: map
    })
}

const initMap = size => db.set('map', generateMapObj(size, generateMap(size)))

const createQueue = () => {
    rsmq.createQueue({ qname: 'lemipc' }, (err, resp) => {
        if (resp == 1) wesh('queue created')
    })
}

const listenQueue = () => {
    rsmq.receiveMessage({ qname: 'lemipc' }, (err, resp) => {
        if (resp.id) wesh('Message received.', resp)
        else wesh('No messages for me...')
    })
}

const getPos = (x, y) => JSON.stringify({ x, y })

const initPos = (x, y) => db.set('pos', getPos(x, y))

const map = {
    generate: async ctx => {
        const value = ctx.request.body
        if (isNaN(value.size) || parseInt(value.size) < 5) {
            ctx.throw('Size must be a number ang greater than 5', 400)
            return
        }
        await initMap(parseInt(value.size))
        ctx.body = { status: 'Map saved' }
    },
    content: async ctx => ctx.body = { map: await db.get('map') },
}

const player = {
    generate: async ctx => {
        const value = ctx.request.body
        //TODO(carlendev) watch fo bigger than size
        if (isNaN(value.pos.x) || isNaN(value.pos.y) || parseInt(value.pos.x) < 0 || parseInt(value.pos.y) < 0) {
            ctx.throw('Wrong JSON Format', 400)
            return
        }
        await initPos(value.pos.x, value.pos.y)
        ctx.body = { status: 'Pos saved' }
    },
    content: async ctx => ctx.body = { pos: await db.get('pos') }
}

app.use(async (ctx, next) => {
    const start = new Date()
    await next()
    const ms = new Date() - start
    wesh(`${ctx.method} ${ctx.url} - ${ms} ms`)
});

app.use(_.get('/api/map', map.content))
app.use(_.get('/api/player/pos', player.content))

router.put('/api/map', map.generate)
router.put('/api/player/pos', player.generate)

app.use(router.middleware())

Promise.all([initMap(size), initPos(0, 0), createQueue(), listenQueue()]).then(app.listen(3030))

export { app, generateMap, generateMapObj, size }