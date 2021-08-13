const { Sequelize } = require('sequelize');

module.exports = new Sequelize(process.env.db_database, process.env.db_user, process.env.db_user_password, {
    dialect: process.env.db_dialect,
    host: process.env.db_host,
    port: process.env.db_port,
});
