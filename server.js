const http = require("http");
const socketIo = require("socket.io");

const server = http.createServer();
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["*"],
    allowedHeaders: ["my-custom-header"],
    credentials: true,
  },
});

const TelegramBot = require("node-telegram-bot-api");
const service = require("./src/service/register.service");
const {
  chunkArray,
  convertToTimeFormat,
  generateId,
  parseTextSimple,
} = require("./src/service/services");

const ownersChatId = ["1831538012", "7185045229"];
const adminChatIds = ["1831538012", "7185045229"];
const myChatId = ["5632648116", "5909376148"];
const token = "6874634713:AAEMZ_dAfQzeMibFqH08A7bks3FXOY7zo80";
const bot = new TelegramBot(token, { polling: true });

bot.on("polling_error", (error) => {
  console.error(`Polling error: ${error}`);
});

let mode = "dev";

const generalCommands = [
  { command: "start", description: "Start" },
  { command: "konkurs", description: "Konkurs" },
];
const adminCommands = [
  { command: "start", description: "Start" },
  {
    command: "shablon",
    description: "Shablon tayyorlash",
  },
  { command: "add_acc", description: "Acc qo'shish" },
  {
    command: "get_all_user",
    description: "Barcha foydalanuvchilar ro'yxatini olish",
  },
  {
    command: "get_user_by_id",
    description: "ID bo'yicha foydalanuvchini topish",
  },
  {
    command: "hisobla",
    description: "Hisoblash",
  },
  {
    command: "top5",
    description: "Top 5",
  },
];
const myCommands = [
  { command: "start", description: "Start" },
  { command: "daily", description: "Daily" },
  { command: "hisobla", description: "Hisobla" },
  { command: "weekly", description: "Weekly" },
  { command: "monthly", description: "Monthly" },
];

const accData = [
  "#V1",
  "#V2",
  "#V3",
  "#V4",
  "#V5",
  "#V6",
  "#V7",
  "#V8",
  "#V9",
  "#V10",
  "#T1",
  "#T2",
  "#T3",
  "#T4",
  "#M1",
  "#M2",
  "#M3",
  "#M4",
  "#M5",
  "#CH1",
  "#CH2",
  "#CH3",
  "#CH4",
];
const myAccs = [
  "#V1",
  "#V3",
  "#V5",
  "#V8",
  "#V10",
  "#T2",
  "#T3",
  "#M1",
  "#M2",
  "#M5",
  "#CH1",
  "#CH2",
  "#CH3",
  "#CH4",
];
const others_accs = [
  "#V2",
  "#V4",
  "#V6",
  "#V7",
  "#V9",
  "#T1",
  "#T4",
  "#M3",
  "#M4",
];

bot.setMyCommands(generalCommands);

let userInfo = {};

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
        inline_keyboard: [[{ text: "Roziman", callback_data: "accept_rules" }]],
      },
      parse_mode: "Markdown",
    };
    if (existUser) {
      const link = `[ATOMIC ARENDA](tg://user?id=${7185045229})`;
      bot.sendMessage(
        chatId,
        "Siz avval ro'yxatdan o'tgandiz qayta ro'yxatdan o'tishingiz shart emas!"
      );
      bot.sendMessage(chatId, `Akkaunt olmoqchi bo'lsangiz ${link} ga yozing`, {
        parse_mode: "Markdown",
      });
    } else {
      bot.sendMessage(chatId, message, options);
    }
  }
});

bot.onText(/\/id (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const id = match[1];
  const user = await service.fetchUserById(id);
  if (user) {
    const link = `[${user.id}](tg://user?id=${user.id})`;
    bot.sendLocation(chatId, user.latitude, user.longitude);
    bot.sendPhoto(chatId, user.photo, {
      caption: `ID: ${link}\nname: ${user?.name}\nphone: ${user.phone}`,
      parse_mode: "Markdown",
    });
  } else {
    bot.sendMessage(chatId, "Foydalanuvchi topilmadi.");
  }
});

