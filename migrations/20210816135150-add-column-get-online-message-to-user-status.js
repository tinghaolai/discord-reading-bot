'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        return queryInterface.addColumn(
            'user_status',
            'get_online_message',
            {
                type: Sequelize.INTEGER,
                after: 'week_goal'
            }
        );
    },

    down: async (queryInterface, Sequelize) => {
        return queryInterface.removeColumn(
            'user_status',
            'get_online_message'
        );
    }
};
