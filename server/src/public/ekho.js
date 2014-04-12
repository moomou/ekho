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

    var username   = null,
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
            getCmds: function(cb) {
                ajaxCall(getServerUrl(), 'GET', function(data) {
                    Object.keys(data).map(function(key) {
                        localStorage.setItem(key, JSON.stringify(data[key]));
                        fuzzySet.add(key);
                    });
                }, cb);
            },
            addCmd: function(cmdName, events, cb) {
                ajaxCall(getServerUrl(), 'POST', function(data) {
                    localStorage.setItem(key, JSON.stringify(events));
                    fuzzySet.add(key);
                }, cb);
            },
            delCmd: function(cmdName, cb) {
                ajaxCall(getServerUrl(cmdName, 'DELETE', function(data) {
                    localStorage.remove(key);
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
                    $el.val($el.val() + ev.value);
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
            matchKey: function(key) {
                var cmdKeys = fuzzySet.get(key);
                if (cmdKey && cmdKey[0] > 0.65) {
                  return cmdKey[1];
                }
                return null;
            },
            exeCmd: function(key) {
                var events = JSON.parse(localStorage.get(key));
                events.each(function(ev) {
                    replayEvent(ev);
                });
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
                Server.addCmd(username, savedEvents, UI.update);
            }
        };
    })();

    var Speech = (function() {
      var recognition;
      var recognizing;

      var init = function() {
        recognition = new webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;

        recognizing = false;

        recognition.onstart = function() {
          console.log("onstart");
          recognizing = true;
        }

        recognition.onresult = function(event) {
          var transcript = '';
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

              if (CmdCenter.isRecording()) {
                // done recording
                key = CmdCenter.matchKey(transcript);
                if (key == "done") {
                  CmdCenter.stopRecording();
                  CmdCenter.saveRecording();
                }
                return;
              }

              // begins with hello echo, "record" or command
              if (transcript.indexOf("hello echo") >= 0) {
                command = transcript.slice(transcript.indexOf("hello echo") + 11);
                key = CmdCenter.matchKey(command);
                if (key == "record") {
                  CmdCenter.startRecording();
                } else {
                  CmdCenter.exeCmd(key);
                }
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

      //function startButton(event) {
        //if (recognizing) {
          //recognition.stop();
        //}
        //else {
          //recognition.start();
        //}
      //}

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
            if (CmdCenter.isRecording()) {
                allEvents.push({
                    event: 'keypress',
                    selector: $el.getPath(),
                    value: charCode,
                });
            }
        }
    };

})(this);
