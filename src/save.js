const EventEmitter = require('events').EventEmitter
const fs = require('fs')
const path = require('path')
const event = new EventEmitter()
const config = require('./config')

event.on('downloaded', chapter => { 
  save(chapter)
}) 

save = (chapter) => {
  let filepath = path.join(config.downloadFolder, 'chapters', chapter.filename)
  console.log(`Try to save in ${filepath}`)
  console.log(chapter.text)
  fs.writeFile(filepath, chapter.text, err => {
    console.error(err)
  })  
}

module.exports = {
  event
}