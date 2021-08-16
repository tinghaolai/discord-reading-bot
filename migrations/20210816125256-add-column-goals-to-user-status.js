'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return [
      queryInterface.addColumn(
          'user_status',
          'week_goal',
          {
            type: Sequelize.BIGINT,
            after: 'start_time'
          }
        ),
      queryInterface.addColumn(
          'user_status',
          'month_goal',
          {
            type: Sequelize.BIGINT,
            after: 'start_time'
          }
      ),
    ];
  },

  down: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('user_status','week_goal'),
      queryInterface.removeColumn('user_status','month_goal'),
    ]);
  }
};
