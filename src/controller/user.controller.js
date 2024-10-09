const service = require("../service/user.service");
const { generateId } = require("../utils/services");
const rg_service = require("../service/register.service");

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
      const price_list = JSON.parse(parsed_data.price_list);
      return {
        ...parsed_data,
        price_list,
        daily_price_list: JSON.parse(parsed_data.custom_price_list),
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  static async addAcc(accData) {
    try {
      const id = accData?.short_name;
      const result = await rg_service.addAcc(accData, id);
      if (result) {
        return { message: "ACC added successfully!", status: 200 };
      } else {
        return { message: "Failed to add ACC!", status: 400 };
      }
    } catch (error) {
      return { error: error.message };
    }
  }

  static async getAccSalesListById(id) {
    try {
      const data = await service.getAccSalesListById(id);
      return data;
    } catch (error) {
      return { error: error.message };
    }
  }
}

module.exports = UserController;
