const fs = require('fs'),
  https = require('https'),
  twitter = require('twitter'),
  config = require('../config/config.json'),
  client = new twitter(config.twitterKeys),
  Reddit = config.reddit

function downloadAndTweet() {
  let subreddits = Reddit.subreddit.join('+'),
    redditUrl = `https://www.reddit.com/r/${subreddits}/rising/.json?limit=${Reddit.limit}`
  getContent(redditUrl, filterContent)
}

function getContent(url, callback) {
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
    handleError(err, 'Unable to fetch content')
  })
}

function filterContent(err, data) {
    data = data.filter((currentPost) => {
      if (currentPost.data.url.endsWith('.jpg') || currentPost.data.url.endsWith('.png')) return currentPost
    })
    if (data.length === 0) createFolders('No posts found!')
    else createFolders(null, data, downloadImages)
}

function createFolders(err, data, callback) {
  if (err) console.error(err)
  else {
    Reddit.subreddit.map((currentSub) => {
      let subRedditDir = `./images/${currentSub}`
      fs.access(subRedditDir, (err) => {
        if (err) {
          fs.mkdir(subRedditDir, (err) => {
            if (err) handleError(err, 'Error creating folder')
            else console.log('Folder created: ' + currentSub)
          })
        }
      })
    })
    callback(null, data, postTweet)
  }
}

function downloadImages(err, data, callback) {
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
              handleError(err, 'Error downloading image')
            })
          }).on('error', (err) => {
            handleError(err, 'Unable to fetch image URL content')
          })
          fileWrite.on('close', () => {
            fs.stat(`images/${subreddit}/${filename}`, (err, data) => {
              if (err) handleError(err, 'Error accessing file')
              if (data.size > 5242880) callback('Image is too large!')
              else callback(null, filename, title, subreddit, postLink)
            })
          })
        }
      })
    })
  }
}

function postTweet(err, filename, title, subreddit, callback) {
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
            if (err) handleError(err, 'Error posting tweet')
            else callback(null, tweet.user.screen_name, tweet.id_str)
          })
        }
      })
    })
  }
}

function postLink(err, username, tweetID) {
  console.log(`Tweet: https://twitter.com/${username}/status/${tweetID}`)
}

function addEllipsis(title, size) {
  let lastSpace = title.slice(0, size - 3).lastIndexOf(' ')
  return (title.length < size) ? title : (title.slice(0, lastSpace) + '...')
}

function handleError(err, message) {
  console.error(message + '\n' + err)
}

module.exports = {
  run: downloadAndTweet,
  getContent: getContent,
  filterContent: filterContent,
  createFolders: createFolders,
  downloadImages: downloadImages,
  postTweet: postTweet,
  addEllipsis: addEllipsis,
  postLink: postLink,

}
