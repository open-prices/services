var seneca = require('seneca')({
    tag: 'members',
    log: 'silent'
}).use('mesh').ready(() => {

    seneca.act({
        role: 'mesh',
        get: 'members'
    }, (err, response) => {

        var services = response.list

        services.map(service => {
            console.log(service)
        })

        seneca.close()

    })

})
