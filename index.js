const schedule = require('node-schedule'),
  tweet = require('./tweet.js')

let rule = new schedule.RecurrenceRule()
rule.minute = 0
console.log('Running...')
tweet
// schedule.scheduleJob(rule, () => {tweet})
