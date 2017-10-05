const fs = require('fs')
const https = require('https')
const fetch = require('node-fetch')
const async = require('async')

const fetchAndPost = async function () {
  const url = 'https://www.reddit.com/r/pics/top/.json?sort=top&t=day&limit=3'
  const response = await getResponse(url)
  const content = response.data.children

  await Promise.all(
    content.map(async function (current) {
      let post = current.data
      let imageUrl = post.preview.images[0].source.url
      await getImage(imageUrl, post.id)
      console.log(`${post.title}`)
    })
  )
}

const getImage = async function (url, name) {
  await fetch(url)
    .then(res => {
      let file = fs.createWriteStream(`images/${name}.jpg`)
      res.body.pipe(file)
    })
}

module.exports = fetchAndPost()
