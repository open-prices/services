import Response from './response'
import sequelize from '../sequelize'

var { Product, Price } = sequelize.models

export const NAME = 'PRODUCTS'
export const GET = 'GET'
export const ALL = 'ALL'
export const CREATE = 'CREATE'

export const patterns = (function () {

    var patterns = {
        echo: {},
        getProduct: {
            TYPE: GET
        },
        getProducts: {
            TYPE: ALL
        },
        getProductPrices: {
            TYPE: 'PRICES'
        },
        createProduct: {
            TYPE: CREATE
        }
    }
    patterns.getProductAveragePrice = Object.assign({}, patterns.getProductPrices, { average: true })
    Object.keys(patterns).map(name => {
        Object.assign(patterns[name], { SERVICE: NAME })
    })

    return patterns

})();

var actions = {
    getProduct(barcode) {
        return Object.assign({}, patterns.getProduct, { barcode })
    },
    getProductPrices(barcode) {
        return Object.assign({}, patterns.getProductPrices, { barcode })
    },
    getProductAveragePrice(barcode) {
        return Object.assign({}, patterns.getProductAveragePrice, { barcode })
    },
    getProducts() {
        return Object.assign({}, patterns.getProducts)
    },
    createProduct(product = {}) {
        return Object.assign({}, patterns.createProduct, {
            product
        })
    }
}
Object.assign(exports, actions)

var middleware = {
    barcodeRequired: function barcodeRequired(action, done) {
        if (!action.barcode) {
            return done(new Error('Barcode missing.'))
        }
        this.prior(action, done)
    }
}

export default function products(options = {}) {

    var seneca = this

    var res = Response.bind(this)

    this.add(patterns.getProduct, onGetProduct)
    this.add(patterns.getProduct, middleware.barcodeRequired)
    function onGetProduct(action, done) {

        console.log(patterns.getProduct)

        var { barcode } = action

        Product.findOne({
            where: { barcode },
            include: [{ all: true }]
        }).then(product => {
            var p = product.get()
            done(null, res(p))
        }).catch(err => {
            done(err)
        })

    }

    this.add(patterns.getProductPrices, onGetProductPrices)
    this.add(patterns.getProductPrices, middleware.barcodeRequired)
    function onGetProductPrices(action, done) {

        var { barcode } = action

        Price.all({
            include: [{
                model: Product,
                where: {
                    barcode
                }
            }]
        }).then(prices => {
            var jsons = prices.map(p => p.get())
            done(null, res(jsons))
        }).catch(err => {
            done(err)
        })

    }
    this.add(patterns.getProductAveragePrice, function onGetProductAveragePrice(action, done) {

        var { barcode } = action

        var new_action = seneca.util.clean(action)
        delete new_action.average

        seneca.act(new_action, function (err, response) {

            if (err) return done(err)
            if (!response.data.length) return done(null, res(null))

            var prices = response.data.map(p => p.price)

            var avg = prices.reduce((a, b) => (a + b) / 2)

            done(null, res(avg, { action, prices }))

        })

    })

    this.add(patterns.getProducts, onGetProducts)
    function onGetProducts(action, done) {

        console.log(patterns.getProducts)

        Product.all({
            include: action.includeAll ? [{ all: true }] : null
        }).then(products => {
            var ps = products.map(p => p.get())
            done(null, res(ps))
        }).catch(err => {
            done(err)
        })

    }

    this.add(patterns.createProduct, onCreateProduct)
    this.add(patterns.createProduct, function validate(action, done) {
        this.prior(action, done)
    })
    function onCreateProduct(action, done) {

        console.log(patterns.createProduct)

        var { product } = action

        var { barcode } = product

        Product.create({
            barcode
        }).then(product => {
            var p = product.get()
            done(null, res(p))
        }).catch(err => {
            done(err)
        })

    }

}