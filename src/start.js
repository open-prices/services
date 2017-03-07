import base from './services/base-service'
base.ready(function () {

    //require('./services/cache-service')
    require('./services/products-service')
    require('./services/vendors-service')
    require('./services/afip-service')

})
