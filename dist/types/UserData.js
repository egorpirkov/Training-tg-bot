"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetUserData = exports.setUserData = exports.getUserData = void 0;
const userDataMap = new Map();
const getUserData = (chatId) => {
    if (!userDataMap.has(chatId)) {
        userDataMap.set(chatId, {});
    }
    return userDataMap.get(chatId);
};
exports.getUserData = getUserData;
const setUserData = (chatId, data) => {
    const current = (0, exports.getUserData)(chatId);
    userDataMap.set(chatId, {
        ...current,
        ...data,
        timestamp: Date.now() // фиксируем типо когда последний раз обновляли
    }); //type assertion
};
exports.setUserData = setUserData;
// это функция говорит,возьми существующие данные юзера по chatId,
// обнови их новыми значениями и сохрани обратно,
// при этом пометь время изменении
const resetUserData = (chatId) => {
    userDataMap.delete(chatId);
};
exports.resetUserData = resetUserData;
//сброс данных юзера
// автоочистка 24ч
setInterval(() => {
    const now = Date.now();
    for (const [chatId, data] of userDataMap.entries()) {
        if (now - (data.timestamp || 0) > 24 * 60 * 60 * 1000) {
            userDataMap.delete(chatId);
        }
    }
}, 24 * 60 * 60 * 1000);
