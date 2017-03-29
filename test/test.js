/**
 * Created by carlen on 3/14/17.
 */
import { app, generateMap, generateMapObj, size} from '../src/app'
const request = require('supertest').agent(app.listen())

describe('[GET] Map', () => {
    it('should return the map', (done) => {
        request
            .get('/api/map')
            .expect(200, done)
            //.expect({ map: generateMapObj(size, generateMap(size)) }, done)
    })
})