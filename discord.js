const env = require('dotenv');
env.config();

const constants = require('./constants');
const {sequelize, DataTypes, Op } = require('sequelize');
const Discord = require('discord.js');
const { Client, Intents } = require('discord.js');
const moment = require('moment');
const db = require('./datebase');

const client = new Client({ intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_VOICE_STATES,
        Intents.FLAGS.DIRECT_MESSAGE_REACTIONS
    ] });

let textChannel;

client.once('ready', () => {
    textChannel = client.channels.cache.get(process.env.textChannelId);
});

const UserStatus = db.define('userStatus', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        notNull: true,
    },
    user_id: {
        type: DataTypes.BIGINT,
    },
    status: {
        type: DataTypes.INTEGER
    },
    start_time: {
        type: DataTypes.INTEGER,
    }
}, {
    tableName: 'user_status'
});

const ChannelRecord = db.define('channelRecord', {
    id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        notNull: true,
    },
    user_id: {
        type: DataTypes.BIGINT,
    },
    start_time: {
        type: DataTypes.BIGINT,
    },
    end_time: {
        type: DataTypes.BIGINT,
    },
}, {
    tableName: 'channel_record'
});

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    db.authenticate()
        .then(() => {
            console.log('connected to db');
        }).catch(error => {
    })
});

client.on('messageCreate', msg => {
    if (msg.content === 'ping') {
        msg.reply('pong');
    }

    switch (msg.content) {
        case 'today':
        case '今天':
            checkTimeRangeRecord(
                msg.author.id,
                moment().startOf('day').unix(),
                moment().endOf('day').unix(),
                '今天',
                true
            ).then(message => {
                msg.reply(message);
            }).catch(error => {
                recordError(error, 'checkTimeRangeRecord catch error');
            });

            break;

        case 'yesterday':
        case '昨天':
            checkTimeRangeRecord(
                msg.author.id,
                moment().subtract(1, 'days').startOf('day').unix(),
                moment().subtract(1, 'days').endOf('day').unix(),
                '昨天'
            ).then(message => {
                msg.reply(message);
            }).catch(error => {
                recordError(error, 'checkTimeRangeRecord catch error');
            });

            break;

        case 'week':
        case '這個禮拜':
        case '禮拜':
        case '星期':
        case '周':
            checkTimeRangeRecord(
                msg.author.id,
                moment().startOf('week').unix(),
                moment().endOf('week').unix(),
                '這禮拜'
            ).then(message => {
                msg.reply(message);
            }).catch(error => {
                recordError(error, 'checkTimeRangeRecord catch error');
            });

            break;

        case 'month':
        case '月':
        case '本月':
        case '這個月':
            checkTimeRangeRecord(
                msg.author.id,
                moment().startOf('month').unix(),
                moment().endOf('month').unix(),
                '這個月'
            ).then(message => {
                msg.reply(message);
            }).catch(error => {
                recordError(error, 'checkTimeRangeRecord catch error');
            });

            break;

        default:
            let searchHourMatch = msg.content.match(/^[Ii]n ([1-9]{0,1}[0-9]) hours/);
            if (searchHourMatch) {
                checkTimeRangeRecord(
                    msg.author.id,
                    moment().subtract(searchHourMatch[1], 'hours').unix(),
                    moment().unix(),
                    searchHourMatch[1] + '小時內',
                    true
                ).then(message => {
                    msg.reply(message);
                }).catch(error => {
                    recordError(error, 'checkTimeRangeRecord catch error');
                });

                break;
            }

            let thisYearDateMatch = msg.content.match(/^(0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])$/);
            if (thisYearDateMatch) {
                let month = thisYearDateMatch[1];
                let day = thisYearDateMatch[2];
                let specifyDate = moment(moment().year() + '-' + month + '-' + day, 'YYYY-MM-DD');

                checkTimeRangeRecord(
                    msg.author.id,
                    specifyDate.startOf('day').unix(),
                    specifyDate.endOf('day').unix(),
                    month + '月' + day + '號'
                ).then(message => {
                    msg.reply(message);
                }).catch(error => {
                    recordError(error, 'checkTimeRangeRecord catch error');
                });

                break;
            }
    }
});

