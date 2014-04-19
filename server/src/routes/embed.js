var util = require('./util'),
    handlebars = require('handlebars'),
    fs = require('fs');

bootstrapTemplate = handlebars.compile(
    fs.readFileSync(__dirname + "/../templates/bootstrap.js.handlebars").toString());

exports.bootstrap = function(req, res, next) {
    function randomId() {
        return "" + Math.floor(Math.random() * 167772159999999).toString(16);
    }

    var jsFile =  bootstrapTemplate({
        SCRIPT_ID       : req.query.scriptId || randomId(),
        DIV_ID          : req.query.divId || randomId(),
        CONTAINER_ID    : req.query.containerId || '',
        PREACTIVATED    : req.query.activated ? 1 : 0,
        DEFAULT_PROFILE : req.query.defaultProfile || '',
        RENDERED     : '<div id="ekho-container"> <form action="" id="search"> <div> <label for="name">Text Input : </label> <div id="info-field"> <input type="text" name="name" id="info-input" class="attention" value="" tabindex="1" placeholder="Search..."/> </div> <div class="effect-copy attention"></div> <div id="button-field"> <input type="submit" id="button-input" class="attention" value="Submit" /> </div> </div> </form> </div>',
    });

    res.setHeader("Content-Type", "text/javascript");
    return res.status(200).end(jsFile);
};
