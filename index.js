const tweet = require('./lib/tweet.js')

console.log('Running...')
tweet.run()
setInterval(function () {
  tweet.run()
}, 1 * 60 * 60 * 1000) //1 hr interval
