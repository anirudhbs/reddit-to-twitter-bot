const fs = require('fs'),
  https = require('https'),
  twitter = require('twitter'),
  config = require('../config/config.js'),
  client = new twitter(config.twitterKeys)

const getContent = function (url, callback) {
  https.get(url, function (res) {
    let rawData = ''
    res.on('data', function (chunk) {
      rawData += chunk
    })
    res.on('end', function () {
      let postsInfo = JSON.parse(rawData).data.children
      if (postsInfo.length === 0) console.log('No posts found!')
      else callback(null, postsInfo, downloadImages)
    })
  }).on('error', function (err) {
    callback(err)
  })
}

const createFolder = function (err, data, callback) {
  if (err !== null) console.error(err)
  else {
    let subRedditName = data[0].data.subreddit,
      subRedditDir = `./images/${subRedditName}`

    fs.access(subRedditDir, function (err) {
      if (err && err.code === 'ENOENT') {
        fs.mkdir(subRedditDir, function (err) {
          console.log('folder created: ' + subRedditName)
        })
      }
    })
    callback(null, data, postTweet)
  }
}

const downloadImages = function (err, data, callback) {
  if (err) console.error(err)
  else {
    data.filter(function (current) {
      let post = current.data,
        subreddit = post.subreddit,
        imageUrl = post.url,
        filename = post.id,
        title = post.title

      fs.access(`images/${subreddit}/${filename}.jpg`, function (err) {
        if (!err) {
          console.log('file exists: ' + printTitle(title))
          return
        } else {
          let fileWrite = fs.createWriteStream(`images/${subreddit}/${filename}.jpg`)
          https.get(imageUrl, function (res) {
            res.pipe(fileWrite)
            res.on('end', function () {
              console.log('downloaded: ' + printTitle(title))
              callback(null, filename, title, subreddit)
            })
            res.on('error', function (err) {
              callback(err)
            })
          }).on('error', function (err) {
            callback(err)
          })
        }
      })
    })
  }
}

const postTweet = function (err, filename, title, subreddit) {
  if (err) console.error(err)
  else {
    fs.readFile(`images/${subreddit}/${filename}.jpg`, function (err, data) {
      client.post('media/upload', {
        media: data
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
    })
  }
}

const printTitle = function (title) {
  return (title.length < 20) ? title : (title.slice(0, 20).trim() + '...')
}

module.exports = {
  getContent: getContent,
  createFolder: createFolder,
  downloadImages: downloadImages,
  postTweet: postTweet,
  printTitle: printTitle
}
