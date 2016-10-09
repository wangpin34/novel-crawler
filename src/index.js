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

fs.exists(tmpFolder, exists => {
	exists ||
	fs.mkdir(tmpFolder, err => {
		if(err) throw err
		console.log('folder tmp created')
	})
})


let urlObj = url.parse(dirUrl)
let rootPath = dirUrl
if(common.isNodePath(dirUrl)){
    rootPath = path.dirname(dirUrl)
}

common.getCodeOfPage(dirUrl).then(code => {
    console.log('Target url charset is %s', code)

    rp.get(dirUrl)
    	.then(html => {
            html = iconv.decode(html, code)
            fs.writeFile('index.html', html)
    		let $ = cheerio.load(html, {decodeEntities: false})

    		let chapters = $(dirPoint).toArray().map((el) => {
    			return $(el).attr('href')
    		}).filter(href => {
    			return href !== ''
    		}).map((href,index) => {
                if(href.indexOf('http') !== 0 || href.indexOf('https') !== 0){
                    href = rootPath + '/' + href
                }
                console.log('Try to fetch content from %s', href)
    			return rp.get(href)
    				.then(body => {
                        console.log('Fetched content from %s', href)
                        html = iconv.decode(body, code)
    					let $ = cheerio.load(html, {decodeEntities: false})
    					let title = $(titlePoint).html()
                        if(title){
                            title.replace(/&nbsp;/ig, ' ')
                        }
    					let content = $(articlePoint).text()
                        if(content){
                            content = content.replace(/&nbsp;/ig, ' ').replace(/[<br>|<p>|<\/p>]{1}/ig,'\n').replace(/<[^>]+>/ig, '')
                        }
    					return fs.writeFileAsync(path.join(tmpFolder, index + '.txt'), '\n' + title + '\n' + content).then(err => {
    						err ?  console.error('chatper ' + index + 'download failed.') :
    						console.info('chatper ' + index + 'download succeed.')
    						return path.join(tmpFolder, index + '.txt')
    					})
    				})
    		})

    		return Promise.all(chapters)
    	}).then(chapters => {
            console.log('try to merge %s chapters into single file', chapters ? chapters.length : 0)
            merge(chapters.map(c => {
                return path.join(tmpFolder, c)
            }))
    	}).catch(err => {
            console.error('err happened')
            console.error(err)
        })

})
