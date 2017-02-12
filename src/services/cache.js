import NodeCache from 'node-cache'

import Response from './response'

export const NAME = 'CACHE/CACHE'
export const GET = 'CACHE/GET'
export const SET = 'CACHE/SET'
export const OPTIONS = 'CACHE/OPTIONS'

export const patterns = (function(){

    var patterns = {
        set: {
            service: NAME,
            type: SET
        },
        get : {
            service: NAME,
            type: GET
        },
        options : {
            service : NAME,
            type : OPTIONS
        }
    }
    return patterns

})();



(function actionCreators(exports){
    exports.get = function get(namespace, key) {
        return Object.assign({}, patterns.get, { namespace, key })
    }
    exports.set = function set(namespace, key, value) {
        return Object.assign({}, patterns.set, { namespace, key, value })
    }
    exports.options = function options(namespace, options={}){
        return Object.assign({}, patterns.options, {
            stdTTL : options.stdTTL
        })
    }
})(exports);



export default function cache(options = {}) {

    var seneca = this

    var res = Response.bind(this)

    var caches = {}

    this.add(patterns.get, (action, done) => {

        var { namespace, key } = action
        
        console.info('GET', namespace, key)

        var cache = resolveCache(namespace)

        var cached = cache.get(key)

        done(null, {
            data : cached
        })

    })
    this.add(patterns.set, (action, done) => {
        
        var { namespace, key, value } = action

        console.info('SET', namespace, key)
        
        set(namespace, key, value)

        done(null)

    })
    this.add(patterns.options, (action, done) => {

        var {
            namespace,
            stdTTL
        } = action

        if (!stdTTL) {
            return done(null, res(false))
        }

        caches[namespace] = new NodeCache({
            stdTTL
        })

        done(null, res(true))

    })

    function set(namespace, key, value){
        resolveCache(namespace)
        caches[namespace].set(key, value)
    }
    function resolveCache(namespace){
        if (caches[namespace]) {
            return caches[namespace]
        }
        caches[namespace] = new NodeCache({
            stdTTL : 60,
            checkperiod : 5
        })
        caches[namespace].on('expired', function(key, value){
            console.log('key %s expired', key)
            console.log(caches[namespace].getStats())
        })
        return caches[namespace]
    }

}



export function useCache(options = {}){

    var debug = options.log || function(){}

    var seneca = this

    if (!options.namespace) {
        var err = new Error('useCacheError')
        console.error(err)
        process.exit(-1)
    }


    var PINS = options.listen || []

    var cache = new CacheClient(seneca, options.namespace)

    PINS.map(PIN => {
        seneca.add(PIN.pin, _useCache)
    })

    function _useCache(action, done){

        var seneca = this
        
        var cache_key = JSON.stringify(seneca.util.clean(action))

        var getCached = cache.get(cache_key).catch(err => {
            debug('cache.get %s', err.name)
            return null
        })
        
        getCached.then(data => {
            
            if (data) {
                debug('hit %s', cache_key)
                return done(null, data)
            }

            seneca.prior(action, (err, response) => {

                cache.set(cache_key, response).catch(err => {
                    debug('cache.set %s', err.name)
                })

                done(err, response)

            })

        })

    }

}



export function CacheClient(seneca, namespace){
    
    if (!namespace) throw new Error('CacheClientError')

    var self = this
    this.set = (key, value) => {
        return new Promise(function(resolve, reject){
            var action = set(namespace, key, value)
            seneca.act(action, (err, response) => {
                err ? reject(err) : resolve(response)
            })
        })
    }
    this.get = (key) => {
        return new Promise(function(resolve, reject){
            var action = get(namespace, key)
            seneca.act(action, (err, response) => {
                err ? reject(err) : resolve(response.data)
            })
        })
    }
    this.options = (options) => {
        return new Promise(function(resolve, reject){
            var action = options(namespace, options)
            seneca.act(action, (err, response) => {
                err ? reject(err) : resolve(response.data)
            })
        })
    }

}