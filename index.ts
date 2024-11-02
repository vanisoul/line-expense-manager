import * as Line from "@line/bot-sdk";
import express from "express";
import { channelAccessToken, channelSecret, envManager } from "./lib/env-manager";
import { createButtonFlexMessage, getEcho } from "./lib/message";
import { workflowManager } from "./lib/workflow-manager";
import { Logger } from "./lib/logger";

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
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// https://developers.line.biz/console/channel/2006504056/messaging-api
// https://manager.line.biz/account/@868gckly/setting/response

// event handler
async function handleEvent(event: Line.MessageEvent) {
  const token = event.replyToken;
  const logger = new Logger("index", token);

  if (event.type !== "message" || event.message.type !== "text") {
    logger.info("event type is not message or message type is not text");
    return Promise.resolve(null);
  }

  const userId = event.source.userId;
  if (!userId) {
    logger.info("userId is not found");
    return Promise.resolve(null);
  }

  if (!envManager.isWhitelistUser(userId)) {
    logger.info("userId is not in whitelist");
    return Promise.resolve(null);
  }

  if (!workflowManager.isLocked(userId)) {
    logger.info("userId is locked");
    return Promise.resolve(null);
  }

  logger.info(`userId: ${userId}`);
  workflowManager.lock(userId); // 鎖定使用者流程，防止其他操作介入

  const userMessage = event.message.text;
  const currentStep = workflowManager.getCurrentStep(userId);
  logger.info(`userMessage: ${userMessage}`);
  logger.info(`currentStep: ${currentStep}`);

  const work = () => {
    if (workflowManager.isAtStep(userId, "SEND_MESSAGE")) {
      await handleSendMessage(event, userId);
    } else if (workflowManager.isAtStep(userId, "AWAIT_USER_CONFIRMATION")) {
      await handleUserConfirmation(event, userId, userMessage);
    } else if (workflowManager.isAtStep(userId, "ASK_INITIATOR")) {
      await handleAskInitiator(event, userId, userMessage);
    } else if (workflowManager.isAtStep(userId, "ASK_MAIN_CATEGORY")) {
      await handleAskMainCategory(event, userId, userMessage);
    } else if (workflowManager.isAtStep(userId, "ASK_DETAIL")) {
      await handleAskDetail(event, userId, userMessage);
    } else if (workflowManager.isAtStep(userId, "ASK_EXPENSE_TYPE")) {
      await handleAskExpenseType(event, userId, userMessage);
    } else if (workflowManager.isAtStep(userId, "ASK_AMOUNT")) {
      await handleAskAmount(event, userId, userMessage);
    } else {
      await resetWorkflow(event, userId);
    }
  };

  const result = await work();
  workflowManager.unlock(userId); // 解鎖使用者流程，允許後續操作
  return result;
}


const cancelMessage = { label: "取消", text: "取消", style: "primary" };

async function handleSendMessage(event: Line.MessageEvent, userId: string) {
  workflowManager.setStep(userId, "AWAIT_USER_CONFIRMATION");

  const message = createButtonFlexMessage(
    "開始登記帳務資訊", [
    { label: "開始", text: "開始", style: "primary" },
  ]);

  return client.replyMessage({
    replyToken: event.replyToken,
    messages: [message],
  });
}

async function handleUserConfirmation(event: Line.MessageEvent, userId: string, userMessage: string) {
  if (userMessage === "取消") return resetWorkflow(event, userId);

  workflowManager.nextStep(userId); // 推進到 ASK_INITIATOR

  const message = createButtonFlexMessage(
    "請選擇發起人", envManager.config.persons.map(person => ({
      label: person.username,
      text: person.username,
      style: "secondary"
    })));

  return client.replyMessage({
    replyToken: event.replyToken,
    messages: [message],
  });
}

async function handleAskInitiator(event: Line.MessageEvent, userId: string, userMessage: string) {
  if (userMessage === "取消") return resetWorkflow(event, userId);

  workflowManager.nextStep(userId); // 推進到 ASK_MAIN_CATEGORY

  const message = createButtonFlexMessage(
    "請選擇項目", envManager.config.expenseCategories.map(category => ({
      label: category.name,
      text: category.name,
      style: "secondary"
    })));

  return client.replyMessage(event.replyToken, message2);
}

async function resetWorkflow(event: Line.MessageEvent, userId: string) {
  workflowManager.resetWorkflow(userId);
  const resetMessage = getEcho("已取消流程，返回初始階段。");
  const message = createButtonFlexMessage(
    "開始登記帳務資訊", [
    { label: "開始", text: "開始", style: "primary" },
  ]);
  return client.replyMessage({
    replyToken: event.replyToken,
    messages: [resetMessage, message],
  });
}


// listen on port
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});
