const { calculateEndDateTime } = require("../utils/services");
const QueryService = require("./query.service");

class RegisterService {
  static async checkIfRegistered(userId) {
    const query = "SELECT * FROM users WHERE user_id = ?";
    try {
      const result = await QueryService.dbQuery(query, [userId]);
      console.log(result, userId);
      return result.length > 0;
    } catch (error) {
      console.error(1);
      throw error;
    }
  }
  static async fetchAllUsers() {
    try {
      const query = "SELECT * FROM users";
      const results = await QueryService.dbQuery(query);
      return results;
    } catch (error) {
      console.error(2);
      throw error;
    }
  }
  static async fetchUserById(id) {
    try {
      const query = "SELECT * FROM users WHERE user_id = ?";
      const result = await QueryService.dbQuery(query, [id]);
      const user = result[0];
      return user;
    } catch (error) {
      throw error;
    }
  }
  static async handleAdminResponse(user) {
    try {
      const query = `INSERT INTO users (user_id, name, photo, longitude, latitude, phone, username) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), photo = VALUES(photo), longitude = VALUES(longitude), latitude = VALUES(latitude), phone = VALUES(phone), username = VALUES(username)`;
      const values = [
        user?.userId,
        user?.name || "",
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
      const date = user?.start_time?.split(" - ");
      user.start_date = date?.[0];
      user.start_hour = date?.[1];
      delete user.start_time;

      const data = calculateEndDateTime(user);

      const query = `INSERT INTO acc_orders (user_id, acc_id, paid, time, shablon_id, imgs, start_date, start_hour, end_date, end_hour) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE acc_id = VALUES(acc_id), paid = VALUES(paid), time = VALUES(time), shablon_id = VALUES(shablon_id), imgs = VALUES(imgs), status = VALUES(status), start_date = VALUES(start_date), start_hour = VALUES(start_hour), end_date = VALUES(end_date), end_hour = VALUES(end_hour)`;
      const imgsValue =
        user?.imgs && user.imgs.length > 0 ? JSON.stringify(user.imgs) : "[]";

      const values = [
        data.user_id,
        data.acc_id,
        data.paid,
        data.time,
        data.shablon_id,
        imgsValue,
        data.start_date,
        data.start_hour,
        data.end_date,
        data.end_hour,
      ];

      const result = await QueryService.dbQuery(query, values);
      const s = JSON.parse(JSON.stringify(result));

      if (s.affectedRows > 0) {
        const adjustedStartHour = `DATE_FORMAT(DATE_SUB(CONCAT('${data.start_date}', ' ', '${data.start_hour}'), INTERVAL 3 HOUR), '%Y-%m-%d %H:%i')`;
        const adjustedEndHour = `DATE_FORMAT(DATE_SUB(CONCAT('${data.start_date}', ' ', '${data.start_hour}'), INTERVAL 2 HOUR), '%Y-%m-%d %H:%i')`;

        // Start timer event query
        const startTimerQuery = `
    CREATE EVENT IF NOT EXISTS start_timer_${data.shablon_id} 
    ON SCHEDULE AT (${adjustedStartHour}) 
    DO 
    BEGIN 
        UPDATE acc_orders 
        SET status = 1 
        WHERE acc_id = '${data.acc_id}' AND shablon_id = '${data?.shablon_id}'; 
        DROP EVENT IF EXISTS start_timer_${data?.shablon_id}; 
    END;
  `;

        // End timer event query
        const endTimerQuery = `
    CREATE EVENT IF NOT EXISTS end_timer_${data.shablon_id} 
    ON SCHEDULE AT (${adjustedEndHour}) 
    DO 
    BEGIN 
        UPDATE acc_orders 
        SET status = 0 
        WHERE acc_id = '${data.acc_id}' AND shablon_id = '${data?.shablon_id}'; 
        DROP EVENT IF EXISTS end_timer_${data?.shablon_id}; 
    END;
  `;

        // Execute both queries separately
        await QueryService.dbQuery(startTimerQuery);
        await QueryService.dbQuery(endTimerQuery);
      }

      return s.affectedRows > 0;
    } catch (error) {
      console.error("Query Error:", error);
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
      const sql = `
          SELECT sum(b.paid) as total_price, a.short_name as short_name
          FROM accounts as a
          LEFT JOIN acc_orders as b ON b.acc_id = a.acc_id
          WHERE a.short_name = ?
          AND b.status = 0
      `;
      const result = await QueryService.dbQuery(sql, [number]);

      return result[0].total_price ? result[0].total_price : 0;
    } catch (error) {
      throw error;
    }
  }
  static async getRandomIdsExcludingTop5() {
    try {
      const top5Query = `
        SELECT user_id
        FROM (
            SELECT acc_id, SUM(paid) AS total_spent
            FROM acc_orders 
            WHERE received_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) 
            GROUP BY user_id
            ORDER BY total_spent DESC 
            LIMIT 5
        ) AS top5;
    `;

      const allIdsQuery = `
        SELECT user_id, COUNT(*) as count
        FROM acc_orders 
        WHERE received_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) 
          AND id NOT IN (${top5Query})
        GROUP BY user_id;
    `;

      const allIds = await QueryService.dbQuery(allIdsQuery);
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

      const { startTimestamp, endTimestamp } = this.getTimestamps(
        type,
        currentUTCDate
      );

      const formattedStartTimestamp = this.formatTimestamp(startTimestamp);
      const formattedEndTimestamp = this.formatTimestamp(endTimestamp);

      const accNumbersString = this.formatAccountNumbers(my_accs);
      const othersAccsString = this.formatAccountNumbers(others_accs);

      const sumSql = `
      SELECT
        acc_id AS acc_number,
        SUM(CASE WHEN acc_id IN (${accNumbersString}) THEN paid ELSE 0 END) AS my_accs,
        SUM(CASE WHEN acc_id IN (${othersAccsString}) THEN paid ELSE 0 END) AS all_accs,
        SUM(paid) AS total_price
      FROM acc_orders 
      WHERE received_at >= '${formattedStartTimestamp}'
        AND received_at < '${formattedEndTimestamp}'
      GROUP BY acc_id
    `;

      const result = await QueryService.dbQuery(sumSql);
      console.log(result);
      const accMap = this.getAccountMap();
      const final_report = this.initializeFinalReport(accMap);

      this.processResults(result, final_report, accMap, my_accs);

      this.calculateFinalValues(final_report);

      return this.formatFinalReport(final_report);
    } catch (error) {
      throw error;
    }
  }
  static getTimestamps(type, currentUTCDate) {
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
      const day = currentUTCDate.getUTCDay();
      const diff = day >= 1 ? day - 1 : 6; // adjust to get Monday
      startTimestamp = new Date(currentUTCDate);
      startTimestamp.setUTCDate(currentUTCDate.getUTCDate() - diff);
      startTimestamp.setUTCHours(6, 0, 0); // set to 06:00:00.000 UTC on Monday
      endTimestamp = new Date(currentUTCDate);
      endTimestamp.setUTCHours(23, 59, 59, 999); // end of the current day
    } else if (type === "monthly") {
      startTimestamp = new Date(currentUTCDate);
      startTimestamp.setUTCDate(25);
      startTimestamp.setUTCHours(5, 0, 0); // set to 05:00:00.000 UTC
      if (currentUTCDate.getUTCDate() < 25) {
        startTimestamp.setUTCMonth(currentUTCDate.getUTCMonth() - 1);
      }
      endTimestamp = new Date(startTimestamp);
      endTimestamp.setUTCMonth(startTimestamp.getUTCMonth() + 1);
      endTimestamp.setUTCHours(2, 0, 0); // set to 02:00:00.000 UTC
    } else {
      throw new Error("Invalid type specified");
    }

    return { startTimestamp, endTimestamp };
  }
  static formatTimestamp(timestamp) {
    return timestamp.toISOString().slice(0, 19).replace("T", " ");
  }
  static formatAccountNumbers(accounts) {
    return accounts.map((acc) => `'${acc}'`).join(",");
  }
  static getAccountMap() {
    return {
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
  }
  static initializeFinalReport(accMap) {
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

    return final_report;
  }
  static processResults(result, final_report, accMap, my_accs) {
    result.forEach((row) => {
      const total_price = row.total_price || 0;
      if (accMap[row.acc_number]) {
        final_report[accMap[row.acc_number]] = total_price;
      }
      if (my_accs.includes(row.acc_number)) {
        final_report.my_accs += total_price;
      }
    });
  }
  static calculateFinalValues(final_report) {
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
  }
  static formatFinalReport(final_report) {
    Object.keys(final_report).forEach((key) => {
      final_report[key] = final_report[key]
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    });

    return final_report;
  }
  static async rankUsersByTotalPayments() {
    const query = `SELECT user_id, SUM(paid) AS total_spent FROM acc_orders WHERE received_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) GROUP BY user_id ORDER BY total_spent DESC LIMIT 5;`;
    try {
      const results = await QueryService.dbQuery(query);

      return results.map((user, index) => ({
        rank: index + 1,
        user_id: user.user_id,
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
            SELECT user_id, SUM(paid) AS total_spent
            FROM acc_orders 
            WHERE received_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) 
            GROUP BY user_id
            ORDER BY total_spent DESC 
            LIMIT 5
        ) AS top5
    `;

    const allIdsQuery = `
        SELECT user_id, COUNT(*) as count
        FROM acc_orders 
        WHERE received_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) 
          AND user_id NOT IN (${top5Query})
        GROUP BY user_id;
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
      const query = `INSERT INTO winners (user_id, prize_time, money_spent, rank_user) VALUES (?, ?, ?, ?)`;
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
    const daily_price_list = Object.values(acc.daily_price_list);
    const query = `INSERT INTO accounts (acc_id, short_name, acc_name, description, video_id, imgs, owner_id, price_list, custom_price_list) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE short_name = VALUES(short_name), acc_name = VALUES(acc_name), description = VALUES(description), video_id = VALUES(video_id), imgs = VALUES(imgs), owner_id = VALUES(owner_id), price_list = VALUES(price_list), custom_price_list = VALUES(custom_price_list)`;
    const values = [
      id,
      acc.short_name,
      acc.name,
      acc.description,
      acc.videoID,
      JSON.stringify(acc.imgs),
      acc.owner_id,
      JSON.stringify(acc.price_list),
      JSON.stringify(daily_price_list),
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
