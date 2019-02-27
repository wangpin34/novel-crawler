'use strict'

const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs'))
const os = require('os')
const path = require('path')
const config = require('./config')

let file = 'novel.txt'
let tmpFolder = config.downloadFolder
let chaptersFolder = path.join(tmpFolder, 'chapters')
let targetFile = path.join(tmpFolder, file)
let reg = /^([\d]+\.txt$)/

const merge = (files) => {
    console.log('Target path is %s', tmpFolder)
    if(files){
        return new Promise((resolve, reject) => {
            files.forEach(f => {
                let content = fs.readFileSync(f)
                fs.unlink(f,() => {})
                fs.appendFileSync(targetFile, content + '\n\n')
            })
            resolve()
        })
    }else{
        return fs.readdirAsync(chaptersFolder).then(files => {
            files = files.filter(name => {
                return reg.test(name)
            }).sort((a, b) => {
                let aNum = parseInt(a.substring(0, a.indexOf('.')))
                let bNum = parseInt(b.substring(0, b.indexOf('.')))
                return aNum - bNum
            }).map(name => {
                return path.join(chaptersFolder, name)
            })

            return files
        }).then(files => {
            fs.existsSync(targetFile) && fs.unlinkSync(targetFile)
            files.forEach((file, index) => {
                let content = fs.readFileSync(file)
                fs.appendFileSync(targetFile, content + '\n\n')
                fs.unlink(file, err => {
                    if(!err) {
                        console.log('%s is deleted', file)
                    }
                })
            })
        }).catch(err => {
            console.error(err)
        })
    }
}

module.exports = {
  merge: merge
}

if(process.argv[1] === __filename){
  merge()
}


