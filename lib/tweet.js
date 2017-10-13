const fs = require('fs'),
  https = require('https'),
  twitter = require('twitter'),
  config = require('../config/config.json'),
  client = new twitter(config.twitterKeys),
  Reddit = config.reddit

const downloadAndTweet = function () {
  let subreddits = Reddit.subreddit.join('+'),
    redditUrl = `https://www.reddit.com/r/${subreddits}/rising/.json?limit=${Reddit.limit}`
  getContent(redditUrl, filterContent)
}

const getContent = function (url, callback) {
  https.get(url, (res) => {
    let rawData = ''
    res.on('data', (chunk) => {
      rawData += chunk
    })
    res.on('end', () => {
      let postsInfo = JSON.parse(rawData).data.children
      if (postsInfo.length === 0) callback('No content fetched!')
      else callback(null, postsInfo)
    })
  }).on('error', (err) => {
    callback(err)
  })
}

const filterContent = function (err, data) {
  if (err) console.error(err)
  else {
    data = data.filter((currentPost) => {
      if (currentPost.data.url.endsWith('.jpg') || currentPost.data.url.endsWith('.png')) return currentPost
    })
    if (data.length === 0) createFolders('No posts found!')
    else createFolders(null, data, downloadImages)
  }
}

const createFolders = function (err, data, callback) {
  if (err) console.error(err)
  else {
    Reddit.subreddit.map((currentSub) => {
      let subRedditDir = `./images/${currentSub}`
      fs.access(subRedditDir, (err) => {
        if (err) {
          fs.mkdir(subRedditDir, (err) => {
            if (err) callback(err)
            else console.log('Folder created: ' + currentSub)
          })
        }
      })
    })
    callback(null, data, postTweet)
  }
}

const downloadImages = function (err, data, callback) {
  if (err) console.error(err)
  else {
    data.filter((current) => {
      let post = current.data,
        subreddit = post.subreddit,
        imageUrl = post.url,
        filename = post.id,
        title = post.title

      if (imageUrl.endsWith('jpg')) filename += '.jpg'
      if (imageUrl.endsWith('png')) filename += '.png'

      fs.access(`images/${subreddit}/${filename}`, (err) => {
        if (!err) {
          console.log('File exists: ' + addEllipsis(title, 30))
          return
        } else {
          let fileWrite = fs.createWriteStream(`images/${subreddit}/${filename}`)
          https.get(imageUrl, (res) => {
            res.pipe(fileWrite)
            res.on('end', () => {
              console.log('Downloaded: ' + addEllipsis(title, 30))
              // callback(null, filename, title, subreddit, postLink)
            })
            res.on('error', (err) => {
              callback(err)
            })
          }).on('error', (err) => {
            callback(err)
          })
          fileWrite.on('close', () => {
            fs.stat(`images/${subreddit}/${filename}`, (err, data) => {
              console.log(data.size)
              if (data.size < 5242880) callback(null, filename, title, subreddit, postLink)
              else callback('File too large!')
            })
          })
        }
      })
    })
  }
}

const postTweet = function (err, filename, title, subreddit, callback) {
  if (err) console.error(err)
  else {
    fs.readFile(`images/${subreddit}/${filename}`, (err, data) => {
      client.post('media/upload', {
        media: data
      }, (err, media, response) => {
        if (!err) {
          let status = {
            status: addEllipsis(title, 140),
            media_ids: media.media_id_string
          }
          client.post('statuses/update', status, (err, tweet, response) => {
            if (err) callback(err)
            else callback(null, tweet.user.screen_name, tweet.id_str)
          })
        }
      })
    })
  }
}
const postLink = function (err, username, tweetID) {
  if (err) {
    if (err[0].code === 324) console.log('Image is too large!')
    else console.error(err)
  } else console.log(`Tweet: https://twitter.com/${username}/status/${tweetID}`)
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