bot.onText(/\/app/, (msg) => {
  const chatId = msg.chat.id;
  const webAppUrl = "https://6v9cl48b-5173.euw.devtunnels.ms";
  bot.sendMessage(chatId, "Site ochish uchun pastdagi tugmani bosing:", {
    reply_markup: {
      keyboard: [[{ text: "Platformani ochish", web_app: { url: webAppUrl } }]],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  });
});

let acc_data = {};
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
/acc_info name: '',
description: '',
videoID: '',
price_list: {
'3 soat': '',
'6 soat': '',
'12 soat': '',
'24 soat': '',
'tungi tarif (20.00 - 10.00)': ''
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
  console.log("acc", acc_data);
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

let form = {};
let templateDatas = {};
let callballResult = [];
let answerTopId = 0;
let winners = {};

bot.on("callback_query", async (callbackQuery) => {
  const userId = callbackQuery.from.id;
  const callbackData = callbackQuery.data;

  if (callbackData === "accept_rules") {
    const videoId =
      "BAACAgIAAxkBAAIFBGaT5r4FgLlqSMtnrfALtz9Ob0tjAAIyTgACh6ahSKQrOTJp11PENQQ";
    const msg = `
*SIZDAN TALAB QILINADI👇*\n
*1. 📱 TELEFON RAQAM ✅*\n
*2. 🛂 PASSPORT ✅*\n
*3. 📍LAKATSIYA ✅*\n
*4. 🎥 AKK JAVOBGARLIGINI OLAMAN DEGAN VIDEO✅*\n
_Videoda gapirasiz men (ISM FAMILYA), (Tugilgan Sana)da tug'ilganman, ATOMIC ARENDA dan akk arenda olaman Akkauntga biron nima bolsa hammasini javobgarligini olaman_\n
_Yuqoridagini gapirib bolib passport korsatasiz videoda korinsin_👆\n
*📱45 FPS+ BOLISHI SHART ⚠️*\n
*✅ PROVERKA QILINADI CHIT ANIQLANSA PULIZ QAYTARILMEDI VA BLOCKLANASIZ ❌*\n
`;
    const option = {
      caption: msg,
      parse_mode: "Markdown",
    };
    bot.sendVideo(userId, videoId, option);

    const options = {
      reply_markup: {
        keyboard: [
          [{ text: "Telefon raqamimni ulashish", request_contact: true }],
        ],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
      parse_mode: "Markdown",
    };
    bot.sendMessage(
      userId,
      "*Iltimos yuqoridagi videodagidek telefon raqamingizni ulashing*",
      options
    );
    bot.answerCallbackQuery(callbackQuery.id, {
      text: "Siz barcha qoidalarni qabul qildingiz!",
      show_alert: false,
    });
  }
  if (callbackData?.startsWith("admin_")) {
    const userId = callbackData?.split("_")[2];
    const action = callbackData?.split("_")[1];
    if (action === "accept") {
      const user = userInfo[userId];
      const s = await service.handleAdminResponse(user);
      if (s) {
        const groupChatId = "-1002043732390";
        const link = `[${user?.name}](tg://user?id=${user?.userId})`;
        const adminMessage = `Yangi Registiratsiya:\n— ism: ${user?.name}\n— tel: ${user?.phone}\n— user name: ${link}\n— user ID: ${user?.userId}`;
        bot.sendVideoNote(groupChatId, user?.video_note);
        bot.sendLocation(
          groupChatId,
          user?.location.latitude,
          user?.location.longitude
        );
        bot.sendPhoto(groupChatId, user?.photo, {
          caption: adminMessage,
          parse_mode: "Markdown",
        });
        bot.sendMessage(
          user?.userId,
          "Tabriklaymiz! Sizning ma'lumotlaringiz qabul qilindi."
        );
        sendMessageForSuccess(`Yangi ${link} foydalanuvchi qo'shildi.`);
      } else {
        bot.sendMessage(
          userId,
          "Xatolik yuz berdi. Iltimos qayta urinib ko'ring."
        );
      }
      bot.answerCallbackQuery(callbackQuery.id, {
        text: "foydalanuvchi qabul qilindi!",
        show_alert: false,
      });
    } else if (action === "reject") {
      sendMessageForSuccess(
        `${userId}-nin malumotlarini rad etish sababini shu xabaga javoban yozing.`
      );
      bot.answerCallbackQuery(callbackQuery.id, {
        text: "Habar foydalanuvchiga yetkazildi!",
        show_alert: false,
      });
    }
  }
  if (callbackData.startsWith("acc_number")) {
    const acc_number = callbackData.split("_")[2];
    form[userId] = { ...form[userId], acc_number, order: "time" };
    bot.sendMessage(
      userId,
      "*Vaqtini raqam* _(1/1.5/2)_ *ko'rishinda kiriting:*",
      {
        parse_mode: "Markdown",
      }
    );
    bot.answerCallbackQuery(callbackQuery.id, {
      text: "Akkaunt qabul qilindi!",
      show_alert: false,
    });
  }
  if (callbackData.startsWith("form_")) {
    const us_id = callbackData.split("_")[2];
    const action = callbackData.split("_")[1];

    if (action === "accept" && !ownersChatId.includes(userId.toString())) {
      const user = templateDatas[us_id];

      if (!user) {
        bot.answerCallbackQuery(callbackQuery.id, {
          text: "Foydalanuvchi topilmadi!",
          show_alert: true,
        });
        return;
      }

      const value = {
        acc_number: user.acc_number,
        time: user.time,
        price: user.price,
        userId,
        us_id,
        imgs: user.imgs,
      };

      const s = await service.handleUserResponse(value, adminChatIds, bot);
      const groupChatId = "-1002140035192";
      const formattedValue = user.price.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
      const link = `[${userId}](tg://user?id=${userId})`;
      const adminMessage = `ID: ${link}\nACC: ${
        user.acc_number
      }\nVAQTI: ${convertToTimeFormat(
        user.time
      )}\n\nNARXI: ${formattedValue} so'm`;

      if (s) {
        bot.answerCallbackQuery(callbackQuery.id, {
          text: "Haridingiz uchun rahmat 😊",
          show_alert: true,
        });
        if (user.imgs && user.imgs.length > 1) {
          const media = user.imgs.map((img, index) => ({
            type: "photo",
            media: img,
            caption: index === 0 ? adminMessage : "",
            parse_mode: "Markdown",
          }));
          bot.sendMediaGroup(groupChatId, media);
          templateDatas[us_id] = {};
        } else {
          bot.sendPhoto(groupChatId, user.imgs[0], {
            caption: adminMessage,
            parse_mode: "Markdown",
          });
          templateDatas[us_id] = {};
        }
      } else {
        bot.answerCallbackQuery(callbackQuery.id, {
          text: "Harid shabloni allaqachon ishlatilgan!",
          show_alert: true,
        });
      }
    } else {
      bot.answerCallbackQuery(callbackQuery.id, {
        text: "Siz haridor emassiz!",
        show_alert: true,
      });
    }
  }
  if (callbackData.startsWith("hisobla")) {
    const acc_number = callbackData.split("_")[1];
    let percent;
    switch (acc_number) {
      case "#V5":
        percent = 1;
        break;
      case "#V7":
        percent = 1;
        break;
      case "#T4":
        percent = 1;
        break;
      default:
        percent = 1;
        break;
    }
    const total_price1 = await service.calcPriceByAcc(acc_number);
    const total_price = total_price1
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    const moneyForOwner = (parseInt(total_price1) * percent)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    bot.sendMessage(
      userId,
      `*Sizning akkauntingiz ${acc_number}👇*\n\n*JAMI: ${total_price} so'm 🧾*\n\n*AKK EGASIGA: ${moneyForOwner} so'm ✅*`,
      { parse_mode: "Markdown" }
    );
    bot.answerCallbackQuery(callbackQuery.id, {
      text: `${acc_number} - ACCga oid mablag' hisoblangi!`,
      show_alert: false,
    });
  }
  if (callbackData.startsWith("konkurs_")) {
    const action = callbackData.split("_")[1];
    const type = callbackData.split("_")?.[2];
    if (action === "cancel") {
      answerTopId = callbackQuery.message.message_id;
      bot.sendMessage(
        userId,
        "Yangi ro'yxat uchun 5 ta ID ro'yxati (,) bilan yozib jo'nating!"
      );
      bot.answerCallbackQuery(callbackQuery.id, {
        text: "Ro'yxat bekor qilindi!",
        show_alert: true,
      });
    } else {
      const ids = Object.values(winners)
        .sort((a, b) => a?.rank - b?.rank)
        .map((item) => item?.user_id);
      const message = ids.map((user, index) => {
        const formattedID = user.toString().replace(/(\d{6})\d{2}/, "$1**");
        const link = `[${formattedID}](tg://user?id=${formattedID})`;
        return `*${index + 1}.* *ID:* ${link}`;
      });
      checkWinners(ids, userId, message, type);
      bot.answerCallbackQuery(callbackQuery.id, {
        text: `${type} 5 tasdiqlandi!`,
        show_alert: false,
      });
    }
  }
});

bot.on("message", async (msg) => {
  const chatId = msg.from.id;
  const userId = msg.from.id;
  const command = msg.text;
  if (
    ownersChatId?.includes(userId.toString()) ||
    myChatId?.includes(userId.toString())
  ) {
    if (command === "/get_all_user") {
      const results = await service.fetchAllUsers(chatId);
      if (!results.length) {
        bot.sendMessage(chatId, "Foydalanuvchilar topilmadi.");
      } else {
        results.forEach((user, index) => {
          const link = `[${user?.id}](tg://user?id=${user.id})`;
          bot.sendMessage(
            chatId,
            `${index + 1}. ID: ${link}\nUsername: ${user?.username}\nPhone: ${
              user.phone
            }`,
            { parse_mode: "Markdown" }
          );
        });
      }
    }
    if (command === "/get_user_by_id") {
      bot.sendMessage(
        chatId,
        "*Iltimos ID raqamini (/id 0000000) sifatida yuboring:*",
        { parse_mode: "Markdown" }
      );
    }
    if (command === "/shablon") {
      form[chatId] = {};
      const chunkedAccData = chunkArray(accData, 5);
      bot.sendMessage(chatId, "*Akkaunt tanlang:*", {
        reply_markup: {
          inline_keyboard: chunkedAccData.map((chunk) =>
            chunk.map((acc) => ({
              text: acc,
              callback_data: `acc_number_${acc}`,
            }))
          ),
        },
        parse_mode: "Markdown",
      });
    }
    if (command === "/hisobla") {
      const chunkedAccData = chunkArray(accData, 5);
      bot.sendMessage(chatId, "Qaysi akkauntni hisoblamoqchisiz?", {
        reply_markup: {
          inline_keyboard: chunkedAccData.map((chunk) =>
            chunk.map((acc) => ({
              text: acc,
              callback_data: `hisobla_${acc}`,
            }))
          ),
        },
      });
    }
    if (command === "/top5") {
      const top5 = await service.rankUsersByTotalPayments();
      if (!top5.length) {
        bot.sendMessage(chatId, "Foydalanuvchilar topilmadi.");
      } else {
        const message = top5.map((user, index) => {
          const link = `[${user?.user_id}](tg://user?id=${user.user_id})`;
          winners[user?.user_id] = user;
          return `${index + 1}. ID: ${link} - ${user?.total_spent} so'm`;
        });
        const options = {
          reply_markup: {
            inline_keyboard: [
              [
                { text: "❌", callback_data: "konkurs_cancel_Top" },
                { text: "✅", callback_data: "konkurs_accept_Top" },
              ],
            ],
          },
          parse_mode: "Markdown",
        };
        bot.sendMessage(
          chatId,
          [
            "*Eng ko'p acc olgan TOP 5 talik *👇\n",
            ...message,
            "\n*Buni tasdiqlaysizmi ?*",
          ].join("\n"),
          options
        );
      }
    }
    if (command === "/random") {
      const randomWinners = await service.getRandomIdsExcludingTop5();

      console.log(randomWinners);
      if (!randomWinners.length) {
        bot.sendMessage(chatId, "Foydalanuvchilar topilmadi.");
      } else {
        const message = randomWinners.map((user, index) => {
          const link = `[${user}](tg://user?id=${user})`;
          winners[user] = { user_id: user };
          return `${index + 1}. ID: ${link}`;
        });
        const options = {
          reply_markup: {
            inline_keyboard: [
              [
                { text: "❌", callback_data: "konkurs_cancel_Random" },
                { text: "✅", callback_data: "konkurs_accept_Random" },
              ],
            ],
          },
          parse_mode: "Markdown",
        };
        bot.sendMessage(
          chatId,
          [
            "*Random tanlov natijasi*👇\n",
            ...message,
            "\n*Buni tasdiqlaysizmi ?*",
          ].join("\n"),
          options
        );
      }
    }
  }
  if (myChatId?.includes(userId.toString())) {
    if (command === "/daily") {
      try {
        const earnings = await service.calcEarnings(
          myAccs,
          others_accs,
          "daily"
        );
        const earningsMessage1 = myAccs
          .map(
            (acc) =>
              `*${acc} — ${
                earnings[`total_price_${acc.slice(1).toLowerCase()}`]
              } so'm🧾*`
          )
          .join("\n\n");
        const earningsMessage2 = others_accs
          .map(
            (acc) =>
              `*${acc} — ${
                earnings[`total_price_${acc.slice(1).toLowerCase()}`]
              } so'm🧾*`
          )
          .join("\n\n");
        const finalMessage = `
          *DAILY PROFIT👇*\n\n${earningsMessage2}\n➖➖➖➖➖➖➖➖➖➖\n*OTHERS' PROFIT — ${earnings.others_total} so'm👌*\n*MY PROFIT — ${earnings.summed_others_accs} so'm👌*\n➖➖➖➖➖➖➖➖➖➖\n${earningsMessage1}\n*➖➖➖➖➖➖➖➖➖➖*\n*FROM MY ACCS — ${earnings.my_accs} so'm🔥*\n*➖➖➖➖➖➖➖➖➖➖*\n* 💰MINE: ${earnings.MyTotalProfit} so'm✅ *\n*   💰ALL: ${earnings.Total_Profit} so'm✅ *
        `;

        bot.sendMessage(chatId, finalMessage, { parse_mode: "Markdown" });
      } catch (error) {
        console.error("Error calculating daily earnings:", error);
        bot.sendMessage(
          chatId,
          "Kunlik daromadlarni hisoblashda xatolik yuz berdi."
        );
      }
    }

    if (command === "/weekly") {
      try {
        const earnings = await service.calcEarnings(
          myAccs,
          others_accs,
          "weekly"
        );
        const earningsMessage1 = myAccs
          .map(
            (acc) =>
              `*${acc} — ${
                earnings[`total_price_${acc.slice(1).toLowerCase()}`]
              } so'm🧾*`
          )
          .join("\n\n");
        const earningsMessage2 = others_accs
          .map(
            (acc) =>
              `*${acc} — ${
                earnings[`total_price_${acc.slice(1).toLowerCase()}`]
              } so'm🧾*`
          )
          .join("\n\n");
        const finalMessage = `
          *WEEKLY PROFIT👇*\n\n${earningsMessage2}\n➖➖➖➖➖➖➖➖➖➖\n*OTHERS' PROFIT — ${earnings.others_total} so'm👌*\n*MY PROFIT — ${earnings.summed_others_accs} so'm👌*\n➖➖➖➖➖➖➖➖➖➖\n${earningsMessage1}\n*➖➖➖➖➖➖➖➖➖➖*\n*FROM MY ACCS — ${earnings.my_accs} so'm🔥*\n*➖➖➖➖➖➖➖➖➖➖*\n* 💰MINE: ${earnings.MyTotalProfit} so'm✅ *\n*   💰ALL: ${earnings.Total_Profit} so'm✅ *
        `;

        bot.sendMessage(chatId, finalMessage, { parse_mode: "Markdown" });
      } catch (error) {
        console.error("Error calculating weekly earnings:", error);
        bot.sendMessage(
          chatId,
          "Haftalik daromadlarni hisoblashda xatolik yuz berdi."
        );
      }
    }

    if (command === "/monthly") {
      try {
        const earnings = await service.calcEarnings(
          myAccs,
          others_accs,
          "monthly"
        );
        const earningsMessage1 = myAccs
          .map(
            (acc) =>
              `*${acc} — ${
                earnings[`total_price_${acc.slice(1).toLowerCase()}`]
              } so'm🧾*`
          )
          .join("\n\n");
        const earningsMessage2 = others_accs
          .map(
            (acc) =>
              `*${acc} — ${
                earnings[`total_price_${acc.slice(1).toLowerCase()}`]
              } so'm🧾*`
          )
          .join("\n\n");
        const finalMessage = `
        *MONTHLY PROFIT👇*\n\n${earningsMessage2}\n➖➖➖➖➖➖➖➖➖➖\n*OTHERS' PROFIT — ${earnings.others_total} so'm👌*\n*MY PROFIT — ${earnings.summed_others_accs} so'm👌*\n➖➖➖➖➖➖➖➖➖➖\n${earningsMessage1}\n*➖➖➖➖➖➖➖➖➖➖*\n*FROM MY ACCS — ${earnings.my_accs} so'm🔥*\n*➖➖➖➖➖➖➖➖➖➖*\n* 💰MINE: ${earnings.MyTotalProfit} so'm✅ *\n*   💰ALL: ${earnings.Total_Profit} so'm✅ *
      `;

        bot.sendMessage(chatId, finalMessage, { parse_mode: "Markdown" });
      } catch (error) {
        console.error("Error calculating monthly earnings:", error);
        bot.sendMessage(
          chatId,
          "Oylik daromadlarni hisoblashda xatolik yuz berdi."
        );
      }
    }
  }
  if (command === "/konkurs") {
    const s = await service.fetchWinner(chatId);
    if (s) {
      bot.sendMessage(
        chatId,
        `Tabriklaymiz! Siz random tanlovda g'olib bo'ldingiz va ${s?.prize_time} soatga akkaunt olasiz!`
      );
    } else {
      bot.sendMessage(chatId, "Siz g'olib bo'lmadingiz!");
    }
  }

  if (msg?.web_app_data?.data) {
    console.log("web_app_data", msg.web_app_data.data);
    const ds = {
      start_hour: "19:43",
      time: "3 soat",
      price: 30000,
      accNumber: "VIP ACC #1",
      description: "TOP MOP OLD FOLD",
      videoId: "fddf",
      acc_price: 100000,
    };

    const data = JSON.parse(msg.web_app_data.data);
    bot.sendMessage(chatId, `Xaridingiz uchun rahmat!`);
    bot.sendMessage(
      chatId,
      `Sizning buyurtmangiz: \nacc: ${data.accNumber} \nprice: ${
        data.price
      } \nstart: ${new Date().getFullYear()}.${data.month
        ?.toString()
        .padStart(2, "0")}.${data.day?.toString().padStart(2, "0")} - ${
        data.start_hour
      }\ndavomiyligi: ${data.time}`
    );
  }
});

bot.on("text", async (msg) => {
  const chatId = msg.from.id;
  const userId = msg.from.id;
  const msdId = msg.message_id;
  const isReply = msg.reply_to_message?.text || null;
  const us = form?.[chatId] || {};
  const messageText = msg.text;
  const isNumeric = /^\d+$/.test(messageText);
  const value = messageText.replace(/[^\d.]/g, "");
  if (ownersChatId?.includes(userId.toString())) {
    if (us?.order === "time" && isNumeric) {
      form[chatId] = { ...form[chatId], time: value, order: "price" };
      bot.sendMessage(
        chatId,
        `* Vaqt: ${convertToTimeFormat(value)} *\n * Endi To'lovni Kiriting:*`,
        { parse_mode: "Markdown" }
      );
    }
    if (us?.order === "price" && isNumeric) {
      form[chatId] = { ...form[chatId], price: value, order: "photo" };
      bot.sendMessage(chatId, "*Iltimos to'lov checkini yuboring*", {
        parse_mode: "Markdown",
      });
    }
    if (isReply && msdId + 1 === answerTopId) {
      const user_id = isReply.match(/\d+/)[0];
      bot.sendMessage(
        user_id,
        `*Kechirasiz, Sizning ma'lumotlaringiz qabul qilinmadi. Qayta urinib ko'ring* /start.`,
        { parse_mode: "Markdown" }
      );
      bot.sendMessage(user_id, msg.text);
    }
    if (msdId - 2 === answerTopId) {
      const type = messageText?.split("/");
      const ids = type?.[1]?.split(",");
      const message = ids.map((user, index) => {
        const formattedID = user.replace(/(\d{6})\d{2}/, "$1**");
        const link = `[${formattedID}](tg://user?id=${formattedID})`;
        return `*${index + 1}.* *ID:* ${link}`;
      });
      checkWinners(ids, chatId, message, type);
    }
  }
});

bot.on("inline_query", (query) => {
  const queryId = query.id;
  const queryText = query.query;
  const userId = query.from.id;

  if (adminChatIds.includes(userId.toString())) {
    if (queryText === "") {
      bot.answerInlineQuery(queryId, []);
    } else {
      const uniqueCallballResult = callballResult.map((result, index) => ({
        ...result,
        id: `${result.id}-${queryId}-${index}`,
      }));
      const filteredResults = uniqueCallballResult.filter((result) => {
        return result.title.includes(queryText);
      });
      bot.answerInlineQuery(queryId, filteredResults);
    }
  }
});

bot.on("contact", (msg) => {
  const chatId = msg.chat.id;
  if (msg.contact.phone_number) {
    userInfo[chatId] = { ...userInfo[chatId], phone: msg.contact.phone_number };
    bot.sendMessage(chatId, "*Passportingizning rasmni yuboring.*", {
      parse_mode: "Markdown",
    });
  } else {
    bot.sendMessage(
      chatId,
      "*Mos bo'lmagan telefon raqami!*\nIltimos *Telefon raqamimni ulashish* tugmasi orqali telefon raqamingizni ulashing ulashing.",
      { parse_mode: "Markdown" }
    );
  }
});

const timers = {};
bot.on("photo", (msg) => {
  const chatId = msg.chat.id;
  const img = msg.photo[msg.photo.length - 1].file_id;
  if (ownersChatId.includes(chatId.toString())) {
    if (mode === "dev") {
      form[chatId] = {
        ...form[chatId],
        imgs: [...(form[chatId]?.imgs || []), img],
      };
      const us = form?.[chatId] || {};
      const createMessage = (id) => {
        bot.sendMessage(
          chatId,
          `Harid shabloni tayyor va  \`@ATOMIC_RENT_BOT ${id}\` kaliti bilan saqlandi!`,
          { parse_mode: "Markdown" }
        );

        templateDatas[id] = form[chatId];
        form[chatId] = {};
        const formattedValue = us?.price?.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        const forma = `Sizning buyurtmangiz:\n\nACC — ${
          us?.acc_number
        }\nVAQT — ${convertToTimeFormat(
          us?.time
        )} ga\nNARX — ${formattedValue} so'm\n\nAKKAUNT JAVOBGARLIGINI OLASIZMI?`;

        callballResult.push({
          type: "article",
          id: "1",
          title: id,
          input_message_content: { message_text: forma },
          description: "Buyurtma shabloni",
          reply_markup: {
            inline_keyboard: [
              [{ text: "Ha, ROZIMAN✅", callback_data: `form_accept_${id}` }],
            ],
          },
          parse_mode: "Markdown",
        });
      };

      if (timers[chatId] && timers[chatId] !== null) {
        clearTimeout(timers[chatId]);
        timers[chatId] = null;
        createMessage(generateId());
      } else {
        timers[chatId] = setTimeout(() => {
          createMessage(generateId());
          timers[chatId] = null;
        }, 750);
      }
    } else {
      if (acc_data.imgs?.length === 3) {
        acc_data.imgs = [...(acc_data?.imgs || []), img];
        bot.sendMessage(chatId, "Rasmlar muvoffaqiyatli qo'shildi!");
        const arrayWith30interinden = Array.from(
          { length: 31 },
          (_, i) => `${i + 1}`
        );
        bot.sendMessage(
          chatId,
          `Endi 1 oy uchun kunlik narxlar to'plamini ko'rsatilganidek \`/daily_price_list ${JSON.stringify(
            arrayWith30interinden
          )}\` jo'nating!`,
          {
            parse_mode: "Markdown",
          }
        );
      } else {
        acc_data.imgs = [...(acc_data?.imgs || []), img];
      }
    }
  } else {
    userInfo[chatId] = {
      ...userInfo[chatId],
      photo: img,
      name: msg.chat.first_name,
    };

    const options = {
      reply_markup: {
        keyboard: [[{ text: "Locatsiyamni ulashish", request_location: true }]],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
      parse_mode: "Markdown",
    };
    return bot.sendMessage(
      chatId,
      "*Iltimos shaxsiy Locatsiyangizni ulang:*",
      options
    );
  }
});

bot.on("location", (msg) => {
  const chatId = msg.chat.id;
  userInfo[chatId] = { ...userInfo[chatId], location: msg.location };
  bot.sendMessage(
    chatId,
    `Iltimos endi AKK JAVOBGARLIGINI OLAMAN degan video jo'nating, videoda gapirasiz:\n\n> Men, Ism Familiya, Tugilgan Sana, da tug'ilganman, ATOMIC ARENDA dan akk arenda olaman Akkauntga biron nima bolsa hammasini javobgarligini olaman\n
    `,
    {
      parse_mode: "MarkdownV2",
    }
  );
});

bot.on("video_note", (msg) => {
  const chatId = msg.chat.id;
  userInfo[chatId] = {
    ...userInfo[chatId],
    video_note: msg.video_note.file_id,
    username: msg.from.username || null,
    userId: msg.from.id,
  };
  const link = `[${msg.from.first_name}](tg://user?id=${msg.from.id})`;

  const user = userInfo[chatId];
  const adminMessage = `Yangi Registiratsiya:\n— ism: ${user?.name}\n— tel: ${user?.phone}\n— user name: ${link}\n— user ID: ${user?.userId}`;
  sendMessagesToAdmins(user, adminMessage, true);
  bot.sendMessage(
    chatId,
    "Barcha malumotlaringiz ko'rib chiqilmoqda. Iltimos admin tasdiqlashini kuting!"
  );
});

bot.on("video", (msg) => {
  const chatId = msg.chat.id;
  if (!ownersChatId.includes(chatId.toString())) {
    bot.sendMessage(
      chatId,
      "*Iltimos video emas video xabar jo'nating jo'nating!*",
      { parse_mode: "Markdown" }
    );
  }
});

bot.on("voice", (msg) => {
  const chatId = msg.chat.id;
  const isReply = msg.reply_to_message?.text || null;
  if (isReply && ownersChatId.includes(chatId.toString())) {
    const user_id = isReply.match(/\d+/)[0];
    bot.sendMessage(
      user_id,
      `*Kechirasiz, Sizning ma'lumotlaringiz qabul qilinmadi. Qayta urinib ko'ring* @/start.`,
      { parse_mode: "Markdown" }
    );
    bot.sendVoice(user_id, msg.voice.file_id);
  }
});

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

// user response
const controller = require("./src/controller/user.controller");
io.on("connection", (socket) => {
  socket.on("/all_accs", async (data) => {
    console.log("data", data);

    const allAccs = await controller.getAllAccs();
    socket.emit("/all_accs", allAccs);
  });
});

server.listen(83, () => {
  console.log(`server is running on port 83`);
});

module.exports = bot;
