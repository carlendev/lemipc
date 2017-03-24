/**
 * Created by carlen on 3/14/17.
 */
import Koa from 'koa'
import _ from 'koa-route'
import { createClient } from 'then-redis'
const app = new Koa()

const db = createClient()

const map = {
    content: (ctx) => {
        ctx.body = {map: 'ok'}
    }
}

app.use(async (ctx, next) => {
    const start = new Date()
    await next()
    const ms = new Date() - start
    console.log(`${ctx.method} ${ctx.url} - ${ms} ms`)
});

app.use(_.get('/map', map.content))

app.listen(3030)

export { app }