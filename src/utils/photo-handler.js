const { paidChanelId } = require("../mocks/security");
const { convertToTimeFormat, generateId } = require("../utils/services");

const photoHandler = (bot, orderMsg) => {
  const timers = {};

  const adminSetup = (
    chatId,
    form,
    mode,
    callballResult,
    templateDatas,
    img,
    acc_data
  ) => {
    if (mode[chatId] === "dev") {
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
        const forma = `Sizning buyurtmangiz:\n\nACC — ${us?.acc_number || us?.acc_name
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
              [
                {
                  text: "Ha, ROZIMAN✅",
                  callback_data: `form_accept_${id}`,
                },
              ],
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
  };
  const userSetup = (chatId, form, mode, userInfo, name, img) => {
    if (mode[chatId] === "user_dev") {
      let user = form[chatId] || {};
      if (timers[chatId]) {
        clearTimeout(timers[chatId]);
        timers[chatId] = null;
      }
      user = {
        ...user,
        photo: [...(user?.photo || []), img],
      };
      timers[chatId] = setTimeout(() => {
        bot.sendMessage(
          chatId,
          "*Check qabul qilindi va admin tomonidan tekshirilmoqda...*\n*Iltimos kuting!*",
          { parse_mode: "Markdown" }
        );

        const formattedPrice = user?.price
          ?.toString()
          ?.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        const link = `[${name}](tg://user?id=${chatId})`;
        const message = `*Yangi buyurtma №${user?.id}*\n\nACC: ${user.acc_name
          }\nNarxi: ${formattedPrice} so'm\nstart: ${user.month
            ?.toString()
            .padStart(2, "0")}.${user.day?.toString().padStart(2, "0")} - ${user.start_hour
          }\ndavomiyligi: ${user.time
          }\n\n*Buyurtma beruvchi:* ${link} - ${chatId}`;

        const mediaGroup = user?.photo?.map((photoId) => ({
          type: "photo",
          media: photoId,
        }));

        bot
          .sendMediaGroup(paidChanelId, mediaGroup)
          .then((sentMessage) => {
            orderMsg[chatId] = sentMessage.message_id;
            bot.sendMessage(paidChanelId, message, {
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "❌",
                      callback_data: `payment_order_reject_${chatId}`,
                    },
                    {
                      text: "✅",
                      callback_data: `payment_order_accept_${chatId}`,
                    },
                  ],
                ],
              },
              parse_mode: "Markdown",
            });
          })
          .catch((error) => {
            console.error("Mesaj gönderme hatası:", error.response.body);
          });

        timers[chatId] = null;
      }, 750);

      form[chatId] = user;
    } else {
      userInfo[chatId] = {
        ...userInfo[chatId],
        photo: img,
        name: name,
      };

      const options = {
        reply_markup: {
          keyboard: [
            [{ text: "Locatsiyamni ulashish", request_location: true }],
          ],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
        parse_mode: "Markdown",
      };
      bot.sendMessage(
        chatId,
        "*Iltimos shaxsiy Locatsiyangizni ulang:*",
        options
      );
    }
  };

  return {
    adminSetup,
    userSetup,
  };
};

module.exports = photoHandler;
