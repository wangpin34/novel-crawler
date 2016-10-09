'use strict'

const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs'))
const os = require('os')
const path = require('path')

let file = 'novel.txt'
let tmpFolder = path.join(os.homedir(), 'get-novel-tmp')
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
        return fs.readdirAsync(tmpFolder).then(files => {
            console.log(files)
            files = files.filter(name => {
                return reg.test(name)
            }).sort((a, b) => {
                let aNum = parseInt(a.substring(0, a.indexOf('.')))
                let bNum = parseInt(b.substring(0, b.indexOf('.')))
                return aNum - bNum
            }).map(name => {
                return path.join(tmpFolder, name)
            })

            return files
        }).then(files => {
            console.log(files)
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

console.log('***********************************')
if(path.basename(process.argv[1]) === 'merge.js'){
    merge()
}

exports.default = merge