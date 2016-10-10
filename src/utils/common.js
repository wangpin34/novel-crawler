const cheerio = require('cheerio')
const rp = require('./request')
const path = require('path')
const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs'))


const getCode = html => {
    const defaultCode = 'utf-8'
    let $ = cheerio.load(html, {decodeEntities: false})
    let content = $('meta[http-equiv=Content-Type]').content
    let reg = /charset=([\d\D]+)/ig
    let result = reg.exec(content)
    if(result!==null){
        return result[1]
    }else{
        return defaultCode
    }
}


const getCodeOfPage = url => {
    return new Promise((resolve, reject) => {
        rp.get(url)
                .on('response', response => {
                    let contentType = response.headers['content-type']
                    console.log('content type: %s', contentType)
                    let reg = /charset=([\d\D]+)/ig
                    let result = reg.exec(contentType)
                    if(result!==null){
                        resolve(result[1])
                    }else{
                        resolve('gbk')
                    }
                })
    })
}

const isNodePath = path => {
    let exts = ['.jsp', '.asp', '.php', '.html']
    let reg = /\.([\d\D]+)/
    let result = reg.exec(path)
    if(result && exts.indexOf(result[1])>-1){
        return true
    }
    return false
}

const computeRootPath = indexPath => {
    let rootPath = indexPath
    if(isNodePath(indexPath)){
        rootPath = path.dirname(indexPath)
    }
    if(rootPath.charAt(rootPath.length - 1) !== '/'){
        rootPath = rootPath + '/'
    }
    return rootPath
}

const mkDirIfNonexists = dir => {
    return fs.statAsync(dir).then(exists => {
        if(exists){
            return new Promise((resolve,reject) => { resolve(true)})
        }
        return fs.mkdirAsync(dir).then(err => {
            if(err) throw err
    		console.log('%s is created', dir)
            return
    	})
    })
}

exports.getCode = getCode
exports.getCodeOfPage = getCodeOfPage
exports.isNodePath = isNodePath
exports.computeRootPath = computeRootPath
exports.mkDirIfNonexists = mkDirIfNonexists
