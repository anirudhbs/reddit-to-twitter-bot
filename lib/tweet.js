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
  if (data.length === 0) handleError(err, 'No posts found!')
  else downloadImages(null, data, postTweet)
}

function downloadImages(err, data, callback) {
  fs.readFile('./posted.json', (err, JSONData) => {
    let posted = JSON.parse(JSONData).posted,
      tempObj = {}
    tempObj.posted = posted
    data.map((current) => {
      let post = current.data,
        subreddit = post.subreddit,
        imageUrl = post.url,
        filename = post.id,
        title = post.title

      if (imageUrl.endsWith('jpg')) filename += '.jpg'
      if (imageUrl.endsWith('png')) filename += '.png'

      if (posted.includes(filename)) {
        console.log('File already tweeted')
        return
      } else {
        let fileWrite = fs.createWriteStream(`images/${filename}`)
        https.get(imageUrl, (res) => {
          res.pipe(fileWrite)
          res.on('end', () => {
            console.log('Downloaded: ' + addEllipsis(title, 30))
          })
          res.on('error', (err) => {
            handleError(err, 'Error downloading image')
          })
        }).on('error', (err) => {
          handleError(err, 'Unable to fetch image URL content')
        })
        fileWrite.on('close', () => {
          posted.push(filename)
          fs.writeFile('./posted.json', JSON.stringify(tempObj, null, 2), (err, data) => {
            if (!err) callback(null, filename, title, subreddit, postLink)
          })
        })
      }
    })
  })
}

function postTweet(err, filename, title, subreddit, callback) {
  fs.readFile(`images/${filename}`, (err, data) => {
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
          else callback(null, tweet.user.screen_name, tweet.id_str, filename, subreddit)
        })
      }
    })
  })
}

function postLink(err, username, tweetID, filename, subreddit) {
  console.log(`Tweet: https://twitter.com/${username}/status/${tweetID}`)
  fs.unlink(`./images/${filename}`, (err) => {
    if (err) console.error(err);
    else console.log('deleted: ' + filename)
  })
}

function addEllipsis(title, size) {
  let lastSpace = title.slice(0, size - 3).lastIndexOf(' ')
  return (title.length < size) ? title : (title.slice(0, lastSpace) + '...')
}

function handleError(err, message) {
  if (err) console.error(message + '\n' + err)
  else console.error(message)
}

module.exports = {
  run: downloadAndTweet,
  getContent: getContent,
  filterContent: filterContent,
  downloadImages: downloadImages,
  postTweet: postTweet,
  addEllipsis: addEllipsis,
  postLink: postLink
}
