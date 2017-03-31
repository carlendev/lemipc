/**
 * Created by carlen on 3/24/17.
 */
const socket = require('socket.io-client')('http://127.0.0.1:3030')

const wesh = msg => console.log(msg)

let live = false

socket.on('connect',() => {
    socket.emit('addTeam', { team: 'test', id: 1 })
})

socket.on('beginLive', (data) => {
    live = true
    wesh(`Begin to live ${data.team}${data.id}`)
})

socket.on('disconnect', () => {
    live = false
    wesh(`I am out`)
    //TODO(carlendev) exit process
})