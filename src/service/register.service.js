// register.service.js
const QueryService = require("./query.service");
const { getImgPathLink } = require("./services");

class RegisterService {
  static async checkIfRegistered(userId) {
    const query = "SELECT * FROM arenda WHERE id = ?";
    try {
      const result = await QueryService.dbQuery(query, [userId]);
      return result.length > 0;
    } catch (error) {
      console.error(1);
      throw error;
    }
  }
  static async fetchAllUsers() {
    try {
      const query = "SELECT * FROM arenda";
      const results = await QueryService.dbQuery(query);
      return results;
    } catch (error) {
      console.error(2);
      throw error;
    }
  }
  static async fetchUserById(id) {
    try {
      const query = "SELECT * FROM arenda WHERE id = ?";
      const result = await QueryService.dbQuery(query, [id]);
      const user = result[0];
      return user;
    } catch (error) {
      throw error;
    }
  }
  static async handleAdminResponse(user) {
    try {
      const query = `INSERT INTO arenda (id, name, photo, longitude, latitude, phone, username) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), photo = VALUES(photo), longitude = VALUES(longitude), latitude = VALUES(latitude), phone = VALUES(phone), username = VALUES(username)`;
      const values = [
        user?.userId,
        "",
        user?.photo || "",
        user?.location?.longitude,
        user?.location?.latitude,
        user?.phone,
        `[${user?.name}](tg://user?id=${user?.userId})`,
      ];

      const result = await QueryService.dbQuery(query, values);
      const s = JSON.parse(JSON.stringify(result));
      return s.affectedRows > 0;
    } catch (err) {
      console.error(err);
    }
  }
  static async handleUserResponse(user) {
    try {
      const query = `INSERT INTO acc_orders (id, acc_number, price, time, shablon_id, imgs) VALUES (?,?,?,?,?,?)`;
      const imgsValue =
        user?.imgs && user.imgs.length > 0 ? JSON.stringify(user.imgs) : "[]";
      const values = [
        user?.userId,
        user?.acc_number,
        user?.price,
        user?.time,
        user?.us_id,
        imgsValue,
      ];
      const result = await QueryService.dbQuery(query, values);
      const s = JSON.parse(JSON.stringify(result));
      return s.affectedRows > 0;
    } catch (error) {
      return false;
    }
  }
  static async updatePaymentStatus(userId, status) {
    try {
      const query = `UPDATE acc_orders SET status = ? WHERE id = ?`;
      const values = [status, userId];
      const result = await QueryService.dbQuery(query, values);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error updating payment status:", error);
    }
  }
  static async calcPriceByAcc(number) {
    try {
      const sql = `SELECT sum(price) as total_price FROM acc_orders WHERE acc_number = ? AND payment_status = 0`;
      const result = await QueryService.dbQuery(sql, [number]);

      return result[0].total_price ? result[0].total_price : 0;
    } catch (error) {
      throw error;
    }
  }
  static async getRandomIdsExcludingTop5() {
    try {
      const top5Query = `
        SELECT id 
        FROM (
            SELECT id, SUM(price) AS total_spent 
            FROM acc_orders 
            WHERE received_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) 
            GROUP BY id 
            ORDER BY total_spent DESC 
            LIMIT 5
        ) AS top5;
    `;

      const allIdsQuery = `
        SELECT id, COUNT(*) as count 
        FROM acc_orders 
        WHERE received_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) 
          AND id NOT IN (${top5Query})
        GROUP BY id;
    `;

      // Fetch IDs that are not in the top 5 spenders along with their count
      const allIds = await QueryService.dbQuery(allIdsQuery);

      // Create an array where each ID appears as many times as its count in the orders
      const weightedIds = allIds.flatMap((order) => {
        return new Array(order.count).fill(order.id);
      });

      // Shuffle the array to randomize order
      const shuffledIds = weightedIds.sort(() => 0.5 - Math.random());
      // Create a Set to ensure uniqueness of selected IDs
      const uniqueSelectedIds = new Set();
      console.log(shuffledIds);

      // Select 5 random unique IDs
      while (uniqueSelectedIds.size < 5 && shuffledIds.length > 0) {
        const randomIndex = Math.floor(Math.random() * shuffledIds.length);
        const selectedId = shuffledIds[randomIndex];
        uniqueSelectedIds.add(selectedId);
        shuffledIds.splice(randomIndex, 1); // Remove the selected ID from the array
      }

      return Array.from(uniqueSelectedIds);
    } catch (error) {
      console.error("Error fetching random IDs:", error);
      throw error;
    }
  }

