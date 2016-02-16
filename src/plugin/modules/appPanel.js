/*global define*/
/*jslint white:true,browser:true*/
define([
    'kb/common/html',
    'kb/widget/widgetSet'
], function (html,WidgetSet) {
    'use strict';
    function factory(config) {
        var container, runtime = config.runtime, 
            widgetSet = WidgetSet.make({runtime: runtime}),
            layout,
            t = html.tag,
            div = t('div');
        
        // IMPLEMENTATION
        function renderLayout() {
            return div({class: 'container-fluid'}, [
                div({class: 'col-md-12'}, [
                    div({id: widgetSet.addWidget('methodview_appView')})
                ])
            ]);
        }
        // We need to create the initial layout first, in order for the widgets
        // to be available for the init phase!
        layout = renderLayout();
        
        
        // API
        
        function init(config) {
            return widgetSet.init(config);
        }
        function attach(node) {            
            container = node;
            container.innerHTML = layout;
            return widgetSet.attach(node);
        }
        function start(params) {
            return widgetSet.start(params);
        }
        function run(params) {
            return widgetSet.run(params);
        }
        function stop() {
            return widgetSet.stop();
        }
        function detach() {
            return widgetSet.detach();
        }
        function destroy() {
            return widgetSet.destroy();
        }
        
        return {
            init: init,
            attach: attach,
            start: start,
            run: run,
            stop: stop,
            detach: detach,
            destroy: destroy
        };
    }
    
    return {
        make: function (config) {
            return factory(config);
        }
    };
});