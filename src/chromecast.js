(function (root, factory) {
    'use strict';
    
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else {
        root.chromecast = factory();
    }
}(window, function () {
    'use strict';
    
    var utils, Common, Sender = {}, Receiver = {};
    
    utils = {
        bind: function (callback, context) {
            return function () {
                callback.apply(context, arguments);
            };
        },

        extend: function (target) {
            var attr = {};
            var i, origin;
            
            for (i = 1; i < arguments.length; i++) {
                origin = arguments[i];
                for (attr in origin) {
                    if (origin.hasOwnProperty(attr)) {
                        target[attr] = origin[attr];
                    }
                }
            }
        },
        
        create: function (Module) {
            var Obj = function () {};
            Obj.prototype = Module;
            
            return new Obj();
        }
    };

    Common = {
        _events: null,
        _options: null,
        
        on: function (event, callback) {
            if (!this._events) {
                this._events = {};
            }
            if (!this._events[event]) {
                this._events[event] = [];
            }
            this._events[event].push(callback);
            
            return this;
        },
      
        options: function (opt) {
            if (!this._options) {
                this._options = {};
            }
            if (arguments.length > 0) {
                utils.extend(this._options, opt);
            }
            return this._options;
        },
      
        _trigger: function (eventName, data) {
            var i, events, event;
          
            if (!this._events || !this._events[eventName]) {
                return;
            }
          
            events = this._events[eventName];
            for (i = 0; i < events.length; i++) {
                event = events[i];
                event.call(this, data);
            }
        }
    };
    
    utils.extend(Sender, Common, {
        _session: null,

        initialize: function (options) {
            this.options(options);
            setTimeout(utils.bind(this._initializeCast, this), 1000);
            return this;
        },

        sendMessage: function (message) {
            var options = this.options();
            
            if (!this._isAvailable()) {
                return this;
            }
            this._session.sendMessage(options.namespace, message, utils.bind(this._success, this), utils.bind(this._error, this));
            
            return this;
        },
        
        start: function () {
            var options = this.options();
            
            chrome.cast.requestSession(utils.bind(function (e) {
                this._session = e;
                this._session.addUpdateListener(utils.bind(this._sessionUpdateListener, this));
                this._session.addMessageListener(options.namespace, utils.bind(this._receiverMessage, this));
            }, this), utils.bind(this._error, this));
            
            return this;
        },

        _initializeCast: function () {
            var options = this.options();
            var sessionRequest;
            var apiConfig;

            if (!this._isAvailable()) {
                return this;
            }

            sessionRequest = new chrome.cast.SessionRequest(options.applicationID);
            apiConfig = new chrome.cast.ApiConfig(
                sessionRequest,
                utils.bind(this._sessionListener, this),
                utils.bind(this._receiverListener, this));
            chrome.cast.initialize(apiConfig, utils.bind(this._initSuccess, this), utils.bind(this._error, this));
            
            return this;
        },
        
        _isAvailable: function () {
            return chrome && chrome.cast && chrome.cast.isAvailable;
        },
        
        _sessionListener: function (event) {
            var options = this.options();
            
            this._trigger('session', event);
            this._session = event;
            this._session.addUpdateListener(utils.bind(this._sessionUpdateListener, this));
            this._session.addMessageListener(options.namespace, utils.bind(this._receiverMessage, this));
        },
        

        _initSuccess: function () {
            this._trigger('initialized');
        },

        _error: function (message) {
            this._trigger('error', message);
        },

        _success: function (message) {
            this._trigger('success', message);
        },

        _stopAppSuccess: function () {
            this._trigger('stopappsuccess');
        },

        _sessionUpdateListener: function (isAlive) {
            this._trigger('sessionupdatelistener', isAlive);
          
            if (!isAlive) {
                this._session = null;
            }
        },

        _receiverMessage: function (namespace, message) {
            this._trigger('message', { namespace: namespace, message: message });
        },

        _receiverListener: function (e) {
            this._trigger('listener', e);
        },

        _stopApp: function () {
            this._session.stop(
                utils.bind(this._stopAppSuccess, this),
                utils.bind(this._error, this));
        }
    });
    
    utils.extend(Receiver, Common, {
        _castReceiverManager: null,
        _messageBus: null,
        
        initialize: function (options) {
            this.options(options);
            this._initializeCast();
            return this;
        },
        
        getSenders: function () {
            this._castReceiverManager.getSenders();
            return this;
        },
        
        disconnect: function () {
            window.close();
            return this;
        },
        
        setApplicationState: function (state) {
            this._castReceiverManager.setApplicationState(state);
            return this;
        },
        
        _initializeCast: function () {
            var options = this.options();
            var castReceiverManager, messageBus;

            cast.receiver.logger.setLevelValue(0);
            castReceiverManager = cast.receiver.CastReceiverManager.getInstance();
            castReceiverManager.onReady = utils.bind(this._ready, this);
            castReceiverManager.onSenderConnected = utils.bind(this._senderConnected, this);
            castReceiverManager.onSenderDisconnected = utils.bind(this._senderDisconnected, this);
            castReceiverManager.onSystemVolumeChanged = utils.bind(this._systemVolumeChanged, this);
            
            messageBus = castReceiverManager.getCastMessageBus(options.namespace);
            messageBus.onMessage = utils.bind(this._message, this);
            
            this._messageBus = messageBus;
            this._castReceiverManager = castReceiverManager;
            
            castReceiverManager.start({ statusText: 'starting' });
        },
        
        _ready: function (event) {
            this._trigger('ready', event);
            this._castReceiverManager.setApplicationState('ready');
        },
        
        _senderConnected: function (event) {
            this._trigger('senderconnected', event);
        },
        
        _senderDisconnected: function (event) {
            this._trigger('senderdisconnected', event);
        },
        
        _systemVolumeChanged: function (event) {
            this._trigger('systemvolumechanged', event);
        },
        
        _message: function (event) {
            this._trigger('message', event);
            this._messageBus.send(event.senderId, event.data);
        }
    });

    return {
        createSender: function (options) {
            require('../bower_components/cast_sender/index');
            return utils.create(Sender).initialize(options);
        },
        createReceiver: function (options) {
            require('../bower_components/cast_receiver/index');
            return utils.create(Receiver).initialize(options);
        }
    };
}));
