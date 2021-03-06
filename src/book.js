const path = require('path')
const url = require('url')
const process = require('process')
const common = require('./utils/common')
const request = require('./utils/request')
const config = require('./config')
const save = require('./save')

const loadMeta = () => {
  console.log(process.argv)
  let urlObj = url.parse(config.book.endpoint)
  let currentPath = common.computeRootPath(config.book.endpoint)
  let rootPath = urlObj.protocol + '//' + urlObj.host
  return request.get(config.book.endpoint)
    .then(data => {
      let { $ } = data
      let chapters =  $(config.book.dir_point).toArray()
          
      console.log('There are %d chapters', chapters.length)

      chapters = chapters.map((el) => {
        //TODO, AI to make this smart
        let target = $(el).attr('href')
        return target
      })
      .filter(href => {
        return href
      })
      .map((href, index) => {
        //Important
        if(href.indexOf('http') !== 0 && href.indexOf('https') !== 0){
          if (href.charAt('0') === '/') {
            href = rootPath + href
          } else {
            href = currentPath + href
          }
        }
        return {index: index, url: href, downloaded: false, filename: index + '.txt', downNum: 0}
      })

      return chapters
  })
}

const download = (chapter) => {
  chapter.downNum += 1
  let url = chapter.url
  let filepath = chapter.filepath
  console.log(chapter)
  console.log(`Try to download ${url} into ${filepath}`)
  return request.get(url)
    .then(data => {
      let { $ } = data
      let title = $(config.book.title_point).html()
      if(title){
        title.replace(/&nbsp;/ig, ' ')
      }else{
        title = `第 ${chapter.index} 章`
      }
      let article = $(config.book.article_point).html()
      if (article) {
        article = replaceHtmlTags(article)
      }

      chapter.downloaded = true
      chapter.text = '\n' + title + '\n' + article

      save.event.emit('downloaded', chapter)
      return chapter
    })
    .catch( err => {
      console.error(`Error happened while download ${url}`)
      return chapter
    })
}

const downloadChapters = (chapters, maxPerLoop) => {
  if (maxPerLoop <= 0) {
    maxPerLoop = 100
  }
  let targetChapters = chapters.filter(chapter => {
    return !chapter.downloaded
  })

  console.log('Loop Try to download maxed %d chapters', targetChapters.length)

  if (!targetChapters.length) {
    return Promise.resolve(chapters)
  }
  if (targetChapters.length >= maxPerLoop) {
    targetChapters = targetChapters.filter(chapter => {
      return chapter.downNum <= (targetChapters.length/maxPerLoop)
    })
  } 
  return Promise.all(
    targetChapters
    .slice(0, maxPerLoop)
    .map(chapter => {
      return download(chapter)
    })
  )
  .then(handledChapters => {
    console.log('Loop: Downloaded %d', handledChapters.filter(c => c.downloaded).length)
    handledChapters.forEach(c => {
      let i = chapters.findIndex(chapter => {return chapter.url === c.url})
      if (i >= 0) {
        chapters[i].downloaded = c.downloaded
        chapters[i].downNum = c.downNum
      }
    })
    return downloadChapters(chapters, maxPerLoop)
  })
}

const replaceHtmlTags = html => {
  return html.replace(/&[^;]+;/ig, ' ')
          .replace(/<div[^>]*>{1}/ig,'\n')
          .replace(/<p[^>]*>{1}/ig,'\n')
          .replace(/<br[^>]*>{1}/ig,'\n')
          .replace(/<section[^>]*>{1}/ig,'\n')
          .replace(/<article[^>]*>{1}/ig,'\n')
          .replace(/<ul[^>]*>{1}/ig,'\n')
          .replace(/<ol[^>]*>{1}/ig,'\n')
          .replace(/<li[^>]*>{1}/ig,'\n')
          .replace(/<\/[div|p|br|section|article|ul|ol|li]>/ig, '\n')
          .replace(/<[^>]+>/ig, '')
          .replace('\n\n', '\n')
}

module.exports = {
  loadMeta,
  downloadChapters,
  download
}

if(process.argv[1] === __filename){
  loadMeta().then(chapters => {
    downloadChapters(chapters, 50)
  })
}
