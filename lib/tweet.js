const fs = require('fs'),
  https = require('https'),
  twitter = require('twitter'),
  config = require('../config/config.js'),
  client = new twitter(config.twitterKeys),
  Reddit = config.reddit

const downloadAndTweet = function () {
  let subreddits = Reddit.subreddit.join('+'),
    redditUrl = `https://www.reddit.com/r/${subreddits}/rising/.json?limit=${Reddit.limit}`
  getContent(redditUrl, filterContent)
}

const getContent = function (url, callback) {
  https.get(url, function (res) {
    let rawData = ''
    res.on('data', function (chunk) {
      rawData += chunk
    })
    res.on('end', function () {
      let postsInfo = JSON.parse(rawData).data.children
      if (postsInfo.length > 0) callback(null, postsInfo)
      else console.log('No content fetched!')
    })
  }).on('error', function (err) {
    callback(err)
  })
}

const filterContent = function (err, data) {
  if (err) console.error(err)
  data = data.filter(function (currentPost) {
    if (currentPost.data.url.endsWith('.jpg') || currentPost.data.url.endsWith('.png')) return currentPost
  })
  if (data.length === 0) createFolders('No posts found!')
  else createFolders(null, data, downloadImages)
}

const createFolders = function (err, data, callback) {
  if (err) console.error(err)
  else {
    Reddit.subreddit.map(function (currentSub) {
      let subRedditDir = `./images/${currentSub}`
      fs.access(subRedditDir, function (err) {
        if (err) {
          fs.mkdir(subRedditDir, function (err) {
            if (err) callback(err)
            else console.log('Folder created: ' + currentSub)
          })
        }
      })
    })
  }
  callback(null, data, postTweet)
}

const downloadImages = function (err, data, callback) {
  if (err) console.error(err)
  else {
    data.filter(function (current) {
      let post = current.data,
        subreddit = post.subreddit,
        imageUrl = post.url,
        title = post.title,
        fileExt
      if (imageUrl.endsWith('jpg')) fileExt = '.jpg'
      if (imageUrl.endsWith('png')) fileExt = '.png'

      let filename = post.id + fileExt
      fs.access(`images/${subreddit}/${filename}`, function (err) {
        if (!err) {
          console.log('File exists: ' + addEllipsis(title, 30))
          return
        } else {
          let fileWrite = fs.createWriteStream(`images/${subreddit}/${filename}`)
          https.get(imageUrl, function (res) {
            res.pipe(fileWrite)
            res.on('end', function () {
              console.log('Downloaded: ' + addEllipsis(title, 30))
              callback(null, filename, title, subreddit, postLink)
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

const postTweet = function (err, filename, title, subreddit, callback) {
  if (err) console.error(err)
  else {
    fs.readFile(`images/${subreddit}/${filename}`, function (err, data) {
      client.post('media/upload', {
        media: data
      }, function (err, media, response) {
        if (!err) {
          let status = {
            status: addEllipsis(title, 127),
            media_ids: media.media_id_string
          }
          client.post('statuses/update', status, function (err, tweet, response) {
            if (err) callback(err)
            else callback(null, tweet.user.screen_name, tweet.id_str)
          })
        }
      })
    })
  }
}
const postLink = function (err, username, tweetID) {
  if (err) console.error(err)
  else console.log(`Tweet: https://twitter.com/${username}/status/${tweetID}`)
}

const addEllipsis = function (title, size) {
  let lastSpace = title.slice(0, size - 3).lastIndexOf(' ')
  return (title.length < size) ? title : (title.slice(0, lastSpace) + '...')
}

module.exports = {
  run: downloadAndTweet,
  getContent: getContent,
  filterContent: filterContent,
  createFolders: createFolders,
  downloadImages: downloadImages,
  postTweet: postTweet,
  addEllipsis: addEllipsis,
  postLink: postLink
}
