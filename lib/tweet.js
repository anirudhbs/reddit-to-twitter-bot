const fs = require('fs'),
  https = require('https'),
  twitter = require('twitter'),
  config = require('../config/config.js'),
  client = new twitter(config.twitterKeys),
  Reddit = config.reddit

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
        imageUrl = post.url,
        filename = post.id,
        title = post.title

      let fileWrite = fs.createWriteStream(`images/${filename}.jpg`)
      https.get(imageUrl, function (res) {
        res.pipe(fileWrite)

        res.on('end', function () {
          callback(null, filename, title)
        })
        res.on('error', function (err) {
          callback(err)
        })
      })
      console.log(`downloaded: ${title}`)
    })
  }
}

const postTweet = function (err, filename, title) {
  if (err !== null) console.error(err)
  else {
    const file = fs.readFileSync(`images/${filename}.jpg`)
    client.post('media/upload', {
      media: file
    }, function (error, media, response) {
      if (!error) {
        let status = {
          status: `${title}`,
          media_ids: media.media_id_string
        }

        client.post('statuses/update', status, function (error, tweet, response) {
          if (!error) {
            console.log(`tweet: https://twitter.com/${tweet.screen_name}/status/${tweet.id_str}`)
          }
        })
      }
    })
  }
}

const imageUrl = `https://www.reddit.com/r/${Reddit.subreddit}/top/.json?sort=top&t=day&limit=${Reddit.limit}`
getContent(imageUrl, downloadImages)
