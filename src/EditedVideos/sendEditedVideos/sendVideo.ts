import TelegramBot from "node-telegram-bot-api";
import fs from "fs";
import path from "path";

const videosDir = path.join(process.cwd(), 'src', 'Edits'); 
export const userUsedIndexes = new Map<number, number[]>();

export function resetUserEdits(chatId: number) {
  userUsedIndexes.set(chatId, []);
}

export async function sendRandomVideo(bot: TelegramBot, chatId: number) {
  const files = fs.readdirSync(videosDir).filter(file =>
    file.endsWith(".mp4") || file.endsWith(".mov") || file.endsWith(".avi")
  );

  if (files.length === 0) {
    await bot.sendMessage(chatId, "🤔 К сожалению, в базе нет доступных эдитов. Можешь отправить свой с помощью команды /sendedit!");
    return;
  }

  let usedIndexes = userUsedIndexes.get(chatId) || [];

  if (usedIndexes.length >= files.length) {
    await bot.sendMessage(chatId, " Похоже, ты посмотрел все доступные эдиты.", {
      reply_markup: {
        inline_keyboard: [
          [
            { text: ' Смотреть сначала', callback_data: 'reset_edits' }
          ]
        ]
      }
    });
    return;
  }

  const loadingMsg = await bot.sendMessage(chatId, " *Достаю эдит из хранилища...*", { parse_mode: "Markdown" });

  let index: number;
  do {
    index = Math.floor(Math.random() * files.length);
  } while (usedIndexes.includes(index));

  usedIndexes.push(index);
  userUsedIndexes.set(chatId, usedIndexes);

  const videoPath = path.join(videosDir, files[index]);

  try {
    await bot.sendVideo(chatId, videoPath);
  } catch (error) {
    console.error("Ошибка при отправке видео:", error);
    await bot.sendMessage(chatId, " Не удалось отправить эдит.");
  } finally {

    await bot.deleteMessage(chatId, loadingMsg.message_id).catch(() => {});
  }
}

