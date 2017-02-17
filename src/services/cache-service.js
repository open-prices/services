import { readyBanner, patterns2pins } from './common-plugins'
import cacheService, { patterns, stats } from './cache'

var PINS = patterns2pins(patterns)

var seneca = require('seneca')({
    tag : 'cache',
    log : 'silent'
}).use('mesh', {
    listen : PINS
}).use(cacheService).use(readyBanner)
