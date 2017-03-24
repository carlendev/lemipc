/**
 * Created by carlen on 3/14/17.
 */
import Koa from 'koa'
import _ from 'koa-route'
import { createClient } from 'then-redis'
const app = new Koa()

const db = createClient()

/*
const db = {
    rooms: [
        'sm1',
        'sm2',
        'sm3',
        'hub'
    ]
}

const rooms = {
    list: (ctx) => {
        ctx.body = {rooms: db.rooms}
    }
}
*/

app.use(async (ctx, next) => {
    const start = new Date()
    await next()
    const ms = new Date() - start
    console.log(`${ctx.method} ${ctx.url} - ${ms} ms`)
});

//app.use(_.get('/rooms', rooms.list))

app.listen(3030)

export { app }