"use strict";
const EventEmitter = require('events').EventEmitter
const request = require('request');
const events = require('./events');


class Bot extends EventEmitter {

  constructor(config) {
    super();
    this.facebook = {
      accessToken: config.facebook.accessToken || false,
      verifyToken: config.facebook.verifyToken || false,
    };
  }

  intercept() {
    return (req, res, next) => {
      if (this.facebook.verifyToken && req.method === 'GET') {
        return this._verify(req, res);
      } else if (req.method === 'POST') {
        this._dispatch(req.body);
        res.sendStatus(200);
      }
      next();
    }
  }

  sendMessage (recipientId, payload) {
    return new Promise((resolve, reject) => {
      request({
        method: 'POST',
        uri: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {
          access_token: this.facebook.accessToken
        },
        json: {
          recipient: { id: recipientId },
          message: payload
        }
      }, (err, res, body) => {
        if (err) return reject(err);
        if (body.error) resolve(body.error);
        resolve(body);
      });
    })
  }

  /*
    Dispatches all incoming facebook POST requests to the correct handler
   */
  _dispatch(facebookPostBody) {
    // Make sure this is a page subscription
    if (facebookPostBody.object == 'page') {
      // Iterate over each entry
      // There may be multiple if batched
      facebookPostBody.entry.forEach((pageEntry) => {
        var pageID = pageEntry.id;
        var timeOfEvent = pageEntry.time;

        // Iterate over each messaging event
        pageEntry.messaging.forEach((messagingEvent) => {
          if (messagingEvent.optin) {
            this._receivedAuthentication(messagingEvent);
          } else if (messagingEvent.message) {
            this._receivedMessage(messagingEvent);
          } else if (messagingEvent.delivery) {
            this._receivedDeliveryConfirmation(messagingEvent);
          } else if (messagingEvent.postback) {
            this._receivedPostback(messagingEvent);
          } else if (messagingEvent.read) {
            this._receivedMessageRead(messagingEvent);
          } else if (messagingEvent.account_linking) {
            this._receivedAccountLink(messagingEvent);
          } else {
            console.log("Webhook received unknown messagingEvent: ", messagingEvent);
          }
        });
      });
    }
  }

  /*
    Varifies webhook set up using the the verify token
   */
  _verify(req, res) {
    if (req.query['hub.mode'] === 'subscribe' &&
        req.query['hub.verify_token'] === this.facebook.verifyToken) {
      console.log("Validating webhook");
      res.status(200).send(req.query['hub.challenge']);
    } else {
      console.error("Failed validation. Make sure the validation tokens match.");
      res.sendStatus(403);
    }
  }

  /*
    Event Handling for the various types of facebook events
   */
  _receivedMessage(messagingEvent) {
  this.emit(events.MESSAGES, messagingEvent, (messageToSend) => {
      return this.sendMessage(messagingEvent.sender.id, messageToSend);
    });
  }

  _receivedAuthentication(messagingEvent) {
    this.emit(events.MESSAGEING_OPTINS);
  }

  _receivedDeliveryConfirmation(messagingEvent) {
    this.emit(events.MESSAGE_DELIVERIES);
  }

  _receivedPostback(messagingEvent) {
    this.emit(events.MESSAGE_POSTBACKS);
  }

  _receivedMessageRead(messagingEvent) {
    this.emit(events.MESSAGE_ECHOES);
  }

  _receivedAccountLink(messagingEvent) {
    this.emit(events.MESSAGING_ACCOUNT_LINKING);
  }
}

module.exports = Bot;
