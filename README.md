# Botany-node

![alt text](./images/plants.png "Logo Title Text 1")

### Elegant Facebook Messenger bots with Node.js

## Example using express

``` javascript
require('dotenv').config();
const express = require('express');
const app = express();
const bodyParser = require('body-parser')
const Botany = require('botany-node');

/* Configure our Facebook Bot */
var config = {
  facebook: {
    accessToken: process.env.FB_ACCESS_TOKEN,
    verifyToken: process.env.FB_VERIFY_TOKEN,
  }
};

/* Create a new bot */
var facebookBot = new Botany(config);

/* Listen for any incoming messages */
facebookBot.on('messages', (payload, reply) => {
  reply({ text: 'Hey arnold!' })
    .then(body => console.log('body', body))
    .catch(err => console.log('err', err));
});

/* Set up an express server  */
app.use(bodyParser.json());
/* Insert our bot's interceptor as middleware  */
app.use('/fb/webhook', facebookBot.intercept());
app.listen(3000, () => console.log('App listening on port 3000'));

```

## Available events

```javascript
// Called when the bot receives a message
facebookBot.on('messages', (payload, reply) => {} );

// Called when the bot has just sent a message
facebookBot.on('message_echoes', (payload) => {} );

// Called when a user has read a message sent by your bot
facebookBot.on('message_reads', (payload) => {} );

// Called when the Linked Account or Unlink Account call-to-action have been tapped
facebookBot.on('messaging_account_linking', (payload) => {} );

// Called when the Send-to-Messenger plugin has been tapped
facebookBot.on('messaging_optins', (payload) => {} );

// Called when a postback button has been clicked
facebookBot.on('messaging_postbacks', (payload) => {} );

```

## Entities

**Payload:** For a detailed description of the payload object for each event see the
[Facebook webhook developer documentation](https://developers.facebook.com/docs/messenger-platform/webhook-reference/)

**reply:** reply is a function for responding to a user. It takes a facebook message
as a body, formatted as per [Facebook's documentation](https://developers.facebook.com/docs/messenger-platform/send-api-reference)

