# reddit-to-twitter-bot
Share images posted on Reddit on Twitter  
Currently supports posts that directly link to `jpg` `png` images

## Running the bot

```
npm start
```

### Prerequisites

The following npm packages are needed to run this.
```
twitter
node-schedule
```

### Configuration

Setting up the bot has to be done in the config/config.js file  
Twitter tokens can be obtained [here](https://apps.twitter.com/)

```
consumer_key: '',
consumer_secret: '',
access_token_key: '',
access_token_secret: ''

subreddit: ['', ''],
limit: 10
```

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
