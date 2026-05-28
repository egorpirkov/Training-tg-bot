import TelegramBot from "node-telegram-bot-api";
import fs from "fs";
import path from "path";

const videosDir = path.join(process.cwd(), 'src', 'EditedVideos'); // src/EditedVideos
let usedIndexes: number[] = [];

export function sendRandomVideo(bot: TelegramBot, chatId: number) {
  const files = fs.readdirSync(videosDir).filter(file =>
    file.endsWith(".mp4") || file.endsWith(".mov") || file.endsWith(".avi")
  );

  if (files.length === 0) {
    bot.sendMessage(chatId, "❌ В папке не осталось эдитов.");
    return;
  }

  if (usedIndexes.length >= files.length) {
    usedIndexes = [];
  }

  let index: number;
  do {
    index = Math.floor(Math.random() * files.length);
  } while (usedIndexes.includes(index));

  usedIndexes.push(index);

  const videoPath = path.join(videosDir, files[index]);

  const current = usedIndexes.length;
  const total = files.length;

  bot.sendVideo(chatId, videoPath, {
    caption: `📹Осталось эдитов ${current}/${total}`
  });
}
