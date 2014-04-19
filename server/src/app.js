require('express-namespace');

var express    = require('express'),
    json       = require('express-json'),
    bodyParser = require('body-parser'),
    main       = require('./routes/main'),
    embed      = require('./routes/embed'),
    app        = express();

app.version = '/v0';
app.set('port', process.env.PORT || 3000);
app.use(json());
app.use(bodyParser());

var addCORSHeaders = function(req, res, next) {
    res.header('Access-Control-Allow-Origin',
        req.headers.origin || req.headers.host);
    res.header('Access-Control-Allow-Methods',
        'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers',
        'DNT,X-Mx-ReqToken,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Referer,x-access-token')
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
};

app.all('*', addCORSHeaders);

app.use('/static', express.static(__dirname + '/public'));

app.get('/embed/bootstrap.js', function(req, res, next) {
    return embed.bootstrap(req, res, next);
});

app.get('/:userId/:url/commands', function(req, res, next) {
    // return all command
    return main.show(req, res, next);
});
app.post('/:userId/:url/commands', function(req, res, next) {
    // uses redis list api to insert and remove commands
    return main.add(req, res, next);
});
app.del('/:userId/:url/commands/:cmdId', function(req, res, next) {
    // pop from redis
    return main.remove(req, res, next);
});

exports.app = app;
