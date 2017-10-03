const tweet = require('./tweet.js')
const schedule = require('node-schedule')

let rule = new schedule.RecurrenceRule()
rule.minute = 15
console.log('Running...')
tweet()
// schedule.scheduleJob(rule, () => {tweet()})
