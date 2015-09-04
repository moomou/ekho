var redis = require('redis');
var REDIS_URL = process.env.REDIS_URL;
var HOST = REDIS_URL.split(':')[0];
var PORT = REDIS_URL.split(':')[1];
exports.redis = redis.createClient(PORT, HOST);

