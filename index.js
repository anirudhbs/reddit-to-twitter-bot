const schedule = require('node-schedule'),
  tweet = require('./lib/tweet.js'),
  config = require('./config/config.js'),  
  Reddit = config.reddit

let rule = new schedule.RecurrenceRule()
rule.minute = 0
console.log('Running...')
// schedule.scheduleJob(rule, () => {
//   tweet
// })

const redditUrl = `https://www.reddit.com/r/${Reddit.subreddit}/top/.json?sort=top&t=day&limit=${Reddit.limit}`
tweet.getContent(redditUrl, tweet.downloadImages)
