import TelegramBot from 'node-telegram-bot-api';

export const tiktokHandler = async (bot: TelegramBot, chatId: number, url: string) => {
  await bot.sendMessage(chatId, 'Обрабатываю ссылку...');

  await bot.sendMessage(chatId, 'Что хочешь скачать?', {
    reply_markup: {
      inline_keyboard: [[
        { text: 'Видео ', callback_data: `tiktok_video_${encodeURIComponent(url)}` },
        { text: 'Звук ', callback_data: `tiktok_audio_${encodeURIComponent(url)}` },
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
  try {
    await bot.sendMessage(chatId, ' Скачиваю...');

    const fetchFn = (globalThis as any).fetch;
    if (!fetchFn) {
      throw new Error('Global fetch is not available in Node.js runtime');
    }

    const response = await fetchFn(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&type=json`);
    const result = await response.json();

    if (result.code !== 0 || !result.data) {
      await bot.sendMessage(chatId, '🤔 Не удалось найти видео или медиафайлы по этой ссылке.');
      return;
    }

    if (type === 'video') {
      if (result.data.images && Array.isArray(result.data.images) && result.data.images.length > 0) {
        await bot.sendMessage(chatId, 'Скаичваю фотографии...');
        const mediaGroup = result.data.images.map((img: any) => {
          const mediaUrl = typeof img === 'string' ? img : (img.url_list?.[0] || img.thumbnail || img);
          return {
            type: 'photo' as const,
            media: mediaUrl
          };
        });
        await bot.sendMediaGroup(chatId, mediaGroup.slice(0, 10));
      } else {
        const videoUrl = result.data.play;
        if (!videoUrl) {
          await bot.sendMessage(chatId, '🤔 Не удалось извлечь ссылку на видео.');
          return;
        }
        await bot.sendVideo(chatId, videoUrl);
      }
    } else {
      const audioUrl = result.data.music || result.data.music_info?.play;
      if (!audioUrl) {
        await bot.sendMessage(chatId, '🤔 Не удалось найти аудиодорожку.');
        return;
      }
      const title = result.data.music_info?.title || 'TikTok Audio';
      await bot.sendAudio(chatId, audioUrl, { title });
    }
  } catch (err) {
    console.error('Ошибка скачивания TikTok через TikWM API:', err);
    await bot.sendMessage(chatId, '🤔 Не удалось скачать файл. Попробуй другую ссылку.');
  }
};