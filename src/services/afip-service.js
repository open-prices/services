import { Persona } from 'node-afip'
import { readyBanner } from './common-plugins'

var PIN = {
    SERVICE: 'AFIP',
    TYPE: 'PERSONA'
}

var seneca = require('seneca')({
    tag: 'afip',
    log: 'silent',
    transport: {
        web: {
            timeout: 1000 * 60
        }
    }
})

seneca.fixedargs['fatal$'] = false

seneca.use('mesh', { pin: PIN }).use(function afip(options) {

    var seneca = this

    seneca.add(PIN, function (action, done) {
        var code = action.code
        Persona.find(code).then(persona => {
            if (!persona) return done(new Error('NodeAfipError'))
            done(null, {
                data : persona.get()
            })
        }).catch(err => {
            done(err)
        })
    })

}).use(readyBanner)
