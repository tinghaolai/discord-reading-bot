const { Sequelize } = require('sequelize');

module.exports = new Sequelize('', '', '', {
    dialect: 'mysql',
    host: 'localhost',
    port: '3307'
});
