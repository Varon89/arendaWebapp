const QueryService = require("./query.service");

class UserService {
  static async getAllAccs() {
    const query = "SELECT * FROM accounts";
    const result = await QueryService.dbQuery(query);
    return result;
  }

  static async getAccById(id) {
    const query = "SELECT * FROM accounts WHERE id = ?";
    const result = await QueryService.dbQuery(query, [id]);
    return result;
  }
}

module.exports = UserService;
