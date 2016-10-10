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

const dirUrl = 'http://www.biquge.info/0_770/' //目录页地址
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
let rootPath = common.computeRootPath(dirUrl)
console.log('Root path is %s', rootPath)

const download = (url, filepath, code, retry = false) => {
    if(url.indexOf('http') !== 0 && url.indexOf('https') !== 0){
        url = rootPath + url
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
            }
            let content = $(articlePoint).text()
            if(content){
                content = content.replace(/&nbsp;/ig, ' ').replace(/[<br>|<p>|<\/p>]{1}/ig,'\n').replace(/<[^>]+>/ig, '')
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
                // if(href.indexOf('http') !== 0 || href.indexOf('https') !== 0){
                //     href = rootPath + href
                // }
    			// return rp.get(href)
    			// 	.then(body => {
                //
                //         html = iconv.decode(body, code)
    			// 		let $ = cheerio.load(html, {decodeEntities: false})
    			// 		let title = $(titlePoint).html()
                //         if(title){
                //             title.replace(/&nbsp;/ig, ' ')
                //         }
    			// 		let content = $(articlePoint).text()
                //         if(content){
                //             content = content.replace(/&nbsp;/ig, ' ').replace(/[<br>|<p>|<\/p>]{1}/ig,'\n').replace(/<[^>]+>/ig, '')
                //         }
                //         let target = path.join(chaptersFolder, index + '.txt')
    			// 		return fs.writeFileAsync(target, '\n' + title + '\n' + content).then(err => {
    			// 			err ?  errors.push('Save ' + href + ' failed') : null
    			// 			return target
    			// 		})
    			// 	})
                //     .catch(err => {
                //         errors.push('Download ' + href + ' failed')
                //     })
    		})

    		return Promise.all(chapters)
    	}).then(chapters => {
            console.log(errors)
            console.log('try to merge %s chapters into single file', chapters ? chapters.length : 0)
            merge(chapters)
    	}).catch(err => {
            console.error('unexpected err happened')
            errors.push(err)
        })

})
