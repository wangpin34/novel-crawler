const path = require('path')
const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs'))

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
  console.log(`Try to check dir ${dir}`)
  return fs.accessAsync(dir, fs.constants.F_OK)
  .catch(err => {
    return fs.mkdirAsync(dir)
  })
}

exports.isNodePath = isNodePath
exports.computeRootPath = computeRootPath
exports.mkDirIfNonexists = mkDirIfNonexists

if(process.argv[1] === __filename){
  mkDirIfNonexists(path.join(__dirname, 'tmp'))
}
