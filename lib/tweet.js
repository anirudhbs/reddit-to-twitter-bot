const fs = require('fs'),
  https = require('https'),
  stream = require('stream'),
  twitter = require('twitter'),
  config = require('../config/config.js')

const client = new twitter(config.twitterKeys),
  reddit = config.reddit

const getResponse = new Promise(function (resolve, reject) {
    const url = `https://www.reddit.com/r/${reddit.subreddit}/top/.json?sort=top&t=day&limit=${reddit.limit}`
    https.get(url, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        temp = JSON.parse(data).data.children
        resolve(temp)
      })
    })
  })
  .then(function (res) {
    const content = res
    Promise.all(content.map(function (current) {
      let post = current.data
      let imageUrl = post.preview.images[0].source.url
      const getImage = new Promise(function (resolve, reject) {
        https.request(imageUrl, function (response) {
          let data = new stream.Transform()
          response.on('data', function (chunk) {
            data.push(chunk)
          })
          response.on('end', function () {
            const filename = post.id
            fs.writeFileSync(`images/${filename}.png`, data.read())
            console.log(`downloaded: ${post.title.slice(0,30)}`)

            const file = fs.readFileSync(`images/${filename}.png`)
            client.post('media/upload', {
                media: file
              })
              .then((media, response) => {
                const tweet = {
                  status: `${post.title}`,
                  media_ids: media.media_id_string
                }
                client.post('statuses/update', tweet).then((result, response) => {
                  console.log(`tweet: https://twitter.com/itMeBot24/status/${result.id}`)
                })
              })
          })
        }).end()
      })
    }))
  })

module.exports = getResponse
