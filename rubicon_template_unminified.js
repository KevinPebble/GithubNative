"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

(function e(t, n, r) {
    function s(o, u) {
        if (!n[o]) {
            if (!t[o]) {
                var a = typeof require == "function" && require;if (!u && a) return a(o, !0);if (i) return i(o, !0);var f = new Error("Cannot find module '" + o + "'");throw f.code = "MODULE_NOT_FOUND", f;
            }var l = n[o] = { exports: {} };t[o][0].call(l.exports, function (e) {
                var n = t[o][1][e];return s(n ? n : e);
            }, l, l.exports, e, t, n, r);
        }return n[o].exports;
    }var i = typeof require == "function" && require;for (var o = 0; o < r.length; o++) {
        s(r[o]);
    }return s;
})({ 1: [function (require, module, exports) {
        var getCurrentDocument = require('./GetCurrentDocument');

        /**
         * @function generateIframe
         * @param {opts} hash of props: {string} id, {string} dimensions
         * @returns {object} contentDocument the generated 
         * iframe that has been appened to the dom
         * @summary creates a friendly iframe to inject the ad into
         */
        var CreateContainerFrame = function CreateContainerFrame(opts) {
            var _document = getCurrentDocument();
            var creativeFrame = _document.createElement('iframe');

            var x = 0;
            var y = 0;

            if (opts && opts.dimensions) {
                var _opts$dimensions$spli = opts.dimensions.split('x');

                var _opts$dimensions$spli2 = _slicedToArray(_opts$dimensions$spli, 2);

                x = _opts$dimensions$spli2[0];
                y = _opts$dimensions$spli2[1];
            }

            var attachTo = opts && opts.attachTo ? opts.attachTo : 'body';
            var styles = ["width:" + x + "px;", "height:" + y + "px;", 'border: 0;', 'margin: 0;', 'padding: 0;', 'overflow: hidden;'].join('');

            (creativeFrame.frameElement || creativeFrame).style.cssText = styles;

            creativeFrame.setAttribute('scrolling', 'no');
            creativeFrame.src = 'about:blank';
            creativeFrame.id = opts && opts.id ? opts.id : 'rp-iframe-' + new Date().getTime();

            _document.querySelector(attachTo).appendChild(creativeFrame);

            var contentDocument = creativeFrame.contentWindow ? creativeFrame.contentWindow.document : creativeFrame.contentDocument.document;

            return contentDocument;
        };

        module.exports = CreateContainerFrame;
    }, { "./GetCurrentDocument": 2 }], 2: [function (require, module, exports) {
        /**
         * @function rubiconutils#setCurrentDocument
         * @summary if the script is loaded inside a FIF, 
         * the document is scoped to the parent document
         */

        var GetCurrentDocument = function GetCurrentDocument() {
            if (window.top === window.self) {
                return document;
            } else {
                return parent.document;
            }
        };

        module.exports = GetCurrentDocument;
    }, {}], 3: [function (require, module, exports) {
        var walkObject = require('./WalkObject');

        var ParseTemplate = function ParseTemplate(templateString, JSONObj) {
            templateString.match(/{{\s*[\w\.]+\s*}}/g).map(function (hbToken) {
                return hbToken;
            }).forEach(function (token) {
                var objNotation = token.match(/[\w\.]+/)[0];
                var iterationCount = 0;
                templateString = templateString.replace(token, walkObject(JSONObj, objNotation, iterationCount));
            });

            return templateString;
        };

        module.exports = ParseTemplate;
    }, { "./WalkObject": 4 }], 4: [function (require, module, exports) {
        var WalkObject = function WalkObject(obj, notation, index) {
            var keysArray = notation.split('.');
            if (index < keysArray.length) {
                if (obj.hasOwnProperty(keysArray[index])) {
                    return WalkObject(obj[keysArray[index]], notation, index += 1);
                } else {
                    // eslint-disable-next-line max-len
                    throw new Error("could not find '" + keysArray[index] + "' property on passed obj");
                }
            } else {
                return obj;
            }
        };

        module.exports = WalkObject;
    }, {}], 5: [function (require, module, exports) {
        /* global rp_passback */

        var createContainerFrame = require('../../../modules/CreateContainerFrame');
        var getCurrentDocument = require('../../../modules/GetCurrentDocument');
        var parseTemplate = require('../../../modules/ParseTemplate');

        var utils = function utils() {
            var self = this;

            var configParams = void 0;

            self.getScriptParams = function (param) {
                var currentScript = document.getElementById('rp-native-renderer');
                var params = getAllowedKeys();
                for (var i = 0; i < params.length; i++) {
                    if (params[i] === param) {
                        return currentScript.getAttribute('data-' + params[i]);
                    }
                }
            };

            self.setParams = function (config) {
                configParams = config;
            };

            self.render = function (response) {
                var _document = getCurrentDocument();
                var TEST_ACCOUNT = 1032;

                if (response.status === 'ok' && response.ads[0].status === 'ok') {

                    response.ads.forEach(function (ad) {
                        if (ad.type === 'script') {
                            try {
                                // add an exclusion for the test account 
                                // so the native POC can be demo'ed
                                if (parseInt(ad.cpm) === 0 && response.account_id !== TEST_ACCOUNT) {
                                    _document.write('<script>' + ad.script + '<\/sc' + 'ript>');
                                } else {
                                    //var adContainer = createContainerFrame({ id: 'rp-native-ad-container' });
									var adContainer = document.createElement("iframe");
									document.body.appendChild(adContainer);
                                    writeCreative(adContainer.contentDocument, ad.script);
                                }
                            } catch (e) {
                                console.error('RP: native parse error ' + e);
                            }
                        }
                    });
                } else {
                    if (rp_passback) {
                        rp_passback(self.getScriptParams('insertionmarker'));
                    }
                }
            };

            self.loadTemplate = function () {
                var _document = getCurrentDocument();
                var position = configParams.insertionposition ? parseInt(configParams.insertionposition) : 0;
                var rawHtmlTemplate = configParams.template;
                var nativeJsonResponse = JSON.parse(window.rp_native);
                var combinedTemplate = parseTemplate(rawHtmlTemplate, nativeJsonResponse);
                var renderElement = _document.createElement('div');
                renderElement.innerHTML = combinedTemplate;

                // eslint-disable-next-line max-len
                parent.document.querySelector(configParams.insertionmarker).innerHTML = renderElement.innerHTML;
            };

            var writeCreative = function writeCreative(contentDocument, creative) {
                contentDocument.open().write("<html>\n<head></head>\n<body style='margin : 0; padding: 0;'>\n<script type='text/javascript'>" + creative + "</script>\n<script type='text/javascript'>\nif(typeof rp_native !== 'undefined') {\n    parent.rp_native = rp_native;\n    parent.nativetag.loadTemplate();\n} else{parent.rp_passback('"+self.getScriptParams('insertionmarker')+"');console.log('RP: Native response missing');}</script>\n</body>\n</html>");
                contentDocument.close();
            };

            var getAllowedKeys = function getAllowedKeys() {
                return ['adtype', 'elementmarker', 'insertionposition', 'template', 'insertionmarker'];
            };
        };

        module.exports = new utils();
    }, { "../../../modules/CreateContainerFrame": 1, "../../../modules/GetCurrentDocument": 2, "../../../modules/ParseTemplate": 3 }], 6: [function (require, module, exports) {
        var renderUtils = require('./modules/utils.js');

        var nativeRenderer = function nativeRenderer() {
            var self = this;

            var defaultParams = {
                adtype: renderUtils.getScriptParams('adtype'),
                elementmarker: renderUtils.getScriptParams('elementmarker'),
                insertionposition: renderUtils.getScriptParams('insertionposition'),
                template: renderUtils.getScriptParams('template'),
                insertionmarker: renderUtils.getScriptParams('insertionmarker')
            };

            renderUtils.setParams(defaultParams);

            self.renderAd = function (response) {
                renderUtils.render(response);
            };

            self.loadTemplate = function () {
                renderUtils.loadTemplate();
            };
        };
        window.nativetag = new nativeRenderer();
    }, { "./modules/utils.js": 5 }] }, {}, [6]);
//# sourceMappingURL=native.js.map
