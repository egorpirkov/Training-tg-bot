"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendRandomVideo = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Путь к папке с видео
const videosDir = path_1.default.join(process.cwd(), 'src', 'EditedVideos'); // src/EditedVideos
let usedIndexes = [];
// Функция для отправки случайного видео
function sendRandomVideo(bot, chatId) {
    const files = fs_1.default.readdirSync(videosDir).filter(file => file.endsWith(".mp4") || file.endsWith(".mov") || file.endsWith(".avi"));
    if (files.length === 0) {
        bot.sendMessage(chatId, "❌ В папке не осталось эдитов.");
        return;
    }
    // если все видео были показаны — сбрасываем список
    if (usedIndexes.length >= files.length) {
        usedIndexes = [];
    }
    // выбираем случайное видео, которого не было
    let index;
    do {
        index = Math.floor(Math.random() * files.length);
    } while (usedIndexes.includes(index));
    usedIndexes.push(index);
    const videoPath = path_1.default.join(videosDir, files[index]);
    const current = usedIndexes.length;
    const total = files.length;
    bot.sendVideo(chatId, videoPath, {
        caption: `📹Осталось эдитов ${current}/${total}`
    });
}
exports.sendRandomVideo = sendRandomVideo;
