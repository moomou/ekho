exports.getRedisKey = function(user, url) {
    return user + ':' + encodeURI(url);
};

exports.getResponse = function(res, httpcode) {
    httpcode = httpcode || '200';
    return {
        returnCode: httpcode,
        success: httpcode[0] == '2' ? true : false,
        payload: res
    };
};
