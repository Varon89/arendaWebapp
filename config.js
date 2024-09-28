const mysql = require("mysql");

const config = {
  host: "161.97.137.120",
  user: "foodify",
  password: "Admin@1234",
  database: "arenda_2",
  charset: "utf8mb4",
};

const pool = mysql.createPool(config);

pool.getConnection((err, connection) => {
  if (err) {
    console.error(err);
  } else {
    console.log("Connected to database");
    connection.release();
  }
});

module.exports = pool;
