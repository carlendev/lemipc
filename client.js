/**
 * Created by carlen on 3/24/17.
 */
const RedisMQ = require('rsmq')

const rsmq = new RedisMQ({ host: "127.0.0.1", port: 6379, ns: "rsmq" })

rsmq.sendMessage({ qname: 'lemipc', message: 'Hello World!' }, (err, resp) => {
    if (resp) console.log("Message sent. ID:", resp);
})

rsmq.sendMessage({ qname: 'lemipc', message: 'Hello World' }, (err, resp) => {
    if (resp) console.log("Message sent. ID:", resp);
})