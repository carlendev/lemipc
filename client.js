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

const main = async argv => {
    if (argv.length !== 4) weshOut()
    const [ team, id ] = argv.filter(entity => !isNaN(entity)).filter(entity => entity > 0)
    if (team === undefined || id === undefined) weshOut()
    player.team = team
    player.id = id
    let players = await db.get('players')
    if (players === null || players === undefined) {
        player.imgId = 1
    } else {
        players = JSON.parse(players)
        const keys = Object.keys(players)
        const len = keys.length
        wesh(players)
        for (let i = 0; i < len; ++i) {
            if (players[keys[i]].team == player.team && players[keys[i]].id == player.id) {
                wesh('Player id already taken !')
                weshOut()
            }
        }
        let is = false
        for (let i = 0; i < len; ++i) {
            if (player.team == players[keys[i]].team) {
                player.imgId = players[keys[i]].imgId
                is = true
            }
        }
        if (!is) {
            wesh('new team')
            let teams = []
            for (let i = 0; i < len; ++i)
                if (teams.indexOf(players[keys[i]].team) === -1) teams.push(players[keys[i]].team)
            const nbTeams = teams.length
            if (nbTeams > 2) players.imgId = 1
            else player.imgId = nbTeams + 1
        }
    }
    const io = socket.connect('http://127.0.0.1:3030')

    io.on('connect', () => {
        io.emit('addTeam', { team: player.team, id: player.id, imgId: player.imgId})
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
            x = getRandom(size / 2)
            y = getRandom(size / 2)
            first = false
        }
        else {
            const mine = players[`${player.team}${player.id}`]
            x = mine.pos.x
            y = mine.pos.y
            if (x === size && y  === size) --x
            else if (x === size) {
                --x
                ++y
            }
            else if (y === size) --y
            else if (x === 0 && y - 1 === 0) ++x
            else if (x === 0) {
                ++x
                --y
            }
            else if (y - 1 === 0) {
                ++y
                ++x
            }
            else {
                ++y
                ++x
            }
        }
        wesh(`${x} ${y}`)
        const pos = { x, y }
        players[`${player.team}${player.id}`].pos = pos
        wesh(players[`${player.team}${player.id}`])
        await db.set('players', JSON.stringify(players))
        io.emit('pos')
    })

    io.on('dead', () => {
        live = false
        wesh('I\' dead')
        process.exit(0)
    })

    io.on('disconnect', () => {
        live = false
        wesh('I\'m out')
        process.exit(0)
    })
}

main(process.argv)
