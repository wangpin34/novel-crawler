const EventEmitter = require('events').EventEmitter
const fs = require('fs')
const path = require('path')
const event = new EventEmitter()
const config = require('./config')

event.on('downloaded', chapter => { 
  save(chapter)
}) 

save = (chapter) => {
  fs.writeFile(path.join(config.downloadFolder, 'chapters', chapter.filename), chapter.text, err => {
    console.error(err)
  })  
}

module.exports = {
  event
}