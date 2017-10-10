const fs = require('fs'),
  https = require('https'),
  twitter = require('twitter'),
  config = require('../config/config.js'),
  client = new twitter(config.twitterKeys)

const getContent = function (url, callback) {
  const req = https.get(url, function (res) {
    const result = {}
    result['statusCode'] = res.statusCode
    let rawData = ''

    res.on('data', function (chunk) {
      rawData += chunk
    })

    res.on('end', function () {
      result['rawData'] = rawData
      callback(null, JSON.parse(result['rawData']).data.children, postTweet)
    })
  })

  req.on('error', function (err) {
    callback(err)
  })
}

const downloadImages = function (err, data, callback) {
  if (err !== null) console.error(err)
  else {
    data.map(function (current) {
      let post = current.data,
        subreddit = post.subreddit,
        imageUrl = post.url,
        filename = post.id,
        title = post.title,
        subFolder = `./images/${subreddit}`

      if (!fs.existsSync(subFolder)) fs.mkdirSync(subFolder)

      let fileExists = fs.existsSync(`images/${subreddit}/${filename}.jpg`)

      if (fileExists) {
        console.log(`file exists: ${title}`)
        return
      }

      let fileWrite = fs.createWriteStream(`images/${subreddit}/${filename}.jpg`)
      https.get(imageUrl, function (res) {
        res.pipe(fileWrite)

        res.on('end', function () {
          callback(null, filename, title, subreddit)
        })
        res.on('error', function (err) {
          callback(err)
        })
      })
      console.log(`downloaded: ${printTitle(title)}`)
    })
  }
}

const postTweet = function (err, filename, title, subreddit) {
  if (err !== null) console.error(err)
  else {
    const file = fs.readFileSync(`images/${subreddit}/${filename}.jpg`)
    client.post('media/upload', {
      media: file
    }, function (error, media, response) {
      if (!error) {
        let status = {
          status: `${title}`,
          media_ids: media.media_id_string
        }

        client.post('statuses/update', status, function (error, tweet, response) {
          if (!error)
            console.log(`tweet: https://twitter.com/${tweet.screen_name}/status/${tweet.id_str}`)
        })
      }
    })
  }
}

const printTitle = function (title) {
  return (title.length < 10) ? title : (title.slice(0, 20) + '...')
}

module.exports = {
  getContent: getContent,
  downloadImages: downloadImages,
  postTweet: postTweet,
  printTitle: printTitle
}

// export = { getContent, downloadImages, postTweet, printTitle}
