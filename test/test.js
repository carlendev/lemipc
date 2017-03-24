/**
 * Created by carlen on 3/14/17.
 */
import { app } from '../src/app'
const request = require('supertest').agent(app.listen())

describe('[GET] Map', () => {
    it('should return the map', (done) => {
      request
        .get('/map')
        .expect(200, done)
    })
})