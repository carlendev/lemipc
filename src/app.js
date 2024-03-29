/**
 * Created by carlen on 3/14/17.
 */
import Koa from 'koa'
import _ from 'koa-route'
import Router from 'koa-trie-router'
import cors from 'koa2-cors'
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
const tsize = 64
const maxRandom = 3
const teams = 'teams'
const clientsId = []
const clients = {}
const db = createClient()

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

const getPos = (x, y, team, player) => JSON.stringify({ x, y, team, player })

const initPos = (x, y, team, player) => db.set(`pos${team}${player}`, getPos(x, y, team, player))

const map = {
    generate: async ctx => {
        const value = ctx.request.body
        if (isNaN(value.size) || parseInt(value.size) < 5) {
            ctx.throw('Size must be a number ang greater than 5', 400)
            return
        }
        await initMap(parseInt(value.size))
        await db.set('size', value.size)
        ctx.body = { status: 'Map saved' }
    },
    content: async ctx => ctx.body = { map: await db.get('map') },
}

const posTaken = async (posDB, value) => {
    let taken = false
    for (let i = 0; i < posDB.length; ++i) {
        const pos = JSON.parse(await db.get(posDB[i]))
        if (pos.x === value.pos.x && pos.y === value.pos.y) taken = true
    }
    return taken
}

const player = {
    generate: async ctx => {
        const value = ctx.request.body
        const size = await db.get('size')
        if (isNaN(value.pos.x) || isNaN(value.pos.y) || parseInt(value.pos.x) < 0 ||
            parseInt(value.pos.y) < 0 || value.pos.x > size || value.pos.y > size ||
            value.team === undefined || value.player === undefined) {
            ctx.throw('Wrong JSON Format', 400)
            return
        }
        const pos = await db.send('keys', ['pos*'])
        const taken = await posTaken(pos, value)
        if (taken) {
            ctx.body = { status: 'Pos already taken' }
            return
        }
        await initPos(value.pos.x, value.pos.y, value.team, value.player)
        ctx.body = { status: 'Pos saved' }
    }
}

app.use(async (ctx, next) => {
    const start = new Date()
    await next()
    const ms = new Date() - start
    wesh(`${ctx.method} ${ctx.url} - ${ms} ms`)
});

app.use(_.get('/api/map', map.content))

router.put('/api/map', map.generate)
router.put('/api/player/pos', player.generate)

app.use(router.middleware())

app._io.on('connection', socket => {
    wesh(`New client connected (id=${socket.id})`)
    clientsId.push(socket)

    socket.on('addTeam', async (data) => {
        const client = clients[`${data.team}${data.id}`] = {
            team: data.team,
            id: data.id,
            imgId: data.imgId,
            socketId: socket.id,
            pos: {}
        }
        let players = await db.get('players')
        if (players === null || players === undefined) players = {}
        else players = JSON.parse(players)
        players[`${data.team}${data.id}`] = client
        await db.set('players', JSON.stringify(players))
        await db.send('sadd', [ teams, data.team ])
        wesh(`Client ${data.team}${data.id} added`)
        socket.emit('beginLive', client)
    })

    socket.on('pos', async (data) => {
        wesh('recieve pos')
        app._io.emit('players', await db.get('players'))
    })

    socket.on('dead', async data => {
        const deadPlayer = JSON.parse(data)
        wesh(`${deadPlayer.team} -> ${deadPlayer.id} is dead`)
        let socketToEmit = null
        for (let i = 0; i < clientsId.length; ++i)
            if (deadPlayer.socketId == clientsId[i].id) socketToEmit = clientsId[i]
        if (socketToEmit !== null) socketToEmit.emit('dead', {})
        let players = await db.get('players')
        if (players === null || players === undefined) return
        players = JSON.parse(players)
        players[`${deadPlayer.team}${deadPlayer.id}`] = undefined
        await db.set('players', JSON.stringify(players))
        players = await db.get('players')
        players = JSON.parse(players)
        const keys = Object.keys(players)
        const len = keys.length
        let teams = []
        for (let i = 0; i < len; ++i)
            if (teams.indexOf(players[keys[i]].team) === -1) teams.push(players[keys[i]].team)
        const nbTeams = teams.length
        wesh('nb teams')
        wesh(nbTeams)
        if (nbTeams === 1) {
            await app._io.emit('victory', JSON.stringify({ team: teams[0]} ))
            process.exit(0)
        }
    })

    socket.on('disconnect', async () => {
        const index = clientsId.indexOf(socket)
        if (index === -1) return
        let key = false
        const keys = Object.keys(clients)
        for (let i = 0; i < keys.length; ++i) if (clients[keys[i]].socketId === socket.id) key = keys[i]
        if (key !== false) delete clients[key]
        clientsId.splice(index, 1)
        await db.set('players', JSON.stringify(clients))
        wesh(`Client gone (id=${socket.id})`)
    })
})

Promise.all([db.send('FLUSHALL', [])]).then(async () => {
    await db.set('order', -1)
    setInterval(async () => {
        const size = await db.get('size')
        if (size === null || size === undefined) {
            wesh('map not set')
            return
        }
        wesh('Action Begin')
        const teamsDB = await db.send('smembers', [ teams ])
        if (!teamsDB.length) {
            wesh('No teams available')
            return
        }
        let current = parseInt(await db.get('order'))
        if (current === -1) await db.set('order', teamsDB[0])
        current = parseInt(await db.get('order'))
        const clientsDB = JSON.parse(await db.get('players'))
        const keys = Object.keys(clientsDB)
        const teamPlayerID = []
        for (let i = 0; i < keys.length; ++i) if (clientsDB[keys[i]].team == current) teamPlayerID.push(keys[i])
        const socketClient = []
        for (let i = 0; i < teamPlayerID.length; ++i) for (let j = 0; j < clientsId.length; ++j)
            if (clientsDB[teamPlayerID[i]].socketId == clientsId[j].id) socketClient.push(clientsId[j])
        for (let i = 0; i < socketClient.length; ++i) await socketClient[i].emit('pos', await db.get('players'))
        if (teamsDB.length === 1) return
        const currentIndex = teamsDB.indexOf(current.toString())
        let futurIndex
        if (currentIndex === teamsDB.length - 1) futurIndex = 0
        else futurIndex = currentIndex + 1
        wesh('change order')
        await db.set('order', teamsDB[futurIndex])
    }, 1000)
    app.listen(3030)
})

export { app }