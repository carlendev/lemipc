/**
 * Created by carlen on 3/24/17.
 */
const createClient = require('then-redis').createClient
const socket = require('socket.io-client')

const wesh = msg => console.log(msg)

let live = false
const player = {}
const db = createClient()

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

    io.on('disconnect', () => {
        live = false
        wesh(`I am out`)
        process.exit(0)
    })
}

main(process.argv)