var util = require('./util'),
    handlebars = require('handlebars'),
    fs = require('fs');

bootstrapTemplate = handlebars.compile(
    fs.readFileSync(__dirname + "/../templates/bootstrap.js.handlebars").toString())

exports.bootstrap = function(req, res, next) {
    function randomId() {
        return "" + Math.floor(Math.random() * 167772159999999).toString(16);
    }

    var jsFile =  bootstrapTemplate({
        ENABLE_UI  : req.query.ui,
        SCRIPT_ID  : req.query.scriptId || randomId(),
        DIV_ID     : req.query.divId || randomId(),
        RENDERED   : '', // to change to UI later
        SERVER_URL : 'http://localhost:3000/'
    });

    res.setHeader("Content-Type", "text/javascript");
    return res.status(200).end(jsFile);
};
