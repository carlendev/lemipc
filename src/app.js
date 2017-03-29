/**
 * Created by carlen on 3/14/17.
 */
import Koa from 'koa'
import _ from 'koa-route'
import { createClient } from 'then-redis'
import cors from 'kcors';
import RedisMQ from 'rsmq'
const app = new Koa()

app.use(cors());

const size = 17
const db = createClient()
const rsmq = new RedisMQ({ host: "127.0.0.1", port: 6379, ns: "rsmq" })
const mapObj = {
    cols: 8,
    rows: 8,
    tsize: 64,
    tiles: [
        1, 3, 3, 3, 1, 1, 3, 1,
        1, 1, 1, 1, 1, 1, 1, 1,
        1, 1, 1, 1, 1, 2, 1, 1,
        1, 1, 1, 1, 1, 1, 1, 1,
        1, 1, 1, 2, 1, 1, 1, 1,
        1, 1, 1, 1, 2, 1, 1, 1,
        1, 1, 1, 1, 2, 1, 1, 1,
        1, 1, 1, 1, 2, 1, 1, 1
    ]
}

const fill = (nb, value) => Array(nb).fill(value)
const generateMap = size => {
    let array = fill(17, [])
    for (let i = 0; i < size; ++i) array[i] = fill(17, 0)
    return array
}
const initMap = size => db.set('map', generateMap(size).toString())
const createQueue = () => {
    rsmq.createQueue({ qname: 'lemipc' }, (err, resp) => {
        if (resp == 1) console.log('queue created')
    })
}
const listenQueue = () => {
    rsmq.receiveMessage({ qname: 'lemipc' }, (err, resp) => {
        if (resp.id) console.log('Message received.', resp)
        else console.log('No messages for me...')
    })
}

const map = {
    content: async ctx => ctx.body = {map: await db.get('map')},
    obj: ctx => ctx.body = { map: mapObj }
}

app.use(async (ctx, next) => {
    const start = new Date()
    await next()
    const ms = new Date() - start
    console.log(`${ctx.method} ${ctx.url} - ${ms} ms`)
});

app.use(_.get('/api/map', map.content))
app.use(_.get('/api/map/obj/', map.obj))

Promise.all([initMap(size), createQueue(), listenQueue()]).then(app.listen(3030))

export { app, generateMap, size, mapObj }