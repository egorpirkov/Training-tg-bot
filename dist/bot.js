"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
process.env.NTBA_FIX_319 = "1";
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const startHandler_1 = require("./handlers/startHandler");
const callbackHandler_1 = require("./handlers/callbackHandler");
const messageHandler_1 = require("./handlers/messageHandler");
const UserData_1 = require("./types/UserData");
const programCreation_1 = require("./utils/programCreation");
const sendVideo_1 = require("./EditedVideos/sendEditedVideos/sendVideo");
const getVideo_1 = require("./EditedVideos/getEditedVideos/getVideo");
const express_1 = __importDefault(require("express"));
const helpHandler_1 = require("./handlers/helpHandler");
const app = (0, express_1.default)();
app.get('/', (req, res) => res.send('Bot is alive 🚀'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is alive on port ${PORT}`));
const token = process.env.BOT_TOKEN;
if (!token)
    throw new Error('BOT_TOKEN не найден в .env');
const bot = new node_telegram_bot_api_1.default(token, { polling: true });
bot.setMyCommands([
    { command: 'start', description: 'Запуск бота' },
    { command: 'help', description: 'ответы на вопросы' },
    { command: 'createprogram', description: 'Создать тренировочную программу' },
    { command: 'rateexercise', description: 'Оценить силовые показатели(подтягивание,брусья и тд)' },
    { command: 'trainingplan', description: 'Ввести готовую программу(в разработке)' },
    { command: 'sendvideo', description: 'Получить случайный эдит' },
    { command: 'sendedit', description: 'Отправить свой эдит админу' },
]);
// /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    (0, UserData_1.resetUserData)(chatId);
    (0, startHandler_1.startHandler)(bot, chatId);
});
// /createprogram 
bot.onText(/\/createprogram/, (msg) => {
    const chatId = msg.chat.id;
    const u = (0, UserData_1.getUserData)(chatId);
    (0, UserData_1.setUserData)(chatId, { ...u, programData: undefined, currentStep: undefined });
    (0, programCreation_1.startProgramCreation)(bot, chatId);
});
// /rateexercise
bot.onText(/\/rateexercise/, (msg) => {
    const chatId = msg.chat.id;
    (0, UserData_1.setUserData)(chatId, { ratingMode: true, ratingExercise: undefined, weight: undefined, age: undefined });
    bot.sendMessage(chatId, '💪 Выбери упражнение для оценки:', {
        reply_markup: {
            inline_keyboard: [[
                    { text: 'Жим лёжа', callback_data: 'rate_bench' },
                    { text: 'Подтягивания', callback_data: 'rate_pullups' },
                    { text: 'Брусья', callback_data: 'rate_dips' },
                ]]
        }
    });
});
// /trainingplan
bot.onText(/\/trainingplan/, (msg) => {
    bot.sendMessage(msg.chat.id, '📝 Отправь программу в текстовом виде.\n\n' +
        '*Пример 1 (проценты):*\n' +
        'Пн: 70% 4x2\n' +
        'Ср: 75% 4x2\n' +
        'Пт: 80% 4x2\n\n' +
        '*Пример 2 (веса):*\n' +
        'Жим: 60кг 3x5\n' +
        'Присед: 80кг 3x5', { parse_mode: 'Markdown' });
});
// общий обработчик callback_query
bot.on('callback_query', (q) => (0, callbackHandler_1.callbackHandler)(bot, q));
// единый обработчик сообщений
bot.on('message', (msg) => {
    if (msg.text && !msg.text.startsWith('/')) {
        (0, messageHandler_1.messageHandler)(bot, msg);
    }
});
//рандом эдит
bot.onText(/\/sendvideo/, (msg) => {
    const chatId = msg.chat.id;
    (0, sendVideo_1.sendRandomVideo)(bot, chatId);
});
//help
bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    (0, helpHandler_1.helpHandler)(bot, chatId);
});
//получение эдита 
(0, getVideo_1.getVideoHandler)(bot);
console.log('Бот запущен…');
