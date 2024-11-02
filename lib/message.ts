import * as Line from "@line/bot-sdk";
import { ButtonConfig } from "../models/message-model";

export function createButtonFlexMessage(title: string, buttons: ButtonConfig[]): Line.messagingApi.Message {
  return {
    type: "flex",
    altText: "訊息",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: title,
            weight: "bold",
            size: "md",
            align: "center"
          },
          {
            type: "box",
            layout: "horizontal",
            spacing: "md",
            contents: buttons.map(button => ({
              type: "button",
              action: {
                type: "message",
                label: button.label,
                text: button.text
              },
              style: button.style || "primary", // 預設為 primary
              height: "sm" // 調整按鈕大小
            }))
          }
        ]
      }
    }
  };
}


export function getQuoteFlex(message: string): Line.messagingApi.Message {
  // 創建 Flex Message，包含引用的訊息和回覆的內容
  const flexMessage: Line.FlexMessage = {
    type: "flex",
    altText: "這是回覆訊息",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "引用的訊息：",
                color: "#AAAAAA",
                size: "sm",
              },
              {
                type: "text",
                text: message,
                wrap: true,
                size: "sm",
                color: "#000000",
              },
            ],
          },
          {
            type: "separator",
            margin: "md",
          },
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "這是回覆訊息的內容",
                wrap: true,
                size: "md",
                color: "#0000FF",
              },
            ],
            margin: "md",
          },
        ],
      },
    },
  };
  return flexMessage as Line.messagingApi.Message;
}

export function getEcho(text: string): Line.messagingApi.Message {
  return { type: "text", text };
}