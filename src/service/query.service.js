const db = require("../../config");

class QueryService {
  static async dbQuery(query, values) {
    return new Promise((resolve, reject) => {
      db.query(query, values, (err, result) => {
        if (err) {
          console.error("Error executing query:", err);
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  static dbQuery1(conn, query, values) {
    return new Promise((resolve, reject) => {
      conn.query(query, values, (err, result) => {
        if (err) {
          console.error("Error executing query:", err);
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  static async transaction() {
    const getConnection = async () => {
      return new Promise((resolve, reject) => {
        db.getConnection((err, conn) => {
          if (err) {
            console.error("Error getting connection:", err);
            return reject(err);
          }
          resolve(conn);
        });
      });
    };

    const beginTransaction = async (conn) => {
      return new Promise((resolve, reject) => {
        conn.beginTransaction((err) => {
          if (err) {
            console.error("Error beginning transaction:", err);
            return reject(err);
          }
          resolve(true);
        });
      });
    };

    const commit = async (conn) => {
      return new Promise((resolve, reject) => {
        conn.commit((err) => {
          if (err) {
            console.error("Error committing transaction:", err);
            return reject(err);
          }
          resolve(true);
        });
      });
    };

    const rollback = async (conn) => {
      return new Promise((resolve) => {
        conn.rollback(() => {
          resolve(true);
        });
      });
    };

    const release = async (conn) => {
      return new Promise((resolve) => {
        conn.release();
        resolve(true);
      });
    };

    try {
      const conn = await getConnection();
      await beginTransaction(conn);
      return { conn, commit, rollback, release };
    } catch (err) {
      console.error("Transaction error:", err);
      throw err;
    }
  }
}

module.exports = QueryService;
