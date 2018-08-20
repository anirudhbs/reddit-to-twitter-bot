require('dotenv').config();

const fetch = require('node-fetch');
const Twitter = require('twitter');

const client = new Twitter({
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  access_token_key: process.env.ACCESS_TOKEN,
  access_token_secret: process.env.ACCESS_SECRET
});
const arr = [];

async function getPosts() {
  const url = `https://www.reddit.com/r/${process.env.SUBREDDITS}/rising/.json?limit=${process.env.LIMIT}`;
  try {
    const data = await fetch(url);
    const posts = await data.json();
    return posts.data.children;
  } catch (err) {
    console.log('Error fetching reddit content', err);
    return [];
  }
}

function filterContent(data) {
  const images = data.filter(cur => cur.data.url.endsWith('.jpg') || cur.data.url.endsWith('.png'));
  const posts = images.map(cur => ({
    title: cur.data.title,
    url: cur.data.url,
    sub: cur.data.subreddit_name_prefixed,
    id: cur.data.id
  }));
  return posts;
}

function getStatus(title, sub) {
  if (title.length < 100) {
    return `${title} via ${sub}`;
  }
  const lastSpace = title.slice(0, 100).lastIndexOf(' ');
  return `${title.slice(0, lastSpace)}... via ${sub}`;
}

async function postTweet(post, buf) {
  const { title, sub, id } = post;
  try {
    const media = await client.post('media/upload', { media: buf });
    if (media) {
      const status = {
        status: getStatus(title, sub),
        media_ids: media.media_id_string
      };
      try {
        const tweet = await client.post('statuses/update', status);
        if (tweet) {
          arr.push(id);
        }
      } catch (err) {
        console.log('Error posting tweet', err);
      }
    }
  } catch (err) {
    console.log('Error adding image', err);
  }
}

async function getImage(post) {
  const { url } = post;
  try {
    const data = await fetch(url);
    const buffer = await data.arrayBuffer();
    postTweet(post, Buffer.from(buffer));
  } catch (err) {
    console.log('Error getting image', err);
  }
}

function removeOldPosts(posts) {
  return posts.filter(cur => arr.indexOf(cur.id) === -1);
}

async function start() {
  const posts = await getPosts(); // todo: add filter for reposts
  const content = filterContent(posts);
  const newPosts = removeOldPosts(content);
  newPosts.forEach((cur) => {
    getImage(cur);
  });
}
function init() {
  console.log('running...');
  start();
  return setInterval(() => {
    start();
  }, 1000 * 60 * 60 * 4);
}

init();
