'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ChannelRecord extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  ChannelRecord.init({
    user_id: DataTypes.BIGINT,
    start_time: DataTypes.BIGINT,
    end_time: DataTypes.BIGINT
  }, {
    sequelize,
    modelName: 'ChannelRecord',
    tableName: 'channel_record'
  });
  return ChannelRecord;
};
