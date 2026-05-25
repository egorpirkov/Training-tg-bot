"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trainingMemory = void 0;
exports.trainingMemory = {};
// автоочистка 30 мин
setInterval(() => {
    const now = Date.now();
    for (const chatIdStr in exports.trainingMemory) {
        const chatId = Number(chatIdStr);
        const data = exports.trainingMemory[chatId];
        if (now - (data.timestamp || 0) > 30 * 60 * 1000) {
            delete exports.trainingMemory[chatId];
        }
    }
}, 30 * 60 * 1000);
