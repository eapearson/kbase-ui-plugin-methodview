define([
    'bluebird',
    'kb_common/html',
    'kb_service/client/narrativeMethodStore',
    '../utils'
], function(Promise, html, NarrativeMethodStore, utils) {
    'use strict';

    function factory(config) {
        var container, runtime = config.runtime,
            nmsClient = new NarrativeMethodStore(runtime.config('services.narrative_method_store.url'), {
                token: runtime.service('session').getAuthToken()
            }),
            t = html.tag,
            div = t('div'),
            h2 = t('h2'),
            h4 = t('h4'),
            strong = t('strong'),
            table = t('table'),
            tr = t('tr'),
            td = t('td'),
            th = t('th'),
            a = t('a'),
            img = t('img'),
            span = t('span'),
            ul = t('ul'),
            li = t('li');

        // IMPLEMENTATION

        function renderNarrativeMethodStoreInfo(status, params) {
            var methodSpecList = [
                    status.git_spec_url,
                    'tree',
                    status.git_spec_branch,
                    'apps',
                    params.appId
                ],
                label = methodSpecList.map(function(component, index) {
                    if (index > 0) {
                        return '&#8203;' + component;
                    }
                    return component;
                }).join('/'),
                url = methodSpecList.join('/'),
                //truncate out the commit comments. We're guesing about where those start...
                //assume first four lines are valid header info.
                commit = status.git_spec_commit.split(/\r\n|\r|\n/)
                .slice(0, 4)
                .join('<br>');

            return table({ class: 'table table-striped' }, [
                tr([
                    th('Method Store URL'),
                    td(runtime.config('services.narrative_method_store.url'))
                ]),
                tr([
                    th('YAML/Spec Location'),
                    td(a({ href: url, target: '_blank' }, label))
                ]),
                tr([
                    th('Method Spec Commit'),
                    td(commit)
                ])
            ]);
        }

        function renderParameters(parameters) {
            return ul({ class: 'list-simple' }, [
                parameters.map(function(parameter) {
                    var types = '';
                    if (parameter.text_options && parameter.text_options.valid_ws_types) {
                        types = parameter.text_options.valid_ws_types.map(function(type) {
                            return span({ style: { fontStyle: 'italic' } }, [
                                a({ href: utils.makePath(['typeview', type]) })
                            ]);
                        }).join(', ');
                    }
                    return li([
                        span({ style: { fontWeight: 'bold' } }, (parameter.ui_name)),
                        types,
                        ul({ class: 'list-simple' }, [
                            li(parameter.short_hint),
                            utils.renderIf(parameter, 'long_hint', function(longHint) {
                                return longHint;
                            })
                        ])
                    ]);
                }).join('')
            ]);
        }

        function renderFixedParameters(parameters) {
            return ul({ class: 'list-simple' }, [
                parameters.map(function(parameter) {
                    return li([
                        span({ style: { fontWeight: 'bold' } }, (parameter.ui_name)),
                        ul({ class: 'list-simple' }, [
                            li(parameter.description)
                        ])
                    ]);
                }).join('')
            ]);
        }

        function renderAllParameters(allParameters, fixedParameters) {
            var inputs = [],
                outputs = [],
                parameters = [];
            allParameters.forEach(function(parameter) {
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
            return ul({ class: 'list-simple' }, [
                li(['Input', renderParameters(inputs)]),
                li(['Output', renderParameters(outputs)]),
                li(['Parameters', renderParameters(parameters)]),
                li(['Fixed', renderFixedParameters(fixedParameters)])
            ]);
        }

        function renderAppSteps(methodSpecs, params) {
            if (!methodSpecs || methodSpecs.length === 0) {
                return;
            }
            return utils.makeCollapsePanel({
                open: true,
                title: 'App Steps',
                content: ul({ class: 'list-simple' },
                    methodSpecs.map(function(methodSpec, index) {
                        return li([
                            span({ style: { fontWeight: 'bold' } }, String(index + 1)), '. ',
                            a({ href: '#' + ['narrativestore', 'method', methodSpec.id].join('/') }, methodSpec.name)
                        ]);
                    }))
            });
        }

        function renderAppInfo(app, spec, methodSpecs, params) {
            // TODO: add dialog for screenshots
            return [];
        }

        function render(status, app, spec, methodSpecs, params) {
            runtime.send('ui', 'setTitle', app.name);
            return div({ class: 'container-fluid' }, [
                div({ class: 'col-md-8' }, [
                    h2('App - ' + app.name),
                    utils.renderIf(app, 'subtitle', function(subtitle) {
                        return h4(subtitle);
                    }),
                    utils.renderIf(app, 'contact', function(contact) {
                        return div([
                            strong('Help or Questions? Contact&nbsp;&nbsp;'),
                            a({ href: 'mailto: ' + contact }, contact)
                        ]);
                    }),
                    utils.renderIf(app, 'screenshots', function(screenshots) {
                        return utils.makeCollapsePanel({
                            open: true,
                            title: 'Screenshots',
                            content: screenshots.map(function(screenshot) {
                                return img({
                                    src: runtime.config('services.narrative_method_store.image_url') + screenshot.url,
                                    style: { width: '300px' }
                                });
                            })
                        });
                    }),
                    utils.renderIf(app, 'description', function(description) {
                        return utils.makeCollapsePanel({
                            open: true,
                            title: 'Description',
                            content: description
                        });
                    }),
                    renderAppSteps(methodSpecs, params),
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
            return Promise.all([
                    nmsClient.status(),
                    nmsClient.get_app_full_info({
                        ids: [params.appId]
                    }),
                    nmsClient.get_app_spec({
                        ids: [params.appId]
                    })
                ])
                .spread(function(status, apps, specs) {
                    if (apps.length === 0) {
                        throw new Error('App not found: ' + params.appId);
                    }
                    var app = apps[0],
                        spec = specs[0],
                        methodIds = spec.steps.map(function(step) {
                            return step.method_id;
                        });

                    return [status, app, spec, nmsClient.get_method_brief_info({ ids: methodIds })];
                })
                .spread(function(status, app, spec, methodSpecs) {
                    container.innerHTML = render(status, app, spec, methodSpecs, params);
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
        make: function(config) {
            return factory(config);
        }
    };
});