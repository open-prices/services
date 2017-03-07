import Response from './response'
import sequelize from '../sequelize'

var { Product, ProductName, Price } = sequelize.models

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

            var prices = response.data.filter(p => {
                var week_ago = new Date(new Date() - (1000 * 60 * 60 * 24 * 7 * 2))
                return week_ago < p.date
            }).map(p => p.price)

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

        var { barcode, name } = product

        Product.findOrCreate({
            where: { barcode }
        }).then(([product, created]) => {

            var p = product.get()
            done(null, res(p))

            return ProductName.create({
                name,
                ProductId: product.id,
                UserId: 1
            })

        }).catch(err => {
            done(err)
        })

    }

    this.add({
        SERVICE: NAME,
        TYPE: 'PRODUCT_NAME'
    }, function onCalculateProductName(action, done) {

        var { id, barcode } = action

        var sql_commonName = 'SELECT p.id, pn.name, COUNT(1) as c FROM "ProductNames" as pn JOIN "Products" as p ON pn."ProductId"=p.id WHERE p.id=:id GROUP BY p.id, pn.name ORDER BY c DESC'
        if (!id) {
            sql_commonName = 'SELECT p.id, pn.name, COUNT(1) as c FROM "ProductNames" as pn JOIN "Products" as p ON pn."ProductId"=p.id WHERE p.barcode=:barcode GROUP BY p.id, pn.name ORDER BY c DESC'
        }

        sequelize.query(sql_commonName, {
            replacements: {
                barcode
            }
        }).then(([rs, meta]) => rs[0]).then(rs => {
            if (!rs) {
                return done(null, res(null))
            }
            done(null, res(rs.name))

            var sql = 'UPDATE "Products" SET name=:name WHERE id=:id'
            return sequelize.query(sql, {
                replacements: {
                    id: rs.id,
                    name: rs.name
                }
            }).catch(err => {
                console.log(err)
            })


        })

    })

}