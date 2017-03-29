/**
 * Created by carlen on 3/14/17.
 */
import Koa from 'koa'
import _ from 'koa-route'
import Router from 'koa-trie-router'
import { createClient } from 'then-redis'
import cors from 'koa2-cors'
import RedisMQ from 'rsmq'

const app = new Koa()
const router = new Router()

app.use(cors())

const wesh = msg => console.log(msg)
const size = 17
const tsize = 32
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
    for (let i = 0; i < size; ++i)
        for (let j = 0; j < size; ++j) map[i][j] = getRandom(maxRandom)
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

const map = {
    generate: ctx => {},
    content: async ctx => ctx.body = { map: await db.get('map') },
}

app.use(async (ctx, next) => {
    const start = new Date()
    await next()
    const ms = new Date() - start
    wesh(`${ctx.method} ${ctx.url} - ${ms} ms`)
});

app.use(_.get('/api/map', map.content))

router.put('/api/map', map.generate)

app.use(router.middleware())

Promise.all([initMap(size), createQueue(), listenQueue()]).then(app.listen(3030))

export { app, generateMap, generateMapObj, size }