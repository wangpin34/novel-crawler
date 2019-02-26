let rp = require('request-promise')
const cheerio = require('cheerio')
const iconv = require('iconv-lite')
const config = require('../config')

if (config.proxy && config.proxy.enabled) {
  rp = rp.defaults({proxy: `${config.proxy.protocol}://${config.proxy.host}:${config.proxy.port}`})
}

rp.defaults({strictSSL: false})

const optTemplate = {
  encoding: null,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.116 Safari/537.36'
  },
  strictSSL: false,
  transform: function (body, response) {
    if (response.statusCode == 200) {
      let contentType = response.headers['content-type']
      console.log('content type: %s', contentType)
      let reg = /charset=([\d\D]+)/ig
      let result = reg.exec(contentType)
      let encode = result ? result[1] : config.encode
      body = iconv.decode(body, encode)
      return { $: cheerio.load(body, {decodeEntities: false}) }
    }
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
  let opts = buildOptByUrl({ url, method: 'GET' })
  return rp(opts)
}

exports.perform = perform
exports.get = get
exports.buildOptByUrl = buildOptByUrl

if(process.argv[1] === __filename){
  get('https://github.com/request/request-promise')
    .then(data => {
      console.log(data.$.html())
    })
}
