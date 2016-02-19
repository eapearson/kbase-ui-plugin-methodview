/*global define*/
/*jslint white:true,browser:true*/
define([
    'kb/common/html',
    './utils'
], function (html,utils) {
    'use strict';
    function factory(config) {
        var container, runtime = config.runtime;
        
        // API
        function attach(node) {            
            container = node;
        }
        function start(params) {
            // The method id may have a slash in it, in which case it is a modern
            // catalog-based method; if not, we need to use a standard module
            // for legacy methods.
            
            var methodModule, methodPath;
            
            // Two forms -
            // methodId
            // module/methodId/tag
            // but the app catalog expects a form like l.m
            
            methodModule = params.methodModule || 'l.m';
            
            methodPath = ['appcatalog', 'app', methodModule, params.methodId, params.methodTag].filter(function (component) {
                if (typeof component === 'undefined') {
                    return false;
                }
                return true;
            });
            
            runtime.send('app', 'navigate', {
                path: utils.makePath(methodPath),
                replace: true
            });
        }
        function stop() {
        }
        
        return {
            attach: attach,
            start: start,
            stop: stop
        };
    }
    
    return {
        make: function (config) {
            return factory(config);
        }
    };
});