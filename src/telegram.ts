import TelegramBot from "node-telegram-bot-api";
import { config } from "./config";

export const bot = new TelegramBot(config.botToken, { polling: true });

bot.on("message", (msg) => {
  console.log("CHAT_ID:", msg.chat.id);
});

export async function sendTelegram(text: string) {
  for (const chatId of config.chatIds) {
    await bot.sendMessage(chatId, text);
  }
}
