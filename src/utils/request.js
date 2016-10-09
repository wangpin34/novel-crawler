let rp = require('request-promise')
const config = require('../../config.json')

const enableProxy = config.enableProxy
const proxy = config.proxy

if(enableProxy){
    console.log('Set proxy for all request\nProxy: %s', proxy)
    rp = rp.defaults({proxy: proxy})
}

const optTemplate = {
    encoding: null,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.116 Safari/537.36'
    }
}

const buildOptByUrl = ({url, method = 'GET', options = null}) => {
    return Object.assign(optTemplate, {url, method})
}

const perform = ({url, method = 'GET', options = null}) => {
    let opts = buildOptByUrl({url, method, options})
    return rp(opts)
}

const get = url => {
    let opts = buildOptByUrl({ url })
    return rp(opts)
}

exports.perform = perform
exports.get = get
exports.buildOptByUrl = buildOptByUrl
