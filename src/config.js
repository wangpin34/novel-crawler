yaml = require('js-yaml')
fs = require('fs')
path = require('path')
os = require('os')
pkg = require('../package.json')
common = require('./utils/common')

try {
  let doc = yaml.safeLoad(fs.readFileSync(path.join(__dirname, '../_config.yml'), 'utf8'))
  doc.downloadFolder = path.join(os.homedir(), pkg.name)
  common.mkDirIfNonexists(doc.downloadFolder)
    .then(() => {
      common.mkDirIfNonexists(path.join(doc.downloadFolder, 'chapters'))
    })
    .catch(err => {
      console.error('error happened')
      console.error(err)
    })
  module.exports = doc
} catch (e) {
  console.log('!!!!!!!!!!!!!')
  console.error(e)
  module.exports = {}
}


