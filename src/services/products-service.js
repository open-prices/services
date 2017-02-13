import { readyBanner, patterns2pins } from './common-plugins'
import products, { NAME, patterns } from './products'
import { CacheClient, useCache } from './cache'

var PINS = patterns2pins(patterns)

var seneca = require('seneca')({
    tag: 'products',
    log: 'silent',
    transport : {
        web : {
            timeout : 1000 * 60
        }
    }
})

seneca.fixedargs['fatal$'] = false

seneca.use('mesh', {
    listen: PINS
}).use(products).use(useCache, {
    namespace : NAME,
    listen : PINS,
    log : console.info
}).use(readyBanner)
