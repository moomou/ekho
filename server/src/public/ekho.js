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

    var SERVER_URL = 'https://ekho.io',
        username   = localStorage.getItem('ekho:profile') || null,
        fuzzySet   = FuzzySet();

    var UI = (function() {
        function openInfo(placeholder) {
          $('#info-input').val('');
          $('#info-input').attr('placeholder', placeholder);
          $('#info-input').addClass('expanded');
        }

        function closeInfo() {
          $('#info-input').removeClass('expanded');
        }

        function clearClasses() {
          $('#info-input').removeClass();
          $('#button-input').removeClass();
          $('.effect-copy').removeClass('error ready attention');
        }

        function activate() {
          console.log('activated');
          $('.effect-copy').css('transition', 'all 0.5s ease-in');
          $('.effect-copy').addClass('activated');
          setTimeout(function() {
            $('.effect-copy').css('transition', 'none');
            $('.effect-copy').removeClass('activated');
          }, 2000);
        }

        function startPulse() {
          setInterval(function() {
            $('.effect-copy').addClass('pulse');
            setTimeout(function() {
              $('.effect-copy').removeClass('pulse');
            }, 1000);
          }, 2000);
        }


        return {
            updateOK: function(msg) {
              clearClasses();
              $('#info-input').addClass('ready');
              $('#button-input').addClass('ready');
              $('.effect-copy').addClass('ready');
              activate();
            },
            updateFail: function(msg) {
              clearClasses();
              $('#info-input').addClass('error');
              $('#button-input').addClass('error');
              $('.effect-copy').addClass('error');
              activate();
            },
            updateAttention: function(msg) {
              clearClasses();
              $('#info-input').addClass('attention');
              $('#button-input').addClass('attention');
              $('.effect-copy').addClass('attention');
              activate();
            },
            openInfo: openInfo,
            closeInfo: closeInfo,
            activate: activate,
            startPulse: startPulse
        };
    })();

    var Server = (function() {
        function getServerUrl(cmdKey) {
            return SERVER_URL + "/" +
                    username + "/" +
                    encodeURIComponent(window.location.origin) +
                    "/commands" +
                    (cmdKey ? "/" + cmdKey : "");
        }
        function ajaxCall(url, method, data, handler, cb) {
            console.log(data);
            $.ajax({
                type: method,
                url: getServerUrl(),
                data: data
            })
            .done(function(result) {
                if (result.success) {
                    console.log('Cmd succeeded');
                    handler(result.payload);
                } else {
                    console.log('Cmd get failed.');
                    console.log(result);
                }
                if (cb) {
                    cb(result.success, '??');
                }
            })
            .error(function() {
              UI.updateError('network error');
            });
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
                console.log(getServerUrl());
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
            var $el = $(ev.selector);

            switch (ev.event) {
                case 'click': {
                    if ($el[0].click) {
                        $el[0].click();
                    } else {
                       $el.click();
                    }
                    break;
                }
                case 'keypress': {
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
                UI.activate();
                var cmd = JSON.parse(localStorage.getItem(key));
                if (cmd && cmd.events) {
                    cmd.events.forEach(function(ev) {
                        replayEvent(ev);
                    });
                }
            },
            startRecording: function() {
                UI.activate();
                recording = true;
                console.log("start recording");
            },
            stopRecording: function() {
                recording = false;
                savedEvents = allEvents.slice();
                allEvents = [];
                console.log("stop recording");
            },
            saveRecording: function(key) {
                Server.addCmd(username, {
                    key: key,
                    events: savedEvents,
                }, UI.update);
                console.log("save recording");
            }
        };
    })();

    var Speech = (function() {
      var recognition;
      var recognizing;

      var activated = localStorage.getItem('ekho:preactivate');
      var init = function() {
        fuzzySet.add("record");
        fuzzySet.add("finish");

        recognition = new webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;

        recognizing = false;

        recognition.onstart = function() {
          console.log("onstart");
          UI.updateOK('Ready!');
          recognizing = true;
        };

        recognition.onresult = function(event) {
          var transcript = '',
              parseCmd = function(command) {
                console.log("command: ", command);
                var key = CmdCenter.matchKey(command);
                console.log("key: ", key);
                if (key === "record") {
                  CmdCenter.startRecording();
                } else if (key) {
                  CmdCenter.exeCmd(key);
                }
              };

          $('#button-input').on('click', function(e) {
              e.preventDefault();
              commandName = $('#info-input').val();
              UI.updateOK('Command saved');
              UI.closeInfo();
              CmdCenter.saveRecording(commandName);
          });

          if (typeof(event.results) === 'undefined') {
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

                if (key === "finish") {
                  CmdCenter.stopRecording();
                  UI.updateAttention('Enter command');
                  UI.openInfo('Enter command name...');
                }
                return;
              }

              // begins with hello echo, "record" or command
              if (transcript.indexOf("hello echo") >= 0) {
                  console.log('Ekho listening...');
                  var command = transcript.slice(transcript.indexOf("hello echo") + 11);
                  if (command === "") {
                      UI.activate();
                      activated = true;
                  } else {
                      parseCmd(command);
                  }
              } else if (transcript.indexOf("hello echo") >= 0) {
                  UI.activate();
                  activated = true;
              } else if (activated && transcript) {
                  parseCmd(transcript.trim());
              }
            }
          }
        };

        recognition.onerror = function(event) {
          console.log("onerror", event);
          UI.updateFail('Failed');
        };

        recognition.onend = function() {
          console.log("onend");
          recognizing = false;
          UI.updateFail('Failed');
        };
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

    // App start
    
    console.log('Ekho started.');

    if (username === null) {
        UI.openInfo('Enter username...');
        $('#button-input').on('click', function(e) {
            e.preventDefault();
            username = $('#info-input').val() || '__default';
            console.log("print username", username);
            UI.closeInfo();

            // load user saved commands
            Server.getCmds(function() {
                $('#button-input').unbind('click');
            });
        });
    } else {
        UI.closeInfo();
        Server.getCmds(function() {
            $('#button-input').unbind('click');
        });
    }

    // start the speech recognition engine
    if (!('webkitSpeechRecognition' in window)) {
      console.log("speech api not supported");
    } else {
      Speech.init();

      setInterval(function() {
        if (username !== null && !Speech.isRecognizing()) {
          Speech.start();
        }
      }, 2000);
    }

    // Catching click event
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

    // Catching keyboard event
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
