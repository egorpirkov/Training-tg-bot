"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startHandler = void 0;
const UserData_1 = require("../types/UserData");
const startHandler = (bot, chatId) => {
    (0, UserData_1.resetUserData)(chatId);
    bot.sendMessage(chatId, '🏋️ Добро пожаловать в Mike Mentzer Bot!\n\n' +
        'Что я умею:\n' +
        '/createprogram — создать программу пошагово (дни → проценты → подходы × повторы → 1ПМ)\n' +
        '/trainingplan — ввести готовую программу текстом (в разработке)\n' +
        '/rateexercise — оценить силовые (жим, подтягивания, брусья)\n' +
        '/sendvideo — отправить случайный эдит\n' +
        '/sendEdit — отправить свой эдит администратору\n' +
        '/help — что-то непонятно? используй эту команду', { parse_mode: 'Markdown' });
};
exports.startHandler = startHandler;
