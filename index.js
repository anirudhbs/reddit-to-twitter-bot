const schedule = require('node-schedule'),
  tweet = require('./lib/tweet.js'),
  config = require('./config/config.js'),
  Reddit = config.reddit

let rule = new schedule.RecurrenceRule()
rule.minute = 0
console.log('Running...')
const redditUrl = `https://www.reddit.com/r/${Reddit.subreddit}/rising/.json?limit=${Reddit.limit}`
tweet.getContent(redditUrl, tweet.downloadImages)
// schedule.scheduleJob(rule, () => {
//   tweet
// })
