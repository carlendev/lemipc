/**
 * Created by carlen on 3/14/17.
 */
import { app, generateMap, size, mapObj } from '../src/app'
const request = require('supertest').agent(app.listen())

describe('[GET] Map', () => {
    it('should return the map', (done) => {
        request
            .get('/api/map')
            .expect(200)
            .expect({ map: generateMap(size).toString() }, done)
    })
})

describe('[GET] Map Obj', () => {
    it('should return the map obj', (done) => {
        request
            .get('/api/map/obj')
            .expect(200)
            .expect({ map: mapObj }, done)
    })
})