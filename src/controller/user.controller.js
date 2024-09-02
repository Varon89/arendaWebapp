const service = require("../service/user.service");
const { getImgPathLink } = require("../service/services");

class UserController {
  static async getAllAccs() {
    try {
      const data = await service.getAllAccs();
      const parsedData = JSON.parse(JSON.stringify(data));
      const result = parsedData.map((acc) => {
        const imgs = JSON.parse(acc.imgs);
        return {
          ...acc,
          imgs,
        };
      });

      return result;
    } catch (error) {
      return { error: error.message };
    }
  }

  static async getAccById(id) {
    try {
      const data = await service.getAccById(id);
      const parsed_data = JSON.parse(JSON.stringify(data[0]));
      const prices = JSON.parse(parsed_data.price_list);
      const price_list = Object.keys(prices).map((key) => {
        return {
          hour: key,
          price: prices[key],
        };
      });
      return {
        ...parsed_data,
        price_list,
        daily_price_list: JSON.parse(parsed_data.daily_price_list),
      };
    } catch (error) {
      return { error: error.message };
    }
  }
}

module.exports = UserController;
