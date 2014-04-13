var util = require('./util'),
    redis = require('../db').redis;

exports.show = function(req, res, next) {
    var user = req.params.userId,
        url = req.params.url,
        cmdKey = util.getRedisKey(user, url);

    redis.hgetall(cmdKey, function(err, data) {
        if (err) {
            return res.json(util.getResponse(null, '500'));
        }

        if (!data) { // empty
            return res.json(util.getResponse({}));
        }

        Object.keys(data).map(function(key) {
            data[key] = JSON.parse(data[key]);
        });

        res.setHeader("Content-Type", "application/json");
        return res.end(JSON.stringify(util.getResponse(data, '200')));
    });
};

exports.add = function(req, res, next) {
    var user = req.params.userId,
        url = req.params.url,
        cmdKey = util.getRedisKey(user, url),
        newCmd = req.body;

    console.log(newCmd);
    redis.hset(cmdKey, newCmd.key, JSON.stringify(newCmd), function(err, data) {
        if (err) {
            return res.json(util.getResponse(null, '500'));
        }

        res.setHeader("Content-Type", "application/json");
        return res.end(JSON.stringify(util.getResponse(null, '201')));
    });
};

exports.remove = function(req, res, next) {
    var user = req.params.userId,
        url = req.params.url,
        cmdKey = util.getRedisKey(user, url),
        cmdId = req.params.cmdId;

    redis.hdel(cmdKey, cmdId, function(err, data) {
        if (err) {
            return res.json(util.getResponse(null, '500'));
        }

        res.setHeader("Content-Type", "application/json");
        return res.end(JSON.stringify(util.getResponse(null, '204')));
    });
};
