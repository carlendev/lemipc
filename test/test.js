/**
 * Created by carlen on 3/14/17.
 */
import { app } from '../src/app'
const request = require('supertest').agent(app.listen())

/*
describe('[PUT] Map', () => {
    it('should return the valid status', done => {
        request.put({
            url: 'http://127.0.0.1:3000/api/map',
            headers: {'Content-Type': 'application/json'},
            body: {'size': 17},
            json: true
        })
            .expect(200)
            .expect({ status: 'Map saved' }, done)
    })
})
*/
describe('[GET] Map', () => {
    it('should return the map', done => {
        request
            .get('/api/map')
            .expect(200, done)
    })
})