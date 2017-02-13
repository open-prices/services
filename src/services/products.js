import NodeCache from 'node-cache'

import Response from './response'
import sequelize from '../sequelize'
var {
    Product,
    Price
} = sequelize.models

export const NAME = 'PRODUCTS/PRODUCTS'
export const GET = 'PRODUCTS/GET'
export const ALL = 'PRODUCTS/GET_ALL'
export const CREATE = 'PRODUCTS/CREATE'

export const patterns = (function () {

    var patterns = {
        echo: {
            service: NAME
        },
        getProduct: {
            service: NAME,
            type: GET
        },
        getProducts: {
            service: NAME,
            type: ALL
        },
        createProduct: {
            service: NAME,
            type: CREATE
        }
    }
    //patterns.getProductById = Object.assign({}, patterns.getProduct, { byId: true })

    return patterns

})();

(function actionCreators(exports) {

    exports.getProduct = function getProduct(barcode) {
        return Object.assign({}, patterns.getProduct, { barcode })
    }

    exports.getProducts = function getProducts() {
        return Object.assign({}, patterns.getProducts)
    }
    exports.createProduct = function createProduct(product = {}) {
        return Object.assign({}, patterns.createProduct, {
            product
        })
    }

})(exports);

export default function products(options = {}) {

    var seneca = this

    var res = Response.bind(this)

    this.add(patterns.getProduct, onGetProduct)
    this.add(patterns.getProduct, function validation(action, done) {
        if (!action.barcode) {
            return done(new Error('Barcode missing.'))
        }
        this.prior(action, done)
    })
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

    this.add(patterns.getProducts, onGetProducts)
    function onGetProducts(action, done) {

        console.log(patterns.getProducts)

        Product.all({
            include: [{ all: true }]
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