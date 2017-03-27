/**
 * Created by carlen on 3/14/17.
 */
import Koa from 'koa'
import _ from 'koa-route'
import { createClient } from 'then-redis'
import RedisMQ from 'rsmq'
const app = new Koa()

const size = 17
const db = createClient()
const rsmq = new RedisMQ({ host: "127.0.0.1", port: 6379, ns: "rsmq" })

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
    content: async ctx => ctx.body = { map: await db.get('map') }
}

app.use(async (ctx, next) => {
    const start = new Date()
    await next()
    const ms = new Date() - start
    console.log(`${ctx.method} ${ctx.url} - ${ms} ms`)
});

app.use(_.get('/map', map.content))

Promise.all([initMap(size), createQueue(), listenQueue()]).then(app.listen(3030))

export { app, generateMap, size }