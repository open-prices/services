import { readyBanner, patterns2pins } from './common-plugins'
import cacheService, { patterns, stats } from './cache'

var PINS = patterns2pins(patterns)

var seneca = require('seneca')({
    tag : 'cache',
    log : 'silent'
}).use('mesh', {
    listen : PINS
}).use(cacheService).use(readyBanner).ready(function(){
    setInterval(function(){
        seneca.act(stats(), function(err, response){
            console.error(err)
            console.log(response && response.data)
        })
    }, 1000 * 5)
})
