import NodeCache from 'node-cache'

import Response from './response'

export const NAME = 'CACHE'
export const GET = 'GET'
export const SET = 'SET'
export const OPTIONS = 'OPTIONS'
export const STATS = 'STATS'

export const patterns = (function () {

    var patterns = {
        echo: {},
        set: {
            TYPE: SET
        },
        get: {
            TYPE: GET
        },
        options: {
            TYPE: OPTIONS
        },
        stats: {
            TYPE: STATS
        }
    }
    Object.keys(patterns).map(name => {
        Object.assign(patterns[name], { SERVICE: NAME })
    })
    return patterns

})();



var actions = {
    get(namespace, key) {
        return Object.assign({}, patterns.get, { namespace, key })
    },
    set(namespace, key, value) {
        return Object.assign({}, patterns.set, { namespace, key, value })
    },
    options(namespace, options = {}) {
        return Object.assign({}, patterns.options, {
            stdTTL: options.stdTTL
        })
    },
    stats(namespace) {
        return Object.assign({}, patterns.stats, {
            namespace
        })
    }
}
Object.assign(exports, actions)


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
            data: cached
        })

    })
    this.add(patterns.set, (action, done) => {

        var { namespace, key, value } = action

        console.info('SET', namespace, key)

        set(namespace, key, value)

        done(null)

    })
    this.add(patterns.options, (action, done) => {

        console.info('OPTIONS', namespace)

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
    this.add(patterns.stats, function onStats(action, done) {

        console.info('STATS', STATS)

        var stats = Object.keys(caches).map(namespace => {
            return {
                [namespace]: {
                    stats: caches[namespace].getStats(),
                    keys: caches[namespace].keys().sort()
                }
            }
        }).reduce((e1, e2) => Object.assign(e1, e2), {})

        done(null, res(stats))

    })

    function set(namespace, key, value) {
        resolveCache(namespace)
        caches[namespace].set(key, value)
    }
    function resolveCache(namespace) {
        if (caches[namespace]) {
            return caches[namespace]
        }
        caches[namespace] = new NodeCache({
            stdTTL: 60,
            checkperiod: 5
        })
        caches[namespace].on('expired', function (key, value) {
            console.log('key %s expired', key)
            console.log(caches[namespace].getStats())
        })
        return caches[namespace]
    }

}



export function useCache(options = {}) {

    var debug = options.log || function () { }

    var seneca = this

    if (!options.namespace) {
        var err = new Error('useCacheError', 'No namespace.')
        console.error(err)
    }


    var PINS = options.listen || []

    var cache = new CacheClient(seneca, options.namespace)

    PINS.map(PIN => {
        seneca.add(PIN.pin, _useCache)
    })

    function _useCache(action, done) {

        var seneca = this

        var cache_key = seneca.util.pattern(seneca.util.clean(action))

        if (typeof action.useCache !== 'undefined' && !action.useCache) {
            return seneca.prior(action, function(err, response){
                cache.set(cache_key, response).catch(err => {
                    debug('cache.set %s', err.name)
                })
                done(err, response)
            })
        }

        var getCached = cache.get(cache_key).catch(err => {
            debug('cache.get %s', err.name)
            return null
        })

        getCached.then(data => {

            if (data) {
                debug('hit %s', cache_key)
                data.cache = true
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

    seneca.add({
        init: 'useCache'
    }, function (action, done) {
        done()
    })

    return 'useCache'

}



export function CacheClient(seneca, namespace) {

    if (!namespace) throw new Error('CacheClientError')

    var self = this
    this.set = (key, value) => {
        return new Promise(function (resolve, reject) {
            var action = exports.set(namespace, key, value)
            seneca.act(action, (err, response) => {
                err ? reject(err) : resolve(response)
            })
        })
    }
    this.get = (key) => {
        return new Promise(function (resolve, reject) {
            var action = exports.get(namespace, key)
            seneca.act(action, (err, response) => {
                err ? reject(err) : resolve(response.data)
            })
        })
    }
    this.options = (options) => {
        return new Promise(function (resolve, reject) {
            var action = exports.options(namespace, options)
            seneca.act(action, (err, response) => {
                err ? reject(err) : resolve(response)
            })
        })
    }

}