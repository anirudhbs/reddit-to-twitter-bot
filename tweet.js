const fs = require('fs')
const async = require('async')
const axios = require('axios')

const fetchAndPost = async function () {
  const url = 'https://www.reddit.com/r/pics/top/.json?sort=top&t=day&limit=5'
  const response = await axios.get(url)
  let content = response.data.data.children

  await Promise.all(
    content.map(async function (current) {
      let post = current.data
      let imageUrl = post.preview.images[0].source.url
      let imageResponse = await axios({
        method: 'get',
        url: imageUrl,
        responseType: 'arraybuffer'
      })
      let buffer = new Buffer(imageResponse.data)
      let filename = `${post.id}.jpg`
      fs.writeFileSync(`images/${filename}`, buffer)
      console.log(`${post.title}`)
    })
  )
}

module.exports = fetchAndPost()
