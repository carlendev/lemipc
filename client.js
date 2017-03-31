/**
 * Created by carlen on 3/24/17.
 */
const createClient = require('then-redis').createClient
const socket = require('socket.io-client')

const wesh = msg => console.log(msg)
const getRandom = max => Math.floor(Math.random() * max) + 1

let live = false
const player = {}
const db = createClient()
let first = true

const weshOut = () => {
    wesh('Usage ./client.js team id')
    process.exit(0)
}

const main = argv => {
    if (argv.length !== 4) weshOut()
    const [ team, id ] = argv.filter(entity => !isNaN(entity)).filter(entity => entity > 0)
    if (team === undefined || id === undefined) weshOut()
    player.team = team
    player.id = id
    const io = socket.connect('http://127.0.0.1:3030')

    io.on('connect', () => {
        io.emit('addTeam', { team: player.team, id: player.id })
    })

    io.on('beginLive', (data) => {
        live = true
        wesh(`Begin to live ${data.team}${data.id}`)
    })

    io.on('pos', async (data) => {
        wesh('pos')
        const players = JSON.parse(await db.get('players'))
        const size = parseInt(await db.get('size')) - 1
        let x;
        let y;
        if (first) {
            x = getRandom(size)
            y = getRandom(size)
            first = false
        }
        else {
            const mine = players[`${player.team}${player.id}`]
            x = mine.pos.x
            y = mine.pos.y
            if (x + 1 == size && y + 1 == size) --x
            else if (x + 1 == size) {
                --x
                if (getRandom(2) == 1) ++y
                else --y
            }
            else if (y + 1 == size) {
                if (getRandom(2) == 1) ++x
                else --x
            }
            else if (x - 1 == 0 && y - 1 == 0) ++x
            else if (x - 1 == 0) {
                ++x
                if (getRandom(2) == 1) ++y
                else --y
            }
            else if (y - 1 == 0) {
                ++y
                if (getRandom(2) == 1) --x
                else ++x
            }
            else {
                if (getRandom(2) == 1) --y
                else ++y
                if (getRandom(2) == 1) --x
                else ++x
            }
        }
        wesh(`${x} ${y}`)
        const pos = { x, y }
        players[`${player.team}${player.id}`].pos = pos
        wesh(players[`${player.team}${player.id}`])
        await db.set('players', JSON.stringify(players))
        io.emit('pos')
    })

    io.on('disconnect', () => {
        live = false
        wesh('I\'m out')
        process.exit(0)
    })
}

main(process.argv)
