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

export const patterns = (function () {

    var patterns = {
        getProduct: {
            service: NAME,
            type: GET
        },
        getProducts: {
            service: NAME,
            type: ALL
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

})(exports);

export default function products(options = {}) {

    var seneca = this

    var res = Response.bind(this)

    this.add(patterns.getProduct, onGetProduct)

    function onGetProduct(action, done) {

        console.log(patterns.getProduct)

        var { barcode } = action

        if (!barcode) {
            return done(new Error('Barcode missing.'))
        }

        Product.findOne({
            where: { barcode },
            include: [{ all: true }]
        }).then(product => {
            var p = product.get()
            done(null, res(p))
        }).catch(err => console.error(err))

    }

    this.add(patterns.getProducts, function onGetProducts(action, done) {

        console.log(patterns.getProducts)

        Product.all({
            include: [{ all: true }]
        }).then(products => {
            var ps = products.map(p => p.get())
            done(null, res(ps))
        })

    })

}