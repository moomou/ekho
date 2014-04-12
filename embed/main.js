(function(ekho) {
    // https://stackoverflow.com/questions/2068272/getting-a-jquery-selector-for-an-element
    jQuery.fn.getPath = function () {
        if (this.length != 1) throw 'Requires one element.';

        var path, node = this;
        while (node.length) {
            var realNode = node[0], name = realNode.localName;
            if (!name) break;
            name = name.toLowerCase();

            var parent = node.parent();

            var siblings = parent.children(name);
            if (siblings.length > 1) {
                name += ':eq(' + siblings.index(realNode) + ')';
            }

            path = name + (path ? '>' + path : '');
            node = parent;
        }

        return path;
    };

    var allEvents = [],
        recording = false,
        username = null,
        fuzzySet = FuzzySet(),
        SERVER_URL = 'http://localhost:3000';

    var UI = (function() {
        function update(state, msg) {
        }

        return {
            update: function(state, msg) {
            },
            updateOK: function(msg) {
            },
            updateFail: function(msg) {
            }
        };
    });

    var Server = (function() {
        function getServerUrl(cmdKey) {
            return SERVER_URL + "/" +
                    username + "/" +
                    encodeURIComponent(document.URL) +
                    "/commands" + 
                    (cmdKey ? "/" + cmdKey : "");
        }
        function ajaxCall(url, method, handler, cb) {
            $.ajax({
                type: method,
                url: getServerUrl(),
            })
            .done(function(data) {
                if (data.success) {
                    console.log('Cmd succeeded');
                    handler(data.payload);
                } else {
                    console.log('Cmd get failed.');
                }
                if (cb) {
                    cb(msg.success, '??');
                }
            }); // Need network failure
        }

        return {
            // Gets the cmd from server and caches locally.
            getCmd: function(cb) {
                ajaxCall(getServerUrl(), 'GET', function(data) {
                    Object.keys(data).map(function(key) {
                        localStorage.setItem(key, JSON.stringify(data[key]));
                        fuzzySet.add(key);
                    });
                }, cb);
            },
            addCmd: function(cmdName, events, cb) {
                ajaxCall(getServerUrl, 'POST', function(data) {
                    localStorage.setItem(key, JSON.stringify(events));
                    fuzzySet.add(key);
                }, cb);
            },
            delCmd: function(cmdName, cb) {
                ajaxCall(getServerUrl(cmdName, 'DELETE', function(data) {
                    localStorage.remove(key);
                }, cb);
            }
        };
    })();

    var CmdCenter = (function() {
        function replayEvent(ev) {
            switch (ev.event) {
                case 'click': {
                    $(ev.selector).click();
                }
                case 'keypress': {
                    var $el = $(ev.selector);
                    $el.val($el.val() + ev.value);
                }
            }
        }

        var savedEvents = [];

        return {
            subscribe: function() {
            },
            exeCmd: function(key) {
                var cmdKeys = fuzzySet.get(key);
                if (cmdKey && cmdKey[0] > 0.65) {
                    var events = JSON.parse(localStorage.get(cmdKey[1]));
                    events.each(function(ev) {
                        replayEvent(ev);
                    });
                }
            },
            startRecording: function() {
                recording = true;
            },
            stopRecording: function() {
                recording = false;
                savedEvents = allEvents.slice();
                allEvents = [];
            },
            saveRecording: function() {
                Server.addCmd(username, savedEvents, UI.update});
            }
        };
    })();

    console.log('Ekho started.');

    window.addEventListener('click', function(e) {
        var $el = $(e.target);
        console.log('Clicked: ' + $el.getPath());
        if (recording) {
            allEvents.push({
                event: 'click',
                selector: $el.getPath(),
            });
        }
    });

    document.onkeypress = function(e) {
        e = e || window.event;
        var charCode = (typeof e.which == "number") ? e.which : e.keyCode;
        if (charCode) {
            console.log('Character typed: ' + String.fromCharCode(charCode));
            if (recording) {
                allEvents.push({
                    event: 'keypress',
                    selector: $el.getPath(),
                    value: charCode,
                });
            }
        }
    };

})(this);
