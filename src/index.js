'use strict'

const http = require('http')
const iconv = require('iconv-lite')
const cheerio = require('cheerio')
let fs = require('fs')
const Promise = require('bluebird')
fs = Promise.promisifyAll(fs)
const os = require('os')
const path = require('path')
const url = require('url')

const common = require('./utils/common')
const rp = require('./utils/request')
const merge = require('./merge')

const dirUrl = 'http://www.biquge.tw/35_35382/' //目录页地址
const dirPoint = 'div#list dl dd a' //选择一章
const titlePoint = 'div.bookname h1' //章内的标题
const articlePoint = 'div#content' //章内的内容

let file = 'novel.txt'
let tmpFolder = path.join(os.homedir(), 'get-novel-tmp')
let chaptersFolder = path.join(tmpFolder, 'chapters')

common.mkDirIfNonexists(tmpFolder).then(() => {
    common.mkDirIfNonexists(chaptersFolder)
}).catch(err => {
    console.log(err)
    process.exit()
})

let errors = []
let urlObj = url.parse(dirUrl)
let currentPath = common.computeRootPath(dirUrl)
let rootPath = urlObj.protocol + '//' + urlObj.host
console.log('Current path is %s', currentPath)

const download = (url, filepath, code, retry = false) => {
    if(url.indexOf('http') !== 0 && url.indexOf('https') !== 0){
        if(url.charAt('0') === '/'){
            url = rootPath + url
        }else{
            url = currentPath + url
        }
    }
    if(retry){
        console.log('Retry download %s', url)
    }
    return rp.get(url)
        .then(body => {
            let html = iconv.decode(body, code)
            let $ = cheerio.load(html, {decodeEntities: false})
            let title = $(titlePoint).html()
            if(title){
                title.replace(/&nbsp;/ig, ' ')
                let titleReg = /^([0]+)([\d]+)\s+([\d\D]+$)/
                let result = titleReg.exec(title)
                if(result){
                    if(result[2]){
                        title = '第 ' + result[2] + ' 章 ' + result[3]
                    }else{
                        title = '第 ' + 0 + ' 章 ' + result[3]
                    }
                }
            }
            let content = $(articlePoint).text()
            if(content){
                content = content.replace(/&[^;]+;/ig, ' ').replace(/[<br>|<p>|<\/p>]{1}/ig,'\n').replace(/<[^>]+>/ig, '')
            }
            return fs.writeFileAsync(filepath, '\n' + title + '\n' + content).then(err => {
                err ?  errors.push('Save ' + url + ' failed') : null
                return filepath
            })
        })
        .catch(err => {
            errors.push('Download ' + url + ' failed')
            console.warn(err)
            download(url, filepath, code, true)
        })
}

common.getCodeOfPage(dirUrl).then(code => {
    console.log('Target url charset is %s', code)
    rp.get(dirUrl)
    	.then(html => {
            html = iconv.decode(html, code)
            fs.writeFile('index.html', html)
    		let $ = cheerio.load(html, {decodeEntities: false})
            let chapters =  $(dirPoint).toArray()
            console.log('There are %s chapters', chapters.length)
    		chapters = chapters.map((el) => {
    			return $(el).attr('href')
    		}).filter(href => {
    			return href !== ''
    		}).map((url,index) => {
                return download(url, path.join(chaptersFolder, index + '.txt'), code)
    		})

    		return Promise.all(chapters)
    	}).then(chapters => {
            console.log(errors)
            console.log('try to merge %s chapters into single file', chapters ? chapters.length : 0)
            merge(chapters)
    	}).catch(err => {
            errors.push(err)
            console.log(errors)
        })

})
