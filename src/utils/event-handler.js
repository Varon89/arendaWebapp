const {
  adminCommands,
  myCommands,
  generalCommands,
} = require("../mocks/mocks");
const { myChatId, ownersChatId } = require("../mocks/security");
const service = require("../service/register.service");
const { parseTextSimple, generateId } = require("../utils/services");

const setupEventHandlers = (bot) => {
  if (!bot) {
    throw new Error("Bot or service is not provided correctly.");
  }

  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const userID = msg.from.id;

    if (ownersChatId.includes(userID.toString())) {
      bot.setMyCommands(adminCommands, {
        scope: { type: "chat", chat_id: chatId },
      });
      bot.sendMessage(chatId, "Assalomu alaykum, Admin!");
    } else if (myChatId.includes(userID.toString())) {
      bot.setMyCommands(myCommands, {
        scope: { type: "chat", chat_id: chatId },
      });
      bot.sendMessage(chatId, "Assalomu alaykum, User!");
    } else {
      bot.setMyCommands(generalCommands, {
        scope: { type: "chat", chat_id: chatId },
      });
      const existUser = await service.checkIfRegistered(chatId);
      const message = `
\n*📌 DIQQAT📌*\n
*❗️FAQAT IOS/ANDROID ✅*\n
*❌EMULYATOR TAQIQLANADI❌*\n
*❗️AKKAUNTDAN CHIQIB KETISH MUMKIN EMAS 📌*\n
_Qaytib kirish niyatiz yoq bolsa yoki vaqtiz tugagandagina chiqing boshqa holatda chiqib ketib qolsangiz qayta pullik. Internetiz stabilniy bolsa oling faqat! internet ishlamay qolib chiqib ketsangiz bizda emas ayb!_\n
*✅ NICK OZGARTIRISH MUMKIN ADMINDAN SORAB ✅*\n
*❗️CHIT BILAN OYNASH TAQIQLANADI📌*\n
*✅ PROVERKA QILINADI CHIT ANIQLANSA PULIZ QAYTARILMEDI VA BLOCKLANASIZ ❌*\n
*⚠️AKKAUNT SIZ OYNAGAN VAQT ICHIDA BANGA KIRSA SIZ MAMURIY/JINOIY JAVOBGARLIKGA TORTILASIZ ⚠️⚠️⚠️*\n
  `;
      const options = {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Roziman", callback_data: "accept_rules" }],
          ],
        },
        parse_mode: "Markdown",
      };
      if (existUser) {
        const link = `[ATOMIC ARENDA](tg://user?id=${7185045229})`;
        bot.sendMessage(
          chatId,
          "Siz avval ro'yxatdan o'tgandiz qayta ro'yxatdan o'tishingiz shart emas!"
        );
        bot.sendMessage(
          chatId,
          `Akkaunt olmoqchi bo'lsangiz ${link} ga yozing`,
          {
            parse_mode: "Markdown",
          }
        );
      } else {
        bot.sendMessage(chatId, message, options);
      }
    }
  });

  bot.onText(/\/id (.+)/, async (msg, match) => {    
    const chatId = msg.chat.id;
    const id = match[1];

    try {
      const user = await service.fetchUserById(id);
      if (user) {
        const link = `[${user.user_id}](tg://user?id=${user.user_id})`;

        if (user.latitude && user.longitude) {
          bot.sendLocation(chatId, user.latitude, user.longitude);
        }

        const caption = `*User ID*: ${link}\n*Name*: ${user.username || 'no name'}\n*Phone*: ${user.phone}`;

        bot.sendMessage(chatId, caption, { parse_mode: 'Markdown' });
        try {
          bot.sendPhoto(chatId, user?.photo);
        } catch (error) {
          console.log('Error while sending photo:', error);
          bot.sendMessage(chatId, 'Xatolik yuz berdi. Rasm yuborishda xatolik.');
        }
      } else {
        bot.sendMessage(chatId, "Foydalanuvchi topilmadi.");
      }
    } catch (error) {
      console.error("Error while sending user data:", error);
      bot.sendMessage(chatId, "Xatolik yuz berdi.");
    }
  });




  bot.onText(/\/app/, (msg) => {
    const chatId = msg.chat.id;
    const webAppUrl =
      "https://1kbcc75s-5173.euw.devtunnels.ms?chatId=" + chatId;
    bot.sendMessage(chatId, "Site ochish uchun pastdagi tugmani bosing:", {
      reply_markup: {
        keyboard: [
          [{ text: "Platformani ochish", web_app: { url: webAppUrl } }],
        ],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });
  });

  bot.onText(/\/add_acc/, (msg) => {
    const chatId = msg.chat.id;
    mode = "add";

    bot.sendMessage(chatId, "Accaount qo'shish modi faollashtirildi!");
    bot.sendMessage(
      chatId,
      "Accaount qo'shish uchun quyida ko'rsatilgan malumotlarni ko'rsatilgandek qilib qo'shing:"
    );
    const accDataMsg = `
\`\`\`
/acc_info
name: '',
description: '',
videoID: '',
price_list: {
'3 soat': '',
'6 soat': '',
'12 soat': '',
'24 soat': '',
'Tungi Tarif (20.00 - 10.00)': ''
}
\`\`\`
`;

    bot.sendMessage(chatId, accDataMsg, { parse_mode: "Markdown" });
  });

  bot.onText(/\/acc_info/, (msg) => {
    const chatId = msg.chat.id;
    const msgText = msg.text;
    acc_data = parseTextSimple(msgText);
    bot.sendMessage(chatId, "Accaount ma'lumotlari muvaffaqiyatli qo'shildi!");
    bot.sendMessage(chatId, "Endi 4 ta rasm yuboring!");
  });

  bot.onText(/\/daily_price_list (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const daily_price_list = JSON.parse(match[1]);
    acc_data = { ...acc_data, daily_price_list };
    bot.sendMessage(chatId, "Daily price list muvaffaqiyatli qo'shildi!");
    bot.sendMessage(
      chatId,
      "Accaount qo'shishni yakunlash uchun /end ni bosing!"
    );
  });

  bot.onText(/\/end/, (msg) => {
    const chatId = msg.chat.id;
    const id = generateId();
    if (!acc_data?.price_list) {
      return bot.sendMessage(chatId, "Accaount ma'lumotlari to'liq emas!");
    }
    const s = service.addAcc(acc_data, id);
    if (s) {
      mode = "dev";
      acc_data = {};
      return bot.sendMessage(chatId, "Accaount muvaffaqiyatli qo'shildi!");
    } else {
      mode = "dev";
      acc_data = {};
      return bot.sendMessage(
        chatId,
        "Xatolik yuz berdi. Iltimos qayta urinib ko'ring!"
      );
    }
  });

  bot.onText(/\/my_id/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, `Sizning id raqamingiz: \`${chatId}\``, {
      parse_mode: "Markdown",
    });
  });

  bot.onText(/\/test/, async (msg) => {
    const chatId = msg.chat.id;
    // const user = {
    //   user_id: "5750925866",
    //   acc_id: "128506",
    //   paid: "180000",
    //   time: 1,
    //   start_time: "09.28 - 00:00",
    //   shablon_id: "100000",
    //   imgs: '["AgACAgIAAxkBAAIDvmbtZzeqw8rEZ77TUNIdl11oKUVRAAJ_6jEbrU5xS5lgCa7DYUAZAQADAgADeQADNgQ"]',
    // };
    // const s = await service.handleUserResponse(user);
    // if (s) {
    //   bot.sendMessage(chatId, "Process successfully completed!");
    // } else {
    //   bot.sendMessage(chatId, "Process failed!");
    // }
  });
};

module.exports = {
  setupEventHandlers,
};
