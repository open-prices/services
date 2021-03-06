import { readyBanner, patterns2pins } from './common-plugins'
import plugin, { NAME, patterns } from './vendors'
import { CacheClient, useCache } from './cache'

var PINS = patterns2pins(patterns)

var seneca = require('seneca')({
    tag: 'vendors',
    log: 'silent',
    transport: {
        web: {
            timeout: 1000 * 60
        }
    }
})

seneca.fixedargs['fatal$'] = false

seneca.use('mesh', {
    listen: PINS
}).use(plugin).use(useCache, {
    namespace: NAME,
    listen: PINS
}).use(readyBanner)

seneca.use(function () {
    var seneca = this
    this.add(patterns.echo, function (action, done) {
        done(null, seneca)
    })
})
