import * as Line from "@line/bot-sdk";
import express from "express";
import { channelAccessToken, channelSecret } from "./lib/env-manager";
import { getQuoteFlex, getEcho } from "./lib/message";

// create LINE SDK config from env variables
const config = { channelSecret };

// create LINE SDK client
const client = new Line.messagingApi.MessagingApiClient({ channelAccessToken });

// create Express app
// about Express itself: https://expressjs.com/
const app = express();

// register a webhook handler with middleware
// about the middleware, please refer to doc
app.post("/callback", Line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(flexHandleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// https://developers.line.biz/console/channel/2006504056/messaging-api
// https://manager.line.biz/account/@868gckly/setting/response

// event handler
function handleEvent(event: Line.MessageEvent) {
  if (event.type !== "message" || event.message.type !== "text") {
    // ignore non-text-message event
    return Promise.resolve(null);
  }
  // create an echoing text message
  const echo = getEcho(event.message.text);

  // use reply API
  return client.replyMessage({
    replyToken: event.replyToken,
    messages: [echo],
  });
}

function flexHandleEvent(event: Line.MessageEvent) {
  if (event.message.type === "text") {
    const receivedMessageText = event.message.text;
    const flexMessage = getQuoteFlex(receivedMessageText);

    // 使用 replyMessage 回應用戶，並包含自定義的 Flex Message
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [flexMessage] as Line.messagingApi.Message[],
    });
  }
}

// listen on port
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});
