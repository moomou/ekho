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

    var username   = "jackhxs",
        fuzzySet   = FuzzySet(),
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
        function ajaxCall(url, method, data, handler, cb) {
            console.log(data);
            debugger;
            $.ajax({
                type: method,
                url: getServerUrl(),
                data: data
            })
            .done(function(data) {
                debugger;
                if (data.success) {
                    console.log('Cmd succeeded');
                    handler(data.payload);
                } else {
                    console.log('Cmd get failed.');
                    console.log(data);
                }
                if (cb) {
                    cb(msg.success, '??');
                }
            }); // Need network failure
        }

        return {
            // Gets the cmd from server and caches locally.
            getCmds: function(cb) {
                ajaxCall(getServerUrl(), 'GET', null, function(data) {
                    Object.keys(data).map(function(key) {
                        localStorage.setItem(key, JSON.stringify(data[key]));
                        fuzzySet.add(key);
                    });
                }, cb);
            },
            addCmd: function(cmdName, events, cb) {
                ajaxCall(getServerUrl(), 'POST', events, function(data) {
                    localStorage.setItem(events.key, JSON.stringify(events));
                    fuzzySet.add(events.key);
                }, cb);
            },
            delCmd: function(cmdName, cb) {
                ajaxCall(getServerUrl(cmdName, 'DELETE', null, function(data) {
                    localStorage.remove(cmdName);
                }, cb));
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
                    $el.val($el.val() + String.fromCharCode(ev.value));
                }
            }
        }

        var savedEvents = [],
            allEvents = [],
            recording = false;

        return {
            isRecording: function() {
                return recording;
            },
            addEvent: function(event) {
                allEvents.push(event);
            },
            matchKey: function(key) {
                var cmdKey = fuzzySet.get(key);
                console.log("cmdKey: ", cmdKey);
                if (cmdKey && cmdKey[0][0] > 0.65) {
                  console.log("cmdKey: ", cmdKey[0][1]);
                  return cmdKey[0][1];
                }
                return null;
            },
            exeCmd: function(key) {
                var cmd = JSON.parse(localStorage.getItem(key));
                if (cmd.events) {
                    cmd.events.forEach(function(ev) {
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
                console.log("stop recording");
            },
            saveRecording: function() {
                Server.addCmd(username, {
                    key: 'testing',
                    events: savedEvents,
                }, UI.update);
                console.log("save recording");
            }
        };
    })();

    var Speech = (function() {
      var recognition;
      var recognizing;

      var activated = false;
      var init = function() {
        fuzzySet.add("start");
        fuzzySet.add("finish");
        fuzzySet.add("testing");

        recognition = new webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;

        recognizing = false;

        recognition.onstart = function() {
          console.log("onstart");
          recognizing = true;
        }

        recognition.onresult = function(event) {
          var transcript = '',
              parseCmd = function(command) {
                var key = CmdCenter.matchKey(command);
                console.log("key: ", key);
                if (key == "start") {
                  CmdCenter.startRecording();
                } else if (key) {
                  CmdCenter.exeCmd(key);
                }
              };

          if (typeof(event.results) == 'undefined') {
            recognition.onend = null;
            recognition.stop();
            return;
          }

          for (var i = event.resultIndex; i < event.results.length; ++i) {
            transcript += event.results[i][0].transcript;

            if (event.results[i].isFinal) {
              transcript = transcript.trim();

              console.log(transcript);

              // done recording
              if (CmdCenter.isRecording()) {
                key = CmdCenter.matchKey(transcript);
                console.log("is recording: ", key);
                if (key == "finish") {
                  CmdCenter.stopRecording();
                  CmdCenter.saveRecording();
                  activated = 'finish';
                }
                return;
              }

              // begins with hello echo, "record" or command
              if (transcript.indexOf("hello world") >= 0) {
                command = transcript.slice(transcript.indexOf("hello world") + 12);
                if (command == "") {
                  activated = true;
                } else {
                    parseCmd(command);
                }
              } else if (transcript.indexOf("hello world") >= 0) {
                activated = true;
              } else if (activated && transcript) {
                parseCmd(transcript.trim());
              }
            }
          }
        }

        recognition.onerror = function(event) {
          console.log("onerror", event);
        }

        recognition.onend = function() {
          console.log("onend");
          recognizing = false;
        }
      };

      var start = function() {
        recognition.start();
      };

      var stop = function() {
        recognition.stop();
      };

      var isRecognizing = function() {
        return recognizing;
      };

      return {
        init          : init,
        start         : start,
        stop          : stop,
        isRecognizing : isRecognizing
      };

    })();

    console.log('Ekho started.');

    // start the speech recognition engine
    if (!('webkitSpeechRecognition' in window)) {
      console.log("speech api not supported");
    } else {
      Speech.init();

      setInterval(function() {
        if (!Speech.isRecognizing()) {
          Speech.start();
        }
      }, 2000);
    }

    window.addEventListener('click', function(e) {
        var $el = $(e.target);
        console.log('Clicked: ' + $el.getPath());
        if (CmdCenter.isRecording()) {
            CmdCenter.addEvent({
                event: 'click',
                selector: $el.getPath(),
            });
        }
    });

    document.onkeypress = function(e) {
        e = e || window.event;
        var charCode = (typeof e.which == "number") ? e.which : e.keyCode,
            $el = $(document.activeElement);

        if (charCode) {
            console.log('Character typed: ' + String.fromCharCode(charCode));
            if (CmdCenter.isRecording()) {
                CmdCenter.addEvent({
                    event: 'keypress',
                    selector: $el.getPath(),
                    value: charCode,
                });
            }
        }
    };

})(this);
