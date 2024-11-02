import * as Line from "@line/bot-sdk";
import express from "express";
import { channelAccessToken, channelSecret, envManager } from "./lib/env-manager";
import { createButtonFlexMessage, getEcho } from "./lib/message";
import { workflowManager } from "./lib/workflow-manager";
import { Logger } from "./lib/logger";

import { ButtonConfig } from "./models/message-model";

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

  if (workflowManager.isLocked(userId)) {
    logger.info("userId is locked");
    return Promise.resolve(null);
  }

  logger.info(`userId: ${userId}`);
  workflowManager.lock(userId); // 鎖定使用者流程，防止其他操作介入

  const userMessage = event.message.text;
  const currentStep = workflowManager.getCurrentStep(userId);
  logger.info(`userMessage: ${userMessage}`);
  logger.info(`currentStep: ${currentStep}`);

  const work: () => Promise<Line.messagingApi.ReplyMessageResponse> = () => {
    if (workflowManager.isAtStep(userId, "SEND_MESSAGE")) {
      return handleSendMessage(event, userId); // 開始登記帳務資訊
    } else if (workflowManager.isAtStep(userId, "ASK_INITIATOR")) {
      return handleAskInitiator(event, userId, userMessage); // 詢問發起人
    } else if (workflowManager.isAtStep(userId, "ASK_MAIN_CATEGORY")) {
      // 儲存發起人
      return handleAskMainCategory(event, userId, userMessage); // 請選擇主類別
    } else if (workflowManager.isAtStep(userId, "ASK_DETAIL")) {
      // 儲存主類別
      return handleAskDetail(event, userId, userMessage); // 請輸入明細
    } else if (workflowManager.isAtStep(userId, "ASK_EXPENSE_TYPE")) {
      // 儲存明細
      return handleAskExpenseType(event, userId, userMessage); // 請選擇支出類型
    } else if (workflowManager.isAtStep(userId, "ASK_AMOUNT")) {
      // 儲存支出類型
      return handleAskAmount(event, userId, userMessage); // 請輸入金額
    } else if (workflowManager.isAtStep(userId, "COMPLETED")) {
      // 儲存金額
      return handleCompleted(event, userId, userMessage); // 完成
    } else {
      return resetWorkflow(event);
    }
  };

  const result = await work();
  workflowManager.unlock(userId); // 解鎖使用者流程，允許後續操作
  return result;
}


const cancelMessage: ButtonConfig = { label: "取消", text: "取消", style: "primary" };
const startMessage = createButtonFlexMessage(
  "開始登記帳務資訊", [
  { label: "開始", text: "開始", style: "primary" },
]);

async function handleSendMessage(event: Line.MessageEvent, userId: string) {
  workflowManager.nextStep(userId); // 推進到 ASK_INITIATOR

  return client.replyMessage({
    replyToken: event.replyToken,
    messages: [startMessage],
  });
}

async function handleAskInitiator(event: Line.MessageEvent, userId: string, userMessage: string) {
  if (userMessage === "取消") return resetWorkflow(event);

  workflowManager.nextStep(userId); // 推進到 ASK_MAIN_CATEGORY

  const data: ButtonConfig[] = envManager.config.persons.map(person => ({
    label: person.username,
    text: person.username,
    style: "secondary"
  }));
  const message = createButtonFlexMessage(
    "請選擇發起人", [...data, cancelMessage]);

  return client.replyMessage({
    replyToken: event.replyToken,
    messages: [message],
  });
}

async function handleAskMainCategory(event: Line.MessageEvent, userId: string, userMessage: string) {
  if (userMessage === "取消") return resetWorkflow(event);

  workflowManager.nextStep(userId); // 推進到 ASK_DETAIL

  const data: ButtonConfig[] = envManager.config.expenseCategories.map(category => ({
    label: category.name,
    text: category.name,
    style: "secondary"
  }));
  const message = createButtonFlexMessage(
    "請選擇類別", [...data, cancelMessage]);

  return client.replyMessage({
    replyToken: event.replyToken,
    messages: [message],
  });
}

async function handleAskDetail(event: Line.MessageEvent, userId: string, userMessage: string) {
  if (userMessage === "取消") return resetWorkflow(event);

  workflowManager.nextStep(userId); // 推進到 ASK_EXPENSE_TYPE

  const message = createButtonFlexMessage(
    "請輸入項目明細或取消", [cancelMessage]);

  return client.replyMessage({
    replyToken: event.replyToken,
    messages: [message],
  });
}

async function handleAskExpenseType(event: Line.MessageEvent, userId: string, userMessage: string) {
  if (userMessage === "取消") return resetWorkflow(event);

  workflowManager.nextStep(userId); // 推進到 ASK_AMOUNT

  const data: ButtonConfig[] = envManager.config.paymentConfigs.map(config => ({
    label: config.name,
    text: config.name,
    style: "secondary"
  }));
  const message = createButtonFlexMessage(
    "請選擇支出方式", [...data, cancelMessage]);

  return client.replyMessage({
    replyToken: event.replyToken,
    messages: [message],
  });
}

async function handleCompleted(event: Line.MessageEvent, userId: string, userMessage: string) {
  if (userMessage === "取消") return resetWorkflow(event);

  workflowManager.resetWorkflow(userId); // 重置工作流程

  const completedMessage = getEcho("已完成登記帳務資訊。");

  return client.replyMessage({
    replyToken: event.replyToken,
    messages: [completedMessage, startMessage],
  });
}

async function handleAskAmount(event: Line.MessageEvent, userId: string, userMessage: string) {
  if (userMessage === "取消") return resetWorkflow(event);

  workflowManager.nextStep(userId); // 推進到 COMPLETED

  const message = createButtonFlexMessage(
    "請輸入金額或取消", [cancelMessage]);

  return client.replyMessage({
    replyToken: event.replyToken,
    messages: [message],
  });
}


async function resetWorkflow(event: Line.MessageEvent) {
  const resetMessage = getEcho("已取消流程，返回初始階段。");
  return client.replyMessage({
    replyToken: event.replyToken,
    messages: [resetMessage, startMessage],
  });
}


// listen on port
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});
