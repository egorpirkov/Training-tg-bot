"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.helpHandler = void 0;
const helpHandler = (bot, chatId) => {
    bot.sendMessage(chatId, '📘 Помощь — выбери вопрос:', {
        reply_markup: {
            inline_keyboard: [
                [{ text: '❓ Что такое 1ПМ?', callback_data: 'faq_1pm' }],
                [{ text: '❓ Зачем нужны проценты от 1ПМ?', callback_data: 'faq_percent' }],
                [{ text: '❓ Как работает команда /createprogram?', callback_data: 'faq_createprogram' }],
                [{ text: '❓ Зачем отправлять свой эдит админу?', callback_data: 'faq_edit' }],
                [{ text: '💬 Другие вопросы? Написать разработчику', url: 'https://t.me/tem_gmx' }]
            ]
        }
    });
};
exports.helpHandler = helpHandler;
