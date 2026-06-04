import TelegramBot from "node-telegram-bot-api";
import fs from "fs";
import path from "path";

const videosDir = path.join(process.cwd(), 'src', 'Edits'); 
let usedIndexes: number[] = [];

export async function sendRandomVideo(bot: TelegramBot, chatId: number) {
  const files = fs.readdirSync(videosDir).filter(file =>
    file.endsWith(".mp4") || file.endsWith(".mov") || file.endsWith(".avi")
  );

  if (files.length === 0) {
    await bot.sendMessage(chatId, "🤔 К сожалению, в базе нет доступных эдитов. Можешь отправить свой с помощью команды /sendedit!");
    return;
  }

  // Отправляем временное сообщение о загрузке
  const loadingMsg = await bot.sendMessage(chatId, " *Достаю эдит из хранилище...*", { parse_mode: "Markdown" });

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

  try {
    await bot.sendVideo(chatId, videoPath, {
      caption: ` Осталось эдитов ${current}/${total}`
    });
  } catch (error) {
    console.error("Ошибка при отправке видео:", error);
    await bot.sendMessage(chatId, " Не удалось отправить эдит.");
  } finally {
    // Удаляем сообщение о загрузке
    await bot.deleteMessage(chatId, loadingMsg.message_id).catch(() => {});
  }
}
