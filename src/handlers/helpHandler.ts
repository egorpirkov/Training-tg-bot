import TelegramBot from "node-telegram-bot-api";

export const helpHandler = (bot: TelegramBot, chatId: number) => {
    bot.sendMessage(chatId, 
        'Вот основные вопросы,которые могут возникнуть у вас:',
        {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Что такое 1ПМ?', callback_data: 'faq_1pm' }],
                    [{ text: 'Зачем нужны проценты от 1ПМ?', callback_data: 'faq_percent' }],
                    [{ text: 'Как работает команда /createprogram?', callback_data: 'faq_createprogram' }],
                    [{ text: 'Зачем отправлять свой эдит админу?', callback_data: 'faq_edit' }],
                    [{ text: 'Другие вопросы? Написать разработчику', url: 'https://t.me/MusashiHammer' }]
                ]
            }
        }
    );
};
