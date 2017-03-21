/**
 * Created by carlen on 3/14/17.
 */
import { app } from '../src/app'
const request = require('supertest').agent(app.listen())

describe('with valid credentials', () => {
    it('should call the next middleware', (done) => {
      request
        .get('/rooms')
        .expect(200, done)
    })
})