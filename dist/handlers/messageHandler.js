"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageHandler = void 0;
const UserData_1 = require("../types/UserData");
const programCreation_1 = require("../utils/programCreation");
const Bench_1 = require("../exercises/Bench/Bench");
const PullUp_1 = require("../exercises/Pull-Ups/PullUp");
const Dips_1 = require("../exercises/Dips/Dips");
const messageHandler = async (bot, msg) => {
    const chatId = msg.chat.id;
    const text = msg.text?.trim();
    if (!text)
        return;
    const userData = (0, UserData_1.getUserData)(chatId);
    if (userData.currentStep) {
        await (0, programCreation_1.handleProgramCreationMessage)(bot, chatId, text);
        return;
    }
    //Режим оценки упражнений
    if (userData.ratingMode) {
        //Обработка возраста
        if (!userData.age) {
            const age = parseInt(text, 10);
            if (!isNaN(age) && age > 0 && age < 120) {
                (0, UserData_1.setUserData)(chatId, { age });
                if (userData.ratingExercise === 'bench') {
                    await bot.sendMessage(chatId, '✅ Возраст установлен. Теперь введи свой вес тела (в кг):');
                }
                else {
                    await bot.sendMessage(chatId, '✅ Возраст установлен. Теперь введи свой вес тела (в кг):');
                }
                return;
            }
            else {
                await bot.sendMessage(chatId, 'Пожалуйста, введи корректный возраст (число от 1 до 120).');
                return;
            }
        }
        // Обработка веса
        if (!userData.weight) {
            const weight = parseFloat(text.replace(',', '.'));
            if (!isNaN(weight) && weight >= 30 && weight <= 150) {
                (0, UserData_1.setUserData)(chatId, { weight });
                if (userData.ratingExercise === 'bench') {
                    await bot.sendMessage(chatId, '✅ Вес установлен. Теперь введи свой максимальный результат в жиме лежа (в кг):');
                }
                else if (userData.ratingExercise === 'pullups') {
                    await bot.sendMessage(chatId, '✅ Вес установлен. Теперь введи свое максимальное количество подтягиваний:');
                }
                else if (userData.ratingExercise === 'dips') {
                    await bot.sendMessage(chatId, '✅ Вес установлен. Теперь введи свое максимальное количество отжиманий на брусьях:');
                }
                return;
            }
            else {
                await bot.sendMessage(chatId, 'Пожалуйста, введи реальный вес тела (число от 30 до 150 кг).');
                return;
            }
        }
        // обрабатываем упражнение
        switch (userData.ratingExercise) {
            case 'bench':
                await (0, Bench_1.Bench)(bot, msg);
                return;
            case 'pullups':
                await (0, PullUp_1.PullUp)(bot, msg);
                return;
            case 'dips':
                await (0, Dips_1.Dips)(bot, msg);
                return;
        }
    }
};
exports.messageHandler = messageHandler;
