var express = require('express')
var router = express.Router()

var sequelize = require('../../sequelize').default

var Products = require('../../services/products')
var Vendors = require('../../services/vendors')

var seneca = require('../seneca-client')

router.get('/products', (req, res, next) => {

    var action = Products.getProducts()
    action.includeAll = !!req.query.includeAll

    seneca.act(action, (err, response) => {
        if (err) return next(err)

        var { data } = response
        delete response.data

        res.json({
            response,
            //data: data.map(product => product.barcode),
            data
        })
    })

})

router.get('/products/:barcode', (req, res, next) => {

    var action = Products.getProduct(req.params.barcode)

    seneca.act(action, (err, response) => {
        if (err) return next(err)

        var { data } = response
        delete response.data

        res.json({
            response,
            data
        })
    })

})

router.get('/products/:barcode/prices', (req, res, next) => {

    var action = Products.getProductAveragePrice(req.params.barcode)
    console.log(action)

    seneca.act(action, (err, response) => {
        if (err) return next(err)
        res.json(response)
    })

})

router.get('/vendors', (req, res, next) => {

    var action = Vendors.getVendors()
    seneca.act(action, function (err, response) {

        if (err) return next(err)

        var { data } = response
        delete response.data

        res.json({
            response,
            data
        })

    })

})

module.exports = router
