const fs = require('fs'),
  https = require('https'),
  twitter = require('twitter'),
  config = require('../config/config.js'),
  client = new twitter(config.twitterKeys)

const getContent = function (url, callback) {
  const req = https.get(url, function (res) {
    let rawData = ''

    res.on('data', function (chunk) {
      rawData += chunk
    })
    res.on('end', function () {
      callback(null, JSON.parse(rawData).data.children, postTweet)
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

      if (!fs.existsSync(subFolder)) fs.mkdir(subFolder, function (err) {
        if (err !== null) console.error(err)
        else console.log('folder created: ' + subreddit)
      })

      let fileExists = fs.existsSync(`images/${subreddit}/${filename}.jpg`)
      if (fileExists) {
        console.log('file exists: ' + printTitle(title))
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
      console.log('downloaded: ' + printTitle(title))
    })
  }return
}

const postTweet = function (err, filename, title, subreddit) {
  if (err) console.error(err)
  else {
    const file = fs.readFileSync(`images/${subreddit}/${filename}.jpg`)
    client.post('media/upload', {
      media: file
    }, function (err, media, response) {
      if (!err) {
        let status = {
          status: title,
          media_ids: media.media_id_string
        }
        client.post('statuses/update', status, function (err, tweet, response) {
          if (err) console.error(err)
          else
            console.log(`tweet: https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`)
        })
      }
    })
  }return
}

const printTitle = function (title) {
  return (title.length < 24) ? title : (title.slice(0, 24).trim() + '...')
}

module.exports = {
  getContent: getContent,
  downloadImages: downloadImages,
  postTweet: postTweet,
  printTitle: printTitle
}
