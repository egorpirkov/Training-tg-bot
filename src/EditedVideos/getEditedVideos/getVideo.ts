import TelegramBot from "node-telegram-bot-api";

const adminChatId = 8088541468;//мой айди
const waitingForVideo = new Set<number>();//хранитель айдишников юзеров

export function getVideoHandler(bot: TelegramBot) {
    bot.onText(/\/sendedit/i, (msg) => {
        const chatId = msg.chat.id;
        waitingForVideo.add(chatId);
        //Этот пользователь (с таким chatId) сейчас
        // в состоянии ожидания — он должен прислать видео

        bot.sendMessage(chatId, "Отправь свой эдит, и я передам его администратору.");
    });

    bot.on("message", async (msg) => {
        const chatId = msg.chat.id;

        if (waitingForVideo.has(chatId)) {
            if (msg.video || msg.document) {
                await bot.sendMessage(
                    adminChatId,
                    `Пользователь @${msg.from?.username || msg.from?.id} прислал видео`
                )

                await bot.forwardMessage(adminChatId, chatId, msg.message_id);
                                        //я,айди юзера,айди сообщения
                bot.sendMessage(chatId, 'Видео успешно отправлено администратору!');
                waitingForVideo.delete(chatId);//бот больше не ждет видео от юзера
            } else if (!msg.text?.match(/^\/sendedit/i)) {
                bot.sendMessage(chatId, 'Ожидается именно видео')
            }
        }
    })
}