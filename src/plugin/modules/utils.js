/*global define*/
/*jslint white:true,browser:true*/
define([
    'kb/common/html'
], function (html) {
    'use strict';

    function makePath(pathList, query) {
        var path = pathList
            .map(function (pathElement) {
                return encodeURIComponent(pathElement);
            })
            .join('/'),
            queryString;
        if (query) {
            Object.keys(query).map(function (key) {
                return [key, query[key]].map(function (el) {
                    return encodeURIComponent(el);
                }).join('=');
            }).join('&');
        }
        return [path, queryString]
            .filter(function (component) {
                if (typeof component === 'undefined') {
                    return false;
                }
                return true;
            })
            .join('?');

    }
    function makeHashPath(pathList, query) {
        return '#' + makePath(pathList, query);
    }

    function renderIf(obj, props, fun) {
        if (typeof props === 'string') {
            props = [props];
        }
        if (props.some(function (prop) {
            var value = obj[prop];
            if (value) {
                if (typeof value === 'object') {
                    if (value instanceof Array) {
                        if (value.length > 0) {
                            return true;
                        }
                    } else {
                        if (Object.keys(value).length > 0) {
                            return true;
                        }
                    }
                } else {
                    return true;
                }
            }
        })) {
            return fun.apply(null, props.map(function (prop) {
                return obj[prop];
            }));
        }
    }

    function makeCollapsePanel(arg) {
        var div = html.tag('div'),
            span = html.tag('span'),
            klass = arg.class || 'default',
            id = html.genId();

        return div({class: 'panel panel-' + klass}, [
            div({class: 'panel-heading', dataToggle: 'collapse', dataTarget: '#' + id, style: {cursor: 'pointer'}}, [
                span({class: 'panel-title'}, arg.title)
            ]),
            div({class: ['collapse', (arg.open ? 'in' : '')].join(' '), id: id}, [
                div({class: 'panel-body'}, [
                    arg.content
                ])
            ])
        ]);
    }

    return {
        makePath: makePath,
        makeHashPath: makeHashPath,
        renderIf: renderIf,
        makeCollapsePanel: makeCollapsePanel
    };
});