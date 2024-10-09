const http = require("http");
const socketIo = require("socket.io");
const TelegramBot = require("node-telegram-bot-api");
const service = require("./src/service/register.service");
const u_service = require("./src/service/user.service");
const { setupSendMessages } = require("./src/utils/response");
const photoHandler = require("./src/utils/photo-handler");

const {
  generalCommands,
  accData,
  myAccs,
  others_accs,
} = require("./src/mocks/mocks");
const {
  token,
  ownersChatId,
  adminChatIds,
  myChatId,
} = require("./src/mocks/security");
const {
  chunkArray,
  convertToTimeFormat,
  generateId,
} = require("./src/utils/services");
const handler = require("./src/utils/event-handler");
const path = require("path");
const fs = require("fs");

let mode = {};
let userInfo = {};
let acc_data = {};
let form = {};
let templateDatas = {};
let callballResult = [];
let answerTopId = 0;
let winners = {};
let orderMsg = {};

const server = http.createServer((req, res) => {
  let filePath = path.join(__dirname, "imgs", req.url);
  const safePath = path.normalize(filePath).startsWith(path.join(__dirname, "imgs"));
  if (!safePath) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    res.end("403 Forbidden");
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("404 Not Found");
      return;
    }

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("500 Internal Server Error");
        return;
      }

      res.writeHead(200, { "Content-Type": "image/jpeg" });
      res.end(content);
    });
  });
});

const io = socketIo(server, {
  transports: ["websocket", "polling"],
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const bot = new TelegramBot(token, { polling: true });
const {
  sendMessagesToAdmins,
  checkWinners,
  sendMessageForSuccess,
  sendMessage,
  sendPhoto,
  sendMediaGroup,
  sendVideoNote,
  sendLocation,
} = setupSendMessages(bot, winners);
bot.setMyCommands(generalCommands);

bot.on("polling_error", (error) => {
  console.error(`Polling error: ${error}`);
});

handler.setupEventHandlers(bot);

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
    sendMessage(
      userId,
      "*Iltimos yuqoridagi videodagidek telefon raqamingizni ulashing*",
      options
    );
    bot.answerCallbackQuery(callbackQuery.id, {
      text: "Siz barcha qoidalarni qabul qildingiz!",
      show_alert: false,
    });
  } else if (callbackData?.startsWith("admin_")) {
    const userId = callbackData?.split("_")[2];
    const action = callbackData?.split("_")[1];
    if (action === "accept") {
      const user = userInfo[userId];
      const s = await service.handleAdminResponse(user);
      if (s) {
        const groupChatId = "-1002043732390";
        const link = `[${user?.name}](tg://user?id=${user?.userId})`;
        const adminMessage = `Yangi Registiratsiya:\n— ism: ${user?.name}\n— tel: ${user?.phone}\n— user name: ${link}\n— user ID: ${user?.userId}`;
        sendVideoNote(groupChatId, user?.video_note);
        sendLocation(
          groupChatId,
          user?.location.latitude,
          user?.location.longitude
        );
        sendPhoto(groupChatId, user?.photo, {
          caption: adminMessage,
          parse_mode: "Markdown",
        });
        sendMessage(
          user?.userId,
          "Tabriklaymiz! Sizning ma'lumotlaringiz qabul qilindi."
        );
        sendMessageForSuccess(`Yangi ${link} foydalanuvchi qo'shildi.`);
      } else {
        sendMessage(userId, "Xatolik yuz berdi. Iltimos qayta urinib ko'ring.");
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
  } else if (callbackData.startsWith("acc_number")) {
    const acc_number = callbackData.split("_")[2];
    form[userId] = { ...form[userId], acc_number, order: "time" };
    sendMessage(userId, "*Vaqtini raqam* _(1/1.5/2)_ *ko'rishinda kiriting:*", {
      parse_mode: "Markdown",
    });
    bot.answerCallbackQuery(callbackQuery.id, {
      text: "Akkaunt qabul qilindi!",
      show_alert: false,
    });
  } else if (callbackData.startsWith("form_")) {
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

      const date = new Date();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");

      const value = {
        user_id: userId,
        acc_id: user.acc_number,
        paid: user.price,
        time: user.time,
        start_time: `${month}.${day} - ${date.getHours()}:${date.getMinutes()}`,
        shablon_id: generateId(),
        imgs: user.imgs,
      };


      const s = await service.handleUserResponse(value);
      const groupChatId = "-1002140035192";
      const formattedValue = user?.price?.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
      const link = `[${userId}](tg://user?id=${userId})`;
      const adminMessage = `ID: ${link}\nACC: ${user.acc_number
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
          sendMediaGroup(groupChatId, media);
          templateDatas[us_id] = {};
        } else {
          sendPhoto(groupChatId, user.imgs[0], {
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
  } else if (callbackData.startsWith("hisobla")) {
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
    sendMessage(
      userId,
      `*Sizning akkauntingiz ${acc_number}👇*\n\n*JAMI: ${total_price} so'm 🧾*\n\n*AKK EGASIGA: ${moneyForOwner} so'm ✅*`,
      { parse_mode: "Markdown" }
    );
    bot.answerCallbackQuery(callbackQuery.id, {
      text: `${acc_number} - ACCga oid mablag' hisoblangi!`,
      show_alert: false,
    });
  } else if (callbackData.startsWith("konkurs_")) {
    const action = callbackData.split("_")[1];
    const type = callbackData.split("_")?.[2];
    if (action === "cancel") {
      answerTopId = callbackQuery.message.message_id;
      sendMessage(
        userId,
        "Yangi ro'yxat uchun 5 ta ID ro'yxati (,) bilan shu ko'rinishda `Top&Random/...`  yozib jo'nating!",
        { parse_mode: "Markdown" }
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
  } else if (callbackData.startsWith("order_")) {
    const action = callbackData.split("_")[1];
    const user_id = callbackData.split("_")[2];
    const groupChatId = "-1002389470396";
    if (action === "accept") {
      mode[user_id] = "user_dev";
      bot.editMessageReplyMarkup(
        {
          inline_keyboard: [],
        },
        {
          chat_id: groupChatId,
          message_id: orderMsg[user_id],
        }
      );
      sendMessage(groupChatId, "*Buyurtma qabul qilindi! ✅*", {
        reply_to_message_id: orderMsg[user_id],
        parse_mode: "Markdown",
      });

      sendMessage(
        user_id,
        "*Admin buyurtmangizni tasdiqladi!*\n*Endi quyidagi @ATOMIC_CARDS kartalarimizdan biriga to'lov qilib, to'lov chekini bu yerga jo'nating!*",
        { parse_mode: "Markdown" }
      );
      bot.answerCallbackQuery(callbackQuery.id, {
        text: "buyurtma olindi!",
        show_alert: false,
      });
    }
  } else if (callbackData.startsWith("payment_order")) {
    const action = callbackData.split("_")[2];
    const user_id = callbackData.split("_")[3];
    const groupChatId = "-1002295458462";
    if (action === "accept" && ownersChatId.includes(userId.toString())) {
      const user = form[user_id];
      if (!user) {
        bot.answerCallbackQuery(callbackQuery.id, {
          text: "Foydalanuvchi topilmadi!",
          show_alert: true,
        });
        return;
      }

      const convertTime = (time) => {
        if (time.startsWith("Tungi")) {
          return 12;
        } else {
          const t = time?.split(" ");
          if (t[1] === "soat") return t[0];
          if (t[1] === "kun") return t[0] * 24;
        }
      };

      const value = {
        user_id,
        acc_id: user.acc_id,
        time: convertTime(user.time),
        paid: user.price,
        id: generateId(),
        start_time: `${user.month?.toString().padStart(2, "0")}.${user.day
          ?.toString()
          .padStart(2, "0")} - ${user.start_hour}`,
        imgs: user.photo,
      };

      const s = await service.handleUserResponse(value);
      const paidGrId = "-1002140035192";
      const formattedValue = user.price.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
      const link = `[${user_id}](tg://user?id=${user_id})`;
      const adminMessage = `ID: ${link}\nACC: ${user.acc_short_name
        }\nVAQTI: ${convertToTimeFormat(
          user.time
        )}\n\nNARXI: ${formattedValue} so'm`;

      if (s) {
        bot.answerCallbackQuery(callbackQuery.id, {
          text: "Buyurtma yakunlandi 😊",
          show_alert: true,
        });

        sendMessage(groupChatId, `*№${user?.id} Buyurtma qabul qilindi! ✅*`, {
          parse_mode: "Markdown",
        });

        sendMessage(
          user_id,
          `*Buyurtma id* №\`${user?.id}\`\n*Tabriklaymiz sizning buyurtmangiz muvoffaqiyatli tasdiqlandi*`,
          { parse_mode: "MarkdownV2" }
        );
        if (user.photo && user.photo.length > 1) {
          const media = user.photo.map((img, index) => ({
            type: "photo",
            media: img,
            caption: index === 0 ? adminMessage : "",
            parse_mode: "Markdown",
          }));
          sendMediaGroup(paidGrId, media);
          form[user_id] = {};
        } else {
          sendPhoto(paidGrId, user.photo[0], {
            caption: adminMessage,
            parse_mode: "Markdown",
          });
          form[user_id] = {};
        }
      }
    } else {
      bot.answerCallbackQuery(callbackQuery.id, {
        text: "Sizda bu uchun ruxsat yo'q!",
        show_alert: true,
      });
    }
  }
});

bot.on("message", async (msg) => {
  const chatId = msg.from.id;
  const userId = msg.from.id;
  const username = msg.from.first_name;
  const command = msg.text;

  if (
    ownersChatId?.includes(userId.toString()) ||
    myChatId?.includes(userId.toString())
  ) {
    if (command === "/get_all_user") {
      const results = await service.fetchAllUsers(chatId);
      if (!results.length) {
        sendMessage(chatId, "Foydalanuvchilar topilmadi.");
      } else {
        results.forEach((user, index) => {
          const link = `[${user?.user_id}](tg://user?id=${user?.user_id})`;
          setTimeout(() => {
            sendMessage(
              chatId,
              `${index + 1}. ID: ${link}\nUsername: ${user?.username}\nPhone: ${user.phone
              }`,
              { parse_mode: "Markdown" }
            );
          }, index * 250);
        });
      }
    } else if (command === "/get_user_by_id") {
      sendMessage(
        chatId,
        "*Iltimos ID raqamini (/id 0000000) sifatida yuboring:*",
        { parse_mode: "Markdown" }
      );
    } else if (command === "/shablon") {
      form[chatId] = {};
      const chunkedAccData = chunkArray(accData, 5);
      sendMessage(chatId, "*Akkaunt tanlang:*", {
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
    } else if (command === "/hisobla") {
      const chunkedAccData = chunkArray(accData, 5);
      sendMessage(chatId, "Qaysi akkauntni hisoblamoqchisiz?", {
        reply_markup: {
          inline_keyboard: chunkedAccData.map((chunk) =>
            chunk.map((acc) => ({
              text: acc,
              callback_data: `hisobla_${acc}`,
            }))
          ),
        },
      });
    } else if (command === "/top5") {
      const top5 = await service.rankUsersByTotalPayments();
      if (!top5.length) {
        sendMessage(chatId, "Foydalanuvchilar topilmadi.");
      } else {
        console.log("Top 5:", top5);
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
        sendMessage(
          chatId,
          [
            "*Eng ko'p acc olgan TOP 5 talik *👇\n",
            ...message,
            "\n*Buni tasdiqlaysizmi ?*",
          ].join("\n"),
          options
        );
      }
    } else if (command === "/random") {
      const randomWinners = await service.getRandomIdsExcludingTop5();
      if (!randomWinners.length) {
        sendMessage(chatId, "Foydalanuvchilar topilmadi.");
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
        sendMessage(
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
  } else if (command === "/konkurs") {
    const s = await service.fetchWinner(chatId);
    if (s) {
      sendMessage(
        chatId,
        `Tabriklaymiz! Siz random tanlovda g'olib bo'ldingiz va ${s?.prize_time} soatga akkaunt olasiz!`
      );
    } else {
      sendMessage(chatId, "Siz g'olib bo'lmadingiz!");
    }
  } else if (msg?.web_app_data?.data) {
    const groupChatId = "-1002389470396";
    const data = JSON.parse(msg.web_app_data.data);
    const id = data?.short_name;
    form[chatId] = { id, ...form[chatId], ...data };
    const existUser = await service.checkIfRegistered(chatId);
    if (existUser) {
      sendMessage(
        chatId,
        `Xaridingiz uchun rahmat!\nBuyurtma admin tomonidan ko'rib chiqilib sizga xabar beriladi!`
      );
      const formattedPrice = data?.price
        ?.toString()
        ?.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
      sendMessage(
        chatId,
        `Sizning buyurtmangiz: \nacc: ${data.acc_name
        } \nprice: ${formattedPrice} \nstart: ${new Date().getFullYear()}.${data.month
          ?.toString()
          .padStart(2, "0")}.${data.day?.toString().padStart(2, "0")} - ${data.start_hour
        }\ndavomiyligi: ${data.time}`
      );

      const link = `[${username}](tg://user?id=${chatId})`;
      const message = `*Yangi buyurtma №${id}*\n\nACC: ${data.acc_name
        }\nNarxi: ${formattedPrice} so'm\nstart: ${data.month
          ?.toString()
          .padStart(2, "0")}.${data.day?.toString().padStart(2, "0")} - ${data.start_hour
        }\ndavomiyligi: ${data.time}\n\n*Buyurtma beruvchi:* ${link} - ${chatId}`;

      const options = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "❌", callback_data: `order_reject_${chatId}` },
              { text: "✅", callback_data: `order_accept_${chatId}` },
            ],
          ],
        },
        parse_mode: "Markdown",
      };
      bot
        .sendMessage(groupChatId, message, options)
        .then((sentMessage) => (orderMsg[chatId] = sentMessage.message_id));
    } else {
      sendMessage(
        chatId,
        `Iltimos buyurtma berishdan oldin ro'yxatdan o'ting! /start`
      );
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
              `*${acc} — ${earnings[`total_price_${acc.slice(1).toLowerCase()}`]
              } so'm🧾*`
          )
          .join("\n\n");
        const earningsMessage2 = others_accs
          .map(
            (acc) =>
              `*${acc} — ${earnings[`total_price_${acc.slice(1).toLowerCase()}`]
              } so'm🧾*`
          )
          .join("\n\n");
        const finalMessage = `
          *DAILY PROFIT👇*\n\n${earningsMessage2}\n➖➖➖➖➖➖➖➖➖➖\n*OTHERS' PROFIT — ${earnings.others_total} so'm👌*\n*MY PROFIT — ${earnings.summed_others_accs} so'm👌*\n➖➖➖➖➖➖➖➖➖➖\n${earningsMessage1}\n*➖➖➖➖➖➖➖➖➖➖*\n*FROM MY ACCS — ${earnings.my_accs} so'm🔥*\n*➖➖➖➖➖➖➖➖➖➖*\n* 💰MINE: ${earnings.MyTotalProfit} so'm✅ *\n* 💰ALL: ${earnings.Total_Profit} so'm✅ *
        `;

        sendMessage(chatId, finalMessage, { parse_mode: "Markdown" });
      } catch (error) {
        console.error("Error calculating daily earnings:", error);
        sendMessage(
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
              `*${acc} — ${earnings[`total_price_${acc.slice(1).toLowerCase()}`]
              } so'm🧾*`
          )
          .join("\n\n");
        const earningsMessage2 = others_accs
          .map(
            (acc) =>
              `*${acc} — ${earnings[`total_price_${acc.slice(1).toLowerCase()}`]
              } so'm🧾*`
          )
          .join("\n\n");
        const finalMessage = `
          *WEEKLY PROFIT👇*\n\n${earningsMessage2}\n➖➖➖➖➖➖➖➖➖➖\n*OTHERS' PROFIT — ${earnings.others_total} so'm👌*\n*MY PROFIT — ${earnings.summed_others_accs} so'm👌*\n➖➖➖➖➖➖➖➖➖➖\n${earningsMessage1}\n*➖➖➖➖➖➖➖➖➖➖*\n*FROM MY ACCS — ${earnings.my_accs} so'm🔥*\n*➖➖➖➖➖➖➖➖➖➖*\n* 💰MINE: ${earnings.MyTotalProfit} so'm✅ *\n*   💰ALL: ${earnings.Total_Profit} so'm✅ *
        `;

        sendMessage(chatId, finalMessage, { parse_mode: "Markdown" });
      } catch (error) {
        console.error("Error calculating weekly earnings:", error);
        sendMessage(
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
              `*${acc} — ${earnings[`total_price_${acc.slice(1).toLowerCase()}`]
              } so'm🧾*`
          )
          .join("\n\n");
        const earningsMessage2 = others_accs
          .map(
            (acc) =>
              `*${acc} — ${earnings[`total_price_${acc.slice(1).toLowerCase()}`]
              } so'm🧾*`
          )
          .join("\n\n");
        const finalMessage = `
        *MONTHLY PROFIT👇*\n\n${earningsMessage2}\n➖➖➖➖➖➖➖➖➖➖\n*OTHERS' PROFIT — ${earnings.others_total} so'm👌*\n*MY PROFIT — ${earnings.summed_others_accs} so'm👌*\n➖➖➖➖➖➖➖➖➖➖\n${earningsMessage1}\n*➖➖➖➖➖➖➖➖➖➖*\n*FROM MY ACCS — ${earnings.my_accs} so'm🔥*\n*➖➖➖➖➖➖➖➖➖➖*\n* 💰MINE: ${earnings.MyTotalProfit} so'm✅ *\n*   💰ALL: ${earnings.Total_Profit} so'm✅ *
      `;

        sendMessage(chatId, finalMessage, { parse_mode: "Markdown" });
      } catch (error) {
        console.error("Error calculating monthly earnings:", error);
        sendMessage(
          chatId,
          "Oylik daromadlarni hisoblashda xatolik yuz berdi."
        );
      }
    }
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
      sendMessage(
        chatId,
        `* Vaqt: ${convertToTimeFormat(value)} *\n* Endi To'lovni Kiriting:*`,
        { parse_mode: "Markdown" }
      );
    } else if (us?.order === "price" && isNumeric) {
      mode[chatId] = "dev";
      form[chatId] = { ...form[chatId], price: value, order: "photo" };
      sendMessage(chatId, "*Iltimos to'lov checkini yuboring*", {
        parse_mode: "Markdown",
      });
    } else if (isReply && msdId + 1 === answerTopId) {
      const user_id = isReply.match(/\d+/)[0];
      sendMessage(
        user_id,
        `*Kechirasiz, Sizning ma'lumotlaringiz qabul qilinmadi. Qayta urinib ko'ring* /start.`,
        { parse_mode: "Markdown" }
      );
      sendMessage(user_id, msg.text);
    } else if (msdId - 2 === answerTopId) {
      const type = messageText?.split("/");
      const ids = type?.[1]?.split(",");
      const message = ids?.map((user, index) => {
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
    sendMessage(chatId, "*Passportingizning rasmni yuboring.*", {
      parse_mode: "Markdown",
    });
  } else {
    sendMessage(
      chatId,
      "*Mos bo'lmagan telefon raqami!*\nIltimos *Telefon raqamimni ulashish* tugmasi orqali telefon raqamingizni ulashing ulashing.",
      { parse_mode: "Markdown" }
    );
  }
});

const { adminSetup, userSetup } = photoHandler(bot, orderMsg);

bot.on("photo", async (msg) => {
  const chatId = msg.chat.id;
  const img = msg.photo[msg.photo.length - 1].file_id;
  const name = msg.chat.first_name;

  if (msg.chat.type !== "private") {
    sendMessage(chatId, "Bu özellik yalnızca özel sohbetlerde kullanılabilir.");
    return;
  }
  if (ownersChatId.includes(chatId.toString())) {
    adminSetup(
      chatId,
      form,
      mode,
      callballResult,
      templateDatas,
      img,
      acc_data
    );
  } else {
    userSetup(chatId, form, mode, userInfo, name, img);
  }
});

bot.on("location", (msg) => {
  const chatId = msg.chat.id;
  userInfo[chatId] = { ...userInfo[chatId], location: msg.location };
  sendMessage(
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
  sendMessage(
    chatId,
    "Barcha malumotlaringiz ko'rib chiqilmoqda. Iltimos admin tasdiqlashini kuting!"
  );
});

bot.on("video", (msg) => {
  const chatId = msg.chat.id;
  if (!ownersChatId.includes(chatId.toString())) {
    if (mode[chatId] === "user_dev") {
      sendMessage(
        chatId,
        "*Iltimos check uchun video emas rasm yuboring!*\n*Yoki @ARENDA_BRO ga murojaat qiling!*",
        { parse_mode: "Markdown" }
      );
    } else {
      sendMessage(
        chatId,
        "*Iltimos video emas video xabar jo'nating jo'nating!*",
        { parse_mode: "Markdown" }
      );
    }
  }
});

bot.on("voice", (msg) => {
  const chatId = msg.chat.id;
  const isReply = msg.reply_to_message?.text || null;
  if (isReply && ownersChatId.includes(chatId.toString())) {
    const user_id = isReply.match(/\d+/)[0];
    sendMessage(
      user_id,
      `*Kechirasiz, Sizning ma'lumotlaringiz qabul qilinmadi. Qayta urinib ko'ring* @/start.`,
      { parse_mode: "Markdown" }
    );
    bot.sendVoice(user_id, msg.voice.file_id);
  }
});

// user response
const controller = require("./src/controller/user.controller");
io.on("connection", (socket) => {
  socket.on("/all/accs", async (ds, callback) => {
    try {
      const result = await controller.getAllAccs(ds);
      callback(result);
    } catch (error) {
      callback({ message: "Internal Server Error", status: 500 });
    }
  });

  socket.on("/get_acc/byId", async (id, callback) => {
    try {
      const result = await controller.getAccById(id);
      callback(result);
    } catch (error) {
      callback({ message: "Internal Server Error", status: 500 });
    }
  });

  socket.on("/reserve/acc", async (ds, callback) => {
    try {
      const result = await controller.reserveAcc(ds);
      callback(result);
    } catch (error) {
      callback({ message: "Internal Server Error", status: 500 });
    }
  });

  socket.on(`/add_acc`, async (data, callback) => {
    try {
      const result = await controller.addAcc(data);
      callback(result);
    } catch (error) {
      callback({ message: "Internal Server Error", status: 500 });
    }
  });

  socket.on("/imageUpload", async (data, callback) => {
    try {
      const result = await u_service.getImgUrl(data);
      callback(result);
    } catch (error) {
      callback({ message: "Internal Server Error", status: 500 });
    }
  });

  socket.on("/changeImgUrl", async (data, callback) => {
    try {
      const result = await u_service.changeUrl(data.new, data.old);
      callback(result);
    } catch (error) {
      callback({ message: "Internal Server Error", status: 500 });
    }
  });

  socket.on("/get-acc/sales-list/byId", async (id, callback) => {
    try {
      const result = await controller.getAccSalesListById(id);
      callback(result);
    } catch (error) {
      callback({ message: "Internal Server Error", status: 500 });
    }
  });
});

server.listen(87, () => {
  console.log(`server is running on port 87`);
});

module.exports = bot;
