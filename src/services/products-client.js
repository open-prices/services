import { readyBanner } from './common-plugins'
import { getProduct, getProducts } from './products'

var seneca = require('seneca')({
    tag: 'products-client',
    log: 'silent'
}).use('mesh').use(readyBanner).ready(function(){

    main.call(this)

})

function main(){
    var barcode = process.argv[2]
    console.log(barcode)

    var action = barcode ? getProduct(barcode) : getProducts()

    console.time('products')
    this.act(action, (err, response) => {
        console.log(JSON.stringify(response.data, null, 2))
        console.error(err)
        console.timeEnd('products')
        seneca.close()
    })
}