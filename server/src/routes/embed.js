var util = require('./util'),
    handlebars = require('handlebars');

bootstrapTemplate = handlebars.compile(
    fs.readFileSync("__dirname/../templates/bootstrap.js.handlebars").toString())

exports.bootstrap = function(req, res, next) {
    var ui = req.query.ui;
};
