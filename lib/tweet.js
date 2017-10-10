const fs = require('fs'),
  https = require('https')
// twitter = require('twitter'),
// config = require('../config/config.js')

const getContent = function (url, callback) {

  const req = https.get(url, function (res) {
    const result = {}
    result['statusCode'] = res.statusCode
    result['headers'] = res.headers
    let rawData = ''

    res.on('data', function (chunk) {
      rawData += chunk
    })

    res.on('end', function () {
      result['rawData'] = rawData
      callback(null, JSON.parse(result['rawData']).data.children)
    })
  })

  req.on('error', function (err) {
    callback(err)
  })
}

const downloadImages = function (err, data) {
  if (err !== null) {
    console.error(err)
  } else {
    data.map(function (current) {
      let post = current.data,
        imageUrl = post.url,
        filename = post.id,
        title = post.title
      let fileWrite = fs.createWriteStream(`images/${filename}.jpg`)
      https.get(imageUrl, function (res) {
        res.pipe(fileWrite)
      })
      console.log(`downloaded: ${title}`)
    })
  }
}

const imageUrl = 'https://www.reddit.com/r/pics/.json?top/?sort=top&t=day&limit=4'
getContent(imageUrl, downloadImages)
