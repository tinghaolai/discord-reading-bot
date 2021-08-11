const {sequelize, DataTypes, Op } = require('sequelize');
const Discord = require('discord.js');
const { token } = require('./token.json');
const { Client, Intents } = require('discord.js');
const moment = require('moment');
const db = require('./datebase');
const recordChannelId = '';

const client = new Client({ intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_VOICE_STATES,
    Intents.FLAGS.DIRECT_MESSAGE_REACTIONS
] });

let textChannel;

client.once('ready', () => {
    textChannel = client.channels.cache.get('');
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
            console.log('error');
            console.log(error);
    })
});


client.on('message', msg => {
    if (msg.content === 'ping') {
        msg.reply('pong');
    }

    console.log(msg.author.id);

    switch (msg.content) {
        case 'today':
        case '今天':
            ChannelRecord.findAll({ where: {
                user_id: msg.author.id,
                start_time: {
                    [Op.between]: [moment().startOf('day').unix(), moment().endOf('day').unix()],
                }
            }}).then((records) => {
                let totalSecond = 0;
                if (records.length > 0) {
                    records.forEach(record => {
                        totalSecond += record.dataValues.end_time - record.dataValues.start_time;
                    });
                }

                UserStatus.findOne({ where: { user_id: msg.author.id }})
                    .then((obj) => {
                        if (
                            (obj) &&
                            (obj.dataValues.status === 1) &&
                            (obj.dataValues.start_time !== null)
                        ) {
                            totalSecond += moment().unix() - obj.dataValues.start_time;
                        }

                        if (totalSecond === 0) {
                            msg.reply('今天還沒有開始讀哦');
                        } else {
                            let hours = Math.floor(totalSecond / 3600);
                            let messages = [];
                            if (hours) {
                                totalSecond -= hours * 3600;
                                messages.push(hours + '小時 ');
                            }

                            let minutes = Math.floor(totalSecond / 60);
                            if (minutes) {
                                totalSecond -= minutes * 60;
                                messages.push(minutes + '分鐘');
                            }

                            messages.push(totalSecond + '秒');
                            msg.reply('今天讀了' + messages.join(','))
                        }
                    });
        });

            break;
        case '%hours ago':
        case '%小時前':
        case 'week':
        case '禮拜':
        case 'month':
        case '月':
        case 'yesterday':
        case '昨天':
            msg.reply('還沒做好...');
            break;
    }
});

client.on('voiceStateUpdate', (oldState, newState) => {
    if (newState.channelId === recordChannelId) {
        UserStatus.findOne({ where: { user_id: newState.member.user.id }})
            .then((obj) => {
                if (obj) {
                    if (obj.dataValues.start_time === null || obj.dataValues.start_time < moment().startOf('day').unix()) {
                        textChannel.send(`<@${newState.member.user.id}> 哈囉！今天也一起加油吧！`);
                    }

                    obj.update({
                        status: 1,
                        start_time: moment().unix(),
                    });
                } else {
                    textChannel.send(`<@${newState.member.user.id}> 哈囉！今天也一起加油吧！`);

                    UserStatus.create({
                        user_id: newState.member.user.id,
                        status: 1,
                        start_time: moment().unix(),
                    });
                }
            });
    } else if (oldState.channelId === recordChannelId) {
        UserStatus.findOne({ where: { user_id: newState.member.user.id }})
            .then((obj) => {
                if (obj) {
                    if ((obj.dataValues.status === 1) && (obj.dataValues.start_time !== null)) {
                        ChannelRecord.create({
                            user_id: newState.member.user.id,
                            start_time: obj.dataValues.start_time,
                            end_time: moment().unix(),
                        });
                    }

                    obj.update({
                        status: 0,
                    });
                } else {
                    UserStatus.create({
                        user_id: newState.member.user.id,
                        status: 0,
                        start_time: null,
                    });
                }
            });
    }
});

client.login(token);