client.on('voiceStateUpdate', (oldState, newState) => {
    if (newState.channelId === process.env.recordChannelId) {
        UserStatus.findOne({ where: { user_id: newState.member.user.id }})
            .then((obj) => {
                if (obj) {
                    if (obj.status !== constants.userStatus.status.notReading.value) {
                        textChannel.send('voiceStateUpdate newState　error, user_id: ' +　
                            newState.member.user.id + ', status: ' + obj.status + ', start_time: ' + obj.start_time);
                    }

                    obj.update({
                        status: constants.userStatus.status.reading.value,
                        start_time: moment().unix(),
                    });
                } else {
                    UserStatus.create({
                        user_id: newState.member.user.id,
                        status: constants.userStatus.status.reading.value,
                        start_time: moment().unix(),
                    });
                }
            });
    } else if (oldState.channelId === process.env.recordChannelId) {
        UserStatus.findOne({ where: { user_id: newState.member.user.id }})
            .then((obj) => {
                if (obj) {
                    if ((obj.dataValues.status === constants.userStatus.status.reading.value) && (obj.dataValues.start_time !== null)) {
                        ChannelRecord.create({
                            user_id: newState.member.user.id,
                            start_time: obj.dataValues.start_time,
                            end_time: moment().unix(),
                        });
                    } else {
                        textChannel.send('leave channel error, user_id: ' +
                            newState.member.user.id + ', status: ' + obj.status + ', start_time: ' + obj.start_time);
                    }

                    obj.update({
                        status: constants.userStatus.status.notReading.value,
                    });
                } else {
                    textChannel.send('leave channel but user status node found, user_id: ' +
                        newState.member.user.id + ', status: ' + obj.status + ', start_time: ' + obj.start_time);

                    UserStatus.create({
                        user_id: newState.member.user.id,
                        status: constants.userStatus.status.notReading.value,
                        start_time: null,
                    });
                }
            });
    }
});

function getCurrentReadingStart(userId) {
    return new Promise((resolve, reject) => {
        UserStatus.findOne({ where: { user_id: userId }})
            .then((obj) => {
                resolve({
                    status: ((obj) && (obj.dataValues)) ? obj.dataValues.status : constants.userStatus.status.notReading.value,
                    startTime: ((obj) && (obj.dataValues)) ? obj.dataValues.start_time : null,
                });
            });
    });
}

function checkTimeRangeRecord(userId, start, end, rangeName = '這時段', ifCountCurrent = false) {
    return new Promise((resolve, reject) => {
        ChannelRecord.findAll({ where: {
                user_id: userId,
                [Op.or]: [
                    {
                        start_time: {
                            [Op.between]: [
                                start,
                                end,
                            ],
                        },
                    },
                    {
                        end_time: {
                            [Op.between]: [
                                start,
                                end,
                            ],
                        },
                    }
                ],
            }}).then((records) => {
            let totalSecond = 0;
            if (records.length > 0) {
                records.forEach(record => {
                    if (record.dataValues.end_time > end) {
                        record.dataValues.end_time = end;
                    }

                    if (record.dataValues.start_time < start) {
                        record.dataValues.start_time = start;
                    }

                    totalSecond += record.dataValues.end_time - record.dataValues.start_time;
                });
            }

            if (ifCountCurrent === false) {
                if (totalSecond === 0) {
                    resolve(rangeName + '沒有讀書紀錄哦');
                } else {
                    resolve(rangeName + '讀了' + secondsConvertHourInfo(totalSecond));
                }
            } else if (ifCountCurrent === true) {
                getCurrentReadingStart(userId).then(currentReading => {
                    if (
                        (currentReading.status === constants.userStatus.status.reading.value) &&
                        (currentReading.startTime !== null)
                    ) {
                        let currentTime = moment().unix();
                        if (currentTime > end) {
                            currentTime = end;
                        }

                        if (currentReading.startTime < start) {
                            currentReading.startTime = start;
                        }

                        totalSecond += Math.max(currentTime - currentReading.startTime, 0);
                    }

                    if (totalSecond === 0) {
                        resolve(rangeName + '沒有讀書紀錄哦');
                    } else {
                        resolve(rangeName + '讀了' + secondsConvertHourInfo(totalSecond));
                    }
                }).catch(error => {
                    recordError(error, 'getCurrentReadingStart catch error');
                });
            }
        });
    });
}

function recordError(error, errorType = null) {
    if (errorType) {
        console.log(errorType);
        textChannel.send(errorType);
    }

    console.log(error);
    textChannel.send(error);
}

function secondsConvertHourInfo(second) {
    let hours = Math.floor(second / 3600);
    let messages = [];
    if (hours) {
        second -= hours * 3600;
        messages.push(hours + '小時 ');
    }

    let minutes = Math.floor(second / 60);
    if (minutes) {
        second -= minutes * 60;
        messages.push(minutes + '分鐘');
    }

    messages.push(second + '秒');

    return messages.join(',');
}

client.login(process.env.bot_token);
