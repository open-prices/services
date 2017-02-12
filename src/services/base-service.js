import { readyBanner } from './common-plugins'

var port = (() => {

    if (require.main !== module) return Math.floor(Math.random() * 10000)

    if (process.argv[2]) {
        return parseInt(process.argv[2])
    }

})();

console.log(port)

var seneca = require('seneca')({
    tag: 'base',
    log: 'silent'
}).use('mesh', {
    port,
    bases : ['127.0.0.1', '30.4.59.1'],
    isbase: true
}).use(readyBanner)

export default seneca
