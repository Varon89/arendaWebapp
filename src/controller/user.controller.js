const service = require("../service/user.service");

class UserController {
  static async getAllAccs() {
    try {
      const result = await service.getAllAccs();
      console.log(result);
    } catch (error) {
      return { error: error.message };
    }
  }

  static async getAccById(req, res) {
    try {
      const { id } = req.params;
      const result = await service.getAccById(id);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = UserController;
