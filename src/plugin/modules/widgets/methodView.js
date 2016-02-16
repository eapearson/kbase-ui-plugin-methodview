/*global define*/
/*jslint white:true,browser:true*/
define([
    'bluebird',
    'kb/common/html',
    'kb/service/client/narrativeMethodStore',
    '../utils'
], function (Promise, html, NarrativeMethodStore, utils) {
    'use strict';
    function factory(config) {
        var container, runtime = config.runtime,
            nmsClient = new NarrativeMethodStore(runtime.config('services.narrative_method_store.url'), {
                token: runtime.service('session').getAuthToken()
            }),
            t = html.tag,
            div = t('div'), h2 = t('h2'), h4 = t('h4'), strong = t('strong'),
            table = t('table'), tr = t('tr'), td = t('td'), th = t('th'),
            a = t('a'), img = t('img'), span = t('span'), ul = t('ul'), li = t('li');

        // IMPLEMENTATION

        function renderNarrativeMethodStoreInfo(status, params) {
            var methodSpecPath = [
                status.git_spec_url,
                'tree',
                status.git_spec_branch,
                'methods',
                params.methodId
            ],
                methodSpecUrl = methodSpecPath.join('/'),
                methodSpecLabel = methodSpecPath.join('/&#8203;'),
                //truncate out the commit comments. We're guesing about where those start...
                //assume first four lines are valid header info.
                commit = status.git_spec_commit.split(/\r\n|\r|\n/)
                .slice(0, 4)
                .join('<br>');

            return table({class: 'table table-striped'}, [
                tr([
                    th('Method Store URL'),
                    td(runtime.config('services.narrative_method_store.url'))
                ]),
                tr([
                    th('YAML/Spec Location'),
                    td(a({href: methodSpecUrl, target: '_blank'}, methodSpecLabel))
                ]),
                tr([
                    th('Method Spec Commit'),
                    td(commit)
                ])
            ]);
        }

        function renderParameters(parameters) {
            return ul({class: 'list-simple'}, [
                parameters.map(function (parameter) {
                    var types = '';
                    if (parameter.text_options && parameter.text_options.valid_ws_types) {
                        types = ' - ' + parameter.text_options.valid_ws_types.map(function (type) {
                            return span({style: {fontStyle: 'italic'}}, [
                                a({href: utils.makePath(['spec', 'type', type])}, type)
                            ]);
                        }).join(', ');
                    }
                    return li([
                        span({style: {fontWeight: 'bold'}}, (parameter.ui_name)),
                        types,
                        ul({class: 'list-simple'}, [
                            li(parameter.short_hint),
                            utils.renderIf(parameter, 'long_hint', function (longHint) {
                                return longHint;
                            })
                        ])
                    ]);
                }).join('')
            ]);
        }

        function renderFixedParameters(parameters) {
            return ul({class: 'list-simple'}, [
                parameters.map(function (parameter) {
                    return li([
                        span({style: {fontWeight: 'bold'}}, (parameter.ui_name)),
                        ul({class: 'list-simple'}, [
                            li(parameter.description)
                        ])
                    ]);
                }).join('')
            ]);
        }

        function renderAllParameters(allParameters, fixedParameters) {
            var inputs = [], outputs = [], parameters = [];
            allParameters.forEach(function (parameter) {
                switch (parameter.ui_class) {
                    case 'input':
                        inputs.push(parameter);
                        break;
                    case 'output':
                        outputs.push(parameter);
                        break;
                    default:
                        parameters.push(parameter);
                }
            });
            return ul({class: 'list-simple'}, [
                li(['Input', renderParameters(inputs)]),
                li(['Output', renderParameters(outputs)]),
                li(['Parameters', renderParameters(parameters)]),
                li(['Fixed', renderFixedParameters(fixedParameters)])
            ]);
        }

        function render(status, method, spec, params) {
            runtime.send('ui', 'setTitle', method.name);
            return div({class: 'container-fluid'}, [
                div({class: 'col-md-8'}, [
                    h2('Method - ' + method.name),
                    utils.renderIf(method, 'subtitle', function (subtitle) {
                        return h4(subtitle);
                    }),
                    utils.renderIf(method, 'contact', function (contact) {
                        return div([
                            strong('Help or Questions? Contact&nbsp;&nbsp;'),
                            a({href: 'mailto: ' + contact}, contact)
                        ]);
                    }),
                    utils.renderIf(method, 'screenshots', function (screenshots) {
                        return utils.makeCollapsePanel({
                            open: true,
                            title: 'Screenshots',
                            content: screenshots.map(function (screenshot) {
                                return img({src: runtime.config('services.narrative_method_store.image_url') + screenshot.url,
                                    style: {width: '300px'}});
                            })
                        });
                    }),
                    utils.renderIf(method, 'description', function (description) {
                        return utils.makeCollapsePanel({
                            open: true,
                            title: 'Description',
                            content: description
                        });
                    }),
                    utils.renderIf(spec, ['parameters', 'fixed_parameters'], function (parameters, fixedParameters) {
                        return utils.makeCollapsePanel({
                            open: true,
                            title: 'Parameters',
                            content: renderAllParameters(parameters, fixedParameters)
                        });
                    }),
                    utils.renderIf(method, 'publications', function (publications) {
                        return utils.makeCollapsePanel({
                            open: true,
                            title: 'Related Publications',
                            content: ul({class: 'list-simple'}, publications.map(function (publication) {
                                return li([publication.display_text, a({href: publication.link, target: '_blank'}, publication.link)]);
                            }))
                        });
                    }),
                    utils.renderIf(method, 'contributors', function (contributors) {
                        return utils.makeCollapsePanel({
                            open: true,
                            title: 'Team Members',
                            content: ul({class: 'list-simple'}, contributors.map(function (contributor) {
                                return li(contributor.name);
                            }))
                        });
                    }),
                    utils.makeCollapsePanel({
                        open: true,
                        title: 'Source',
                        content: renderNarrativeMethodStoreInfo(status, params)
                    })
                ])
            ]);
        }


        // WIDGET API

        function attach(node) {
            container = node;
        }
        function start(params) {
            
            // The method id may have a slash in it, in which case it is a modern
            // catalog-based method; if not, we need to use a standard module
            // for legacy methods.
            
            var parsedMethod = params.methodId.split('/'),
                methodId;
            if (parsedMethod.length === 1) {
                parsedMethod = ['l.m', parsedMethod[0]];
            }
            methodId = parsedMethod.join('/');
            
            
            runtime.send('app', 'navigate', {
                path: utils.makePath(['appcatalog', 'app', methodId, params.methodTag]),
                replace: true
            });
            // appcatalog doesn't seem to like the tag
            // runtime.send('app', 'navigate', ['appcatalog', 'app', params.methodId, params.methodTag].join('/'));
            
//            return Promise.all([
//                nmsClient.status(),
//                nmsClient.get_method_full_info({
//                    ids: [params.methodId],
//                    tag: params.methodTag || 'dev'
//                }),
//                nmsClient.get_method_spec({
//                    ids: [params.methodId],
//                    tag: params.methodTag || 'dev'
//                })
//            ])
//                .spread(function (status, methods, spec) {
//                    if (methods.length === 0) {
//                        throw new Error('Method not found: ' + params.methodId);
//                    }
//                    container.innerHTML = render(status, methods[0], spec[0], params);
//                });

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