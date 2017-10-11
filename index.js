const schedule = require('node-schedule'),
  tweet = require('./lib/tweet.js'),
  config = require('./config/config.js'),
  Reddit = config.reddit

let rule = new schedule.RecurrenceRule()
rule.minute = 31
let subreddits = Reddit.subreddit.join('+'),
  redditUrl = `https://www.reddit.com/r/${subreddits}/rising/.json?limit=${Reddit.limit}`

console.log('Running...')
tweet.getContent(redditUrl, tweet.filterContent)
// schedule.scheduleJob(rule, () => {
//   tweet.getContent(redditUrl, tweet.filterContent)
// })
