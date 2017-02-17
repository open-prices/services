var express = require('express')
var router = express.Router()

var sequelize = require('../../sequelize').default

var Products = require('../../services/products')

var seneca = require('../seneca-client')


router.get('/services', (req, res, next) => {
    
    seneca.act({
        role: 'mesh',
        get: 'members'
    }, (err, response) => {
        if (err) return next(err)

        var { list } = response

        res.json({
            services: list.map(member => member.instance).filter((str, i, arr) => arr.indexOf(str) == i).sort(),
            patterns: list.map(service => service.pin).map(pattern => seneca.util.pattern(pattern)).sort(),
            list,
        })
    })

})
router.get('/services/cache', (req, res, next) => {

    seneca.act({
        SERVICE: 'CACHE',
        TYPE: 'STATS'
    }, function (err, response) {
        if (err) return next(err)
        res.json(response.data)
    })

})
router.get('/services/:service', (req, res, next) => {

    var { service } = req.params

    seneca.act({
        service: service.toUpperCase()
    }, (err, response) => {
        if (err) return next(err)
        res.json(response)
    })

})


module.exports = router
