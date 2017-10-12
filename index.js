const schedule = require('node-schedule'),
  tweet = require('./lib/tweet.js')

let rule = new schedule.RecurrenceRule()
rule.minute = 31

console.log('Running...')
tweet.run()

// schedule.scheduleJob(rule, () => {
//  tweet.run()
// })
