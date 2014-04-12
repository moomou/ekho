var util = require('./util'),
    redis = require('../db').redis;

exports.show = function(req, res, next) {
    var user = req.params.user,
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

        return res.json(util.getResponse(data));
    });
};

exports.add = function(req, res, next) {
    var user = req.params.user,
        url = req.params.url,
        cmdKey = util.getRedisKey(user, url),
        newCmd = req.body;

    redis.hset(cmdKey, newCmd.key, JSON.stringify(newCmd), function(err, data) {
        if (err) {
            return res.json(util.getResponse(null, '500'));
        }

        return res.json(util.getResponse(null, '201'));
    });
};

exports.remove = function(req, res, next) {
    var user = req.params.user,
        url = req.params.url,
        cmdKey = util.getRedisKey(user, url),
        cmdId = req.params.cmdId;

    redis.hdel(cmdKey, cmdId, function(err, data) {
        if (err) {
            return res.json(util.getResponse(null, '500'));
        }

        return res.json(util.getResponse(null, '204'));
    });
};
