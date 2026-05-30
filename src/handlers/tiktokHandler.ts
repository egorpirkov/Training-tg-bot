import TelegramBot from 'node-telegram-bot-api';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

export const tiktokHandler = async (bot: TelegramBot, chatId: number, url: string) => {
  await bot.sendMessage(chatId, ' Обрабатываю ссылку...');

  await bot.sendMessage(chatId, 'Что хочешь скачать?', {
    reply_markup: {
      inline_keyboard: [[
        { text: 'Видео', callback_data: `tiktok_video_${encodeURIComponent(url)}` },
        { text: ' Звук', callback_data: `tiktok_audio_${encodeURIComponent(url)}` },
      ]]
    }
  });
};

export const downloadTikTok = async (
  bot: TelegramBot,
  chatId: number,
  url: string,
  type: 'video' | 'audio'
) => {
  const tmpDir = '/tmp';
  const fileName = `tiktok_${Date.now()}`;
  const outputPath = path.join(tmpDir, fileName);

  try {
    await bot.sendMessage(chatId, ' Скачиваю...');

    if (type === 'video') {
      await execAsync(`yt-dlp -o "${outputPath}.mp4" --merge-output-format mp4 "${url}"`);
      const filePath = `${outputPath}.mp4`;
      await bot.sendVideo(chatId, filePath);
      fs.unlinkSync(filePath);
    } else {
      await execAsync(`yt-dlp -x --audio-format mp3 -o "${outputPath}.mp3" "${url}"`);
      const filePath = `${outputPath}.mp3`;
      await bot.sendAudio(chatId, filePath);
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error('Ошибка скачивания TikTok:', err);
    await bot.sendMessage(chatId, 'Не удалось скачать. Попробуй другую ссылку.');
  }
};