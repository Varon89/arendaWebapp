const QueryService = require("./query.service");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { calculateEndDateTime } = require("../utils/services");

class UserService {
  static async getAllAccs() {
    const query = "SELECT * FROM accounts";
    const result = await QueryService.dbQuery(query);
    return result;
  }

  static async getAccById(id) {
    const query = "SELECT * FROM accounts WHERE acc_id = ?";
    const result = await QueryService.dbQuery(query, [id]);
    return result;
  }

  static async getImgUrl(data) {
    return new Promise(async (resolve, reject) => {
      try {
        const base64Image = data.image.split(";base64,").pop();
        const imgBuffer = Buffer.from(base64Image, "base64");
        const processedImage = await sharp(imgBuffer)
          .resize(400, 400)
          .toBuffer();

        const originalname = data?.name;
        const unique = crypto?.randomBytes(3).toString("hex");
        const format = originalname?.split(".").pop();
        const name = `img_${unique}.${format}`;
        const imgDir = path.resolve(__dirname, "../../imgs");
        if (!fs.existsSync(imgDir)) {
          fs.mkdirSync(imgDir, { recursive: true });
        }
        const filePath = path.join(imgDir, name);
        await sharp(processedImage).toFile(filePath);
        const url = `https://server.foodify.uz/${name}`;
        return resolve(url);
      } catch (err) {
        return reject(err);
      }
    });
  }

  static async changeUrl(data, oldUrl) {
    // delete old image from imgs folder
    const oldName = oldUrl.split("/").pop();
    const imgDir = path.resolve(__dirname, "../../imgs");
    const oldPath = path.join(imgDir, oldName);
    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
    }
    // create new image
    const newurl = this.getImgUrl(data);
    return newurl;
  }

  static async getAccSalesListById(id) {
    try {
      const query =
        "SELECT * FROM acc_orders WHERE acc_id = ? AND status = 0 AND start_date >= CURDATE()";
      const result = await QueryService.dbQuery(query, [id]);
      let parsedData = JSON.parse(JSON.stringify(result));
      parsedData = parsedData.map((item) => {
        return calculateEndDateTime(item);
      });
      return parsedData;
    } catch (err) {
      return { error: err.message };
    }
  }
}

module.exports = UserService;
