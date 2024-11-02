import * as Line from "@line/bot-sdk";

export function getQuoteFlex(message: string) {
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
  return flexMessage;
}

export function getEcho(text: string): Line.TextMessage {
  return { type: "text", text };
}