import Response from './response'
import sequelize from '../sequelize'

var { Vendor } = sequelize.models

export const NAME = 'VENDORS'
export const GET = 'GET'
export const ALL = 'ALL'
export const CREATE = 'CREATE'

export const patterns = (function () {
    
    var patterns = {
        echo: {},
        getVendor: {
            TYPE: GET
        },
        getVendors: {
            TYPE: ALL
        },
        createVendor: {
            TYPE: CREATE
        }
    }
    Object.keys(patterns).map(name => {
        Object.assign(patterns[name], { SERVICE: NAME })
    })

    return patterns

})();

var actions = {
    getVendor(code) {
        return Object.assign({}, patterns.getVendor, { code })
    },
    getVendors() {
        return Object.assign({}, patterns.getVendors)
    },
    createVendor(vendor = {}) {
        return Object.assign({}, patterns.createVendor, {
            vendor
        })
    }
}
Object.assign(exports, actions)

export default function vendors(options = {}) {

    var seneca = this

    var res = Response.bind(this)

    this.add(patterns.getVendor, function onGetVendor(action, done) {

        console.info(patterns.getVendor)

        var { code } = action

        Vendor.findOne({
            where: { code },
            include: [{ all: true }]
        }).then(vendor => {
            var json = vendor.get()
            done(null, res(json))
        }).catch(err => {
            done(err)
        })

    })
    this.add(patterns.getVendor, function validation(action, done) {
        if (!action.code) {
            return done(new Error('Vendor code missing.'))
        }
        this.prior(action, done)
    })

    this.add(patterns.getVendors, function onGetVendors(action, done) {

        console.info(patterns.getVendors)

        Vendor.all({
            include: action.includeAll ? [{ all: true }] : null
        }).then(vendors => {
            var jsons = vendors.map(model => model.get())
            done(null, res(jsons))
        }).catch(err => {
            done(err)
        })

    })


    this.add(patterns.createVendor, onCreateVendor)
    this.add(patterns.createVendor, function validate(action, done) {
        this.prior(action, done)
    })
    function onCreateVendor(action, done) {

        console.info(patterns.createVendor)

        var { vendor } = action

        var { code } = vendor

        Vendor.create({
            code
        }).then(vendor => {
            var json = vendor.get()
            done(null, res(json))
        }).catch(err => {
            done(err)
        })

    }

}