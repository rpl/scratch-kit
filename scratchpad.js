/*jshint asi:true globalstrict: true */

'use strict'

let SCRATCHKIT_URI = 'resource:///modules/devtools/scratchpad-manager.jsm'
let { Cu } = require('chrome')
let { ScratchpadManager } = Cu.import(SCRATCHKIT_URI)

let { Promise: promise } = Cu.import("resource://gre/modules/Promise.jsm", {});

function Scratchpad(options) {
  let { sandbox, text, filename, unload, open } = options
  let window = ScratchpadManager.openScratchpad({
    text: text || ''
  })

  window.addEventListener('DOMContentLoaded', function onready() {
    window.addEventListener('unload', function onunload() {
      window.removeEventListener('unload', onunload)
      unload && unload()
    })

    window.removeEventListener('DOMContentLoaded', onready)
    let scratchpad = window.Scratchpad
    let { writeAsComment, openScratchpad } = scratchpad
    open = open || openScratchpad

    // Monkey patch scratchpad
    Object.defineProperties(scratchpad, {
      evaluate: {
        configurable: true,
        value: function (aString) {
        let deferred = promise.defer();

        try {
          deferred.resolve([aString, undefined, sandbox.eval(aString)]);
        } catch(e) {
          console.log("ERROR*************", e);
          deferred.resolve([aString, e]);
        }

        return deferred.promise;
        }
      },
      openScratchpad: {
        configurable: true,
        value: function() {
          return open.call(this)
        }
      },
      display: {
        configurable: true,
        value: function () {
          this.execute().then(([aString, aError, aResult]) => {
            if (aError) {
              this.writeAsComment(aError);
            } else {
              this.writeAsComment(aResult);
            }
          });
        }
      }
    })
  })

  return window
}
exports.Scratchpad = Scratchpad

exports.ScratchpadManager = ScratchpadManager
