import { readyBanner } from './common-plugins'
import cacheService, { PINS } from './cache'

var seneca = require('seneca')({
    tag : 'cache',
    log : 'silent'
}).use('mesh', {
    listen : PINS
}).use(cacheService).use(readyBanner)
