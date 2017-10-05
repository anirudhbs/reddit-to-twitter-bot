const fs = require('fs')
const https = require('https')
const async = require('async')
const stream = require('stream')

const getResponse = new Promise(function (resolve, reject) {
    const url = 'https://www.reddit.com/r/BlackPeopleTwitter/top/.json?sort=top&t=day&limit=2'
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
  .then(async function (res) {
    const content = res
    await Promise.all(
      content.map(function (current) {
        let post = current.data
        let imageUrl = post.preview.images[0].source.url
        const getImage = new Promise(function (resolve, reject) {
          https.request(imageUrl, function (response) {
            let data = new stream.Transform()
            response.on('data', function (chunk) {
              data.push(chunk)
            })
            response.on('end', function () {
              fs.writeFileSync(`images/${post.id}.png`, data.read())
              console.log('done reading')
            })
          }).end(function () {
            console.log(`${post.title}`)
          })
        })
      })
    )
  })

module.exports = getResponse
