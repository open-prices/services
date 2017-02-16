var seneca = require('seneca')({
    tag: 'webapi-client',
    log: 'silent'
}).use('mesh')

module.exports = seneca
