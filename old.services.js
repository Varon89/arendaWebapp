const { adminChatIds } = require("./src/mocks/security");

const sendMessagesToAdmins = async (user, adminMessage, k = false) => {
  for (const adminChatId of adminChatIds) {
    try {
      await bot.sendVideoNote(adminChatId, user?.video_note);
    } catch (error) {
      continue;
    }

    try {
      await bot.sendLocation(
        adminChatId,
        user?.location?.latitude,
        user?.location?.longitude
      );
    } catch (error) {
      continue;
    }

    try {
      const options = {
        caption: adminMessage,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "✅ ✅ ✅",
                callback_data: `admin_accept_${user?.userId}`,
              },
              {
                text: "❌ ❌ ❌",
                callback_data: `admin_reject_${user?.userId}`,
              },
            ],
          ],
        },
        parse_mode: "Markdown",
      };
      await bot.sendPhoto(
        adminChatId,
        user?.photo,
        k
          ? options
          : {
              caption: adminMessage,
              parse_mode: "Markdown",
            }
      );
    } catch (error) {
      continue;
    }
  }
};

const sendMessageForSuccess = async (adminMessage) => {
  for (const adminChatId of adminChatIds) {
    try {
      await bot.sendMessage(adminChatId, adminMessage, {
        parse_mode: "Markdown",
      });
    } catch (error) {
      continue;
    }
  }
};

const checkWinners = async (ids, chatId, message, type = null) => {
  try {
    for (const [i, id] of ids.entries()) {
      try {
        const user = winners?.[id] || { user_id: id, total_spent: 0 };
        const prizeTime =
          type === "Top"
            ? { 1: 36, 2: 24, 3: 12, 4: 6, 5: 6 }
            : { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3 };
        const result = await service.addUserToWinnersList({
          ...user,
          prize_time: prizeTime[i + 1],
          rank_user: i + 1,
        });
        if (result) {
          try {
            await bot.sendMessage(
              id,
              `*Tabriklaymiz🎉🎉👏*\n\n*Siz konkursda g'olib bo'lib ${
                prizeTime[i + 1]
              } soatga free akk yutib oldingiz!*\n\n*YUTUQNI OLISH UCHUN*👇\n*✍️ @ARENDA_ATOMIC ✅*`,
              { parse_mode: "Markdown" }
            );
            winners[id] = {};
          } catch (error) {
            console.error(`${id} kişisine mesaj gönderilemedi`);
          }
        }
      } catch (error) {
        console.error("ID error", error);
        await bot.sendMessage(chatId, "ID raqamlarini to'g'ri yozing!");
      }
    }

    await bot.sendMessage(
      chatId,
      [
        "*G'oliblar ro'yxati👇*\n",
        ...message,
        `\n*YUTUQNI OLISH UCHUN👇*\n*✍️ @ARENDA_ATOMIC ✅*`,
      ].join("\n"),
      { parse_mode: "Markdown" }
    );
    setTimeout(() => {
      winners = {};
    }, 1000);
  } catch (error) {
    console.error("Error sending winners list:", error);
    await bot.sendMessage(chatId, "ID raqamlarini to'g'ri yozing!");
  }
};