  static async calcEarnings(my_accs, others_accs, type) {
    try {
      const currentDate = new Date();
      const currentUTCDate = new Date(
        Date.UTC(
          currentDate.getUTCFullYear(),
          currentDate.getUTCMonth(),
          currentDate.getUTCDate(),
          currentDate.getUTCHours(),
          currentDate.getUTCMinutes(),
          currentDate.getUTCSeconds()
        )
      );

      let startTimestamp, endTimestamp;

      if (type === "daily") {
        startTimestamp = new Date(
          Date.UTC(
            currentUTCDate.getUTCFullYear(),
            currentUTCDate.getUTCMonth(),
            currentUTCDate.getUTCDate(),
            6,
            0,
            0
          )
        );
        endTimestamp = new Date(
          Date.UTC(
            currentUTCDate.getUTCFullYear(),
            currentUTCDate.getUTCMonth(),
            currentUTCDate.getUTCDate() + 1,
            2,
            0,
            0
          )
        );
      } else if (type === "weekly") {
        startTimestamp = new Date(currentUTCDate);
        const day = currentUTCDate.getUTCDay();
        const diff = day >= 1 ? day - 1 : 6; // adjust to get Monday
        startTimestamp.setUTCDate(currentUTCDate.getUTCDate() - diff);
        startTimestamp.setUTCHours(6, 0, 0, 0); // set to 06:00:00.000 UTC on Monday

        endTimestamp = new Date(currentUTCDate);
        endTimestamp.setUTCHours(23, 59, 59, 999); // set to the end of the current day
      } else if (type === "monthly") {
        startTimestamp = new Date(currentUTCDate);
        startTimestamp.setUTCDate(25);
        startTimestamp.setUTCHours(5, 0, 0, 0); // set to 05:00:00.000 UTC
        if (currentUTCDate.getUTCDate() < 25) {
          startTimestamp.setUTCMonth(currentUTCDate.getUTCMonth() - 1);
        }

        endTimestamp = new Date(startTimestamp);
        endTimestamp.setUTCMonth(startTimestamp.getUTCMonth() + 1);
        endTimestamp.setUTCHours(2, 0, 0, 0); // set to 02:00:00.000 UTC
      } else {
        throw new Error("Invalid type specified");
      }

      const formattedStartTimestamp = startTimestamp
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");
      const formattedEndTimestamp = endTimestamp
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");
      const accNumbersString = my_accs.map((acc) => `'${acc}'`).join(",");
      const others_accsString = others_accs.map((acc) => `'${acc}'`).join(",");

      const sumSql = `
      SELECT
        acc_number,
        SUM(CASE WHEN acc_number IN (${accNumbersString}) THEN price ELSE 0 END) AS my_accs,
        SUM(CASE WHEN acc_number IN (${others_accsString}) THEN price ELSE 0 END) AS all_accs,
        SUM(price) AS total_price
      FROM acc_orders 
      WHERE received_at >= '${formattedStartTimestamp}'
        AND received_at < '${formattedEndTimestamp}'
      GROUP BY acc_number
    `;

      const result = await QueryService.dbQuery(sumSql);

      const accMap = {
        "#V1": "total_price_v1",
        "#V2": "total_price_v2",
        "#V3": "total_price_v3",
        "#V4": "total_price_v4",
        "#V5": "total_price_v5",
        "#V6": "total_price_v6",
        "#V7": "total_price_v7",
        "#V8": "total_price_v8",
        "#V9": "total_price_v9",
        "#V10": "total_price_v10",
        "#T1": "total_price_t1",
        "#T2": "total_price_t2",
        "#T3": "total_price_t3",
        "#T4": "total_price_t4",
        "#M1": "total_price_m1",
        "#M2": "total_price_m2",
        "#M3": "total_price_m3",
        "#M4": "total_price_m4",
        "#M5": "total_price_m5",
        "#CH1": "total_price_ch1",
        "#CH2": "total_price_ch2",
        "#CH3": "total_price_ch3",
        "#CH4": "total_price_ch4",
      };

      const final_report = {
        my_accs: 0,
        summed_others_accs: 0,
        MyTotalProfit: 0,
        Total_Profit: 0,
        others_total: 0,
      };

      Object.keys(accMap).forEach((key) => {
        final_report[accMap[key]] = 0;
      });

      result.forEach((row) => {
        if (accMap[row.acc_number]) {
          final_report[accMap[row.acc_number]] = row.total_price || 0;
        }
        if (my_accs.includes(row.acc_number)) {
          final_report.my_accs += row.total_price || 0;
        }
      });

      final_report.summed_others_accs =
        0.4 * final_report.total_price_t1 +
        0.35 * final_report.total_price_v7 +
        0.35 * final_report.total_price_v9 +
        0.4 * final_report.total_price_t4 +
        0.35 * final_report.total_price_v6;
      final_report.MyTotalProfit =
        final_report.my_accs + final_report.summed_others_accs;
      final_report.others_total =
        final_report.total_price_t1 +
        final_report.total_price_v7 +
        final_report.total_price_t4 +
        final_report.total_price_v6 +
        final_report.total_price_v9 +
        final_report.total_price_v2 +
        final_report.total_price_v4 +
        final_report.total_price_m3 +
        final_report.total_price_m4;
      final_report.Total_Profit =
        final_report.my_accs + final_report.others_total;

      Object.keys(final_report).forEach((key) => {
        final_report[key] = final_report[key]
          .toString()
          .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
      });

      return final_report;
    } catch (error) {
      throw error;
    }
  }

  static async rankUsersByTotalPayments() {
    const query = `SELECT id, SUM(price) AS total_spent FROM acc_orders WHERE received_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) GROUP BY id ORDER BY total_spent DESC LIMIT 5;`;
    try {
      const results = await QueryService.dbQuery(query);

      return results.map((user, index) => ({
        rank: index + 1,
        user_id: user.id,
        total_spent: user.total_spent,
      }));
    } catch (error) {
      console.error("Error ranking users by total payments:", error);
      throw error;
    }
  }
  static async getRandomIdsExcludingTop5() {
    const top5Query = `
        SELECT id 
        FROM (
            SELECT id, SUM(price) AS total_spent 
            FROM acc_orders 
            WHERE received_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) 
            GROUP BY id 
            ORDER BY total_spent DESC 
            LIMIT 5
        ) AS top5
    `;

    const allIdsQuery = `
        SELECT id, COUNT(*) as count 
        FROM acc_orders 
        WHERE received_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) 
          AND id NOT IN (${top5Query})
        GROUP BY id;
    `;

    try {
      // Fetch IDs that are not in the top 5 spenders along with their count
      const allIds = await QueryService.dbQuery(allIdsQuery);

      // Create an array where each ID appears as many times as its count in the orders
      const weightedIds = allIds.flatMap((order) => {
        return new Array(order.count).fill(order.id);
      });
      const shuffledIds = weightedIds.sort(() => 0.5 - Math.random());

      const uniqueSelectedIds = new Set();
      while (uniqueSelectedIds.size < 5 && shuffledIds.length > 0) {
        const randomIndex = Math.floor(Math.random() * shuffledIds.length);
        const selectedId = shuffledIds[randomIndex];
        uniqueSelectedIds.add(selectedId);
        shuffledIds.splice(randomIndex, 1); // Remove the selected ID from the array
      }
      return Array.from(uniqueSelectedIds);
    } catch (error) {
      console.error("Error fetching random IDs:", error);
      throw error;
    }
  }

  static async addUserToWinnersList(user) {
    try {
      const query = `INSERT INTO winners (id, prize_time, money_spent, rank_user) VALUES (?, ?, ?, ?)`;
      const result = await QueryService.dbQuery(query, [
        user.user_id,
        user.prize_time,
        user.total_spent,
        user.rank_user,
      ]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error adding user to winners list:", error);
      throw error;
    }
  }
  static async fetchWinner(id) {
    try {
      const query = `SELECT * FROM winners WHERE id = ?`;
      const result = await QueryService.dbQuery(query, [id]);
      return result?.length > 0 ? result[0] : null;
    } catch (error) {
      console.error("Error fetching winner:", error);
      throw error;
    }
  }
  static async addAcc(acc, id) {
    const imgPaths = await Promise.all(acc?.imgs?.map(getImgPathLink));
    const query = `INSERT INTO accounts (id, name, description, videoID, imgs, price_list, daily_price_list) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), videoID = VALUES(videoID), imgs = VALUES(imgs), price_list = VALUES(price_list), daily_price_list = VALUES(daily_price_list)`;
    const values = [
      id,
      acc.name,
      acc.description,
      acc.videoID,
      JSON.stringify(imgPaths),
      JSON.stringify(acc.price_list),
      JSON.stringify(acc.daily_price_list),
    ];

    try {
      const result = await QueryService.dbQuery(query, values);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error adding acc:", error);
      throw error;
    }
  }
}

module.exports = RegisterService;
