import TelegramBot, { Message } from "node-telegram-bot-api";

export const Dips = (bot: TelegramBot, msg: Message) => {
    return bot.sendMessage(msg.chat.id, 'Брусья')
}