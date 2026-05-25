"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PullUp = void 0;
const UserData_1 = require("../../types/UserData");
const pullUpsRules_1 = require("./pullUpsRules");
const PullUp = async (bot, msg) => {
    const chatId = msg.chat.id;
    const text = msg.text?.trim();
    if (!text)
        return;
    const userData = (0, UserData_1.getUserData)(chatId);
    if (userData.PullUp === undefined) {
        const pullUps = parseInt(text, 10);
        if (!isNaN(pullUps) && pullUps >= 0) {
            const weight = userData.weight || 70;
            // Сохраняем временное значение подтягиваний для сессии
            (0, UserData_1.setUserData)(chatId, { PullUp: pullUps });
            const age = userData.age || 25;
            const gender = userData.gender || 'male';
            function getRandom(arr) {
                return arr[Math.floor(Math.random() * arr.length)];
            }
            // Поиск подходящего правила
            let evaluation = '';
            for (const rule of pullUpsRules_1.pullUpsRules) {
                const [minAge, maxAge] = rule.age;
                const [minPullUps, maxPullUps] = rule.pullUps;
                // Проверка возраста и количества подтягиваний
                if (age >= minAge && age <= maxAge &&
                    pullUps >= minPullUps && pullUps <= maxPullUps) {
                    // Проверка веса, если он указан в правиле
                    if (rule.weight) {
                        const [minWeight, maxWeight] = rule.weight;
                        if (weight >= minWeight && weight <= maxWeight) {
                            evaluation = getRandom(rule.variants);
                            break;
                        }
                    }
                    else {
                        evaluation = getRandom(rule.variants);
                        break;
                    }
                }
            }
            // Если правило не найдено, используем дефолтик
            if (!evaluation) {
                evaluation = 'Неплохой результат! Продолжай тренироваться!';
            }
            // Женский вариант 
            if (gender === 'female') {
                evaluation += ' ' + getRandom(pullUpsRules_1.femaleVariants).trim(); // trim() на всякий случай уберет лишние пробелы
            }
            await bot.sendMessage(chatId, evaluation);
            await bot.sendMessage(chatId, 'Спасибо! Все данные получены. Что-то еще?');
            // Полностью очищаем стейт после завершения оценки
            (0, UserData_1.setUserData)(chatId, {
                ratingMode: false,
                ratingExercise: undefined,
                PullUp: undefined // СБРОС подтягиваний для будущих тестов
            });
        }
        else {
            await bot.sendMessage(chatId, 'Пожалуйста, введи корректное число подтягиваний.');
        }
    }
};
exports.PullUp = PullUp;
