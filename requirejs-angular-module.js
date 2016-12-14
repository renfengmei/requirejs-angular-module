/**
 * Created by renfeng.mei on 16/11/1.
 */
define(["app"], function(app) {
    app.config([
        '$controllerProvider',
        '$compileProvider',
        '$filterProvider',
        '$provide',
        '$injector',
        function ($controllerProvider, $compileProvider, $filterProvider, $provide, $injector) {
            app.controller = $controllerProvider.register;
            app.directive = $compileProvider.directive;
            app.filter = $filterProvider.register;
            app.factory = $provide.factory;
            app.service = $provide.service;
            app.provider = $provide.provider;
            app.value = $provide.value;
            app.constant = $provide.constant;
            app.decorator = $provide.decorator;

            // 在这里定义一个新的全局方法, 方便进行第三方模块的加载
            angular.registerModule = window.Library = (function () {

                var providers = {
                    '$controllerProvider': $controllerProvider,
                    '$compileProvider': $compileProvider,
                    '$filterProvider': $filterProvider,
                    '$provide': $provide
                };

                var cache = {};

                return function Library(moduleName) {

                    // already activated
                    if (cache[moduleName]) {
                        return;
                    }

                    var module = angular.module(moduleName);

                    var i;

                    if (module.requires) {
                        for (i = 0; i < module.requires.length; i++) {
                            Library(module.requires[i]);
                        }
                    }

                    var invokeArgs, provider, method, args;
                    for (i = 0; i < module._invokeQueue.length; i++) {
                        invokeArgs = module._invokeQueue[i];
                        provider = providers[invokeArgs[0]];
                        method = invokeArgs[1];
                        args = invokeArgs[2];
                        try {
                            provider[method].apply(provider, args);
                        } catch(e) {
                            console.error(e);
                        }
                    }

                    for (i = 0; i < module._configBlocks.length; i++) {
                        try {
                            $injector.invoke.apply($injector, module._configBlocks[i][2]);
                        } catch(e) {
                            console.error(e);
                        }
                    }

                    for (i = 0; i < module._runBlocks.length; i++) {
                        try {
                            $injector.invoke(module._runBlocks[i]);
                        } catch (e) {
                            console.error(e);
                        }
                    }

                    cache[moduleName] = true;
                };
            })();


            var angular_module_origin = null;
            // 设置是否自动注册requirejs加载的module,默认为true
            angular.setAutoRegesterModule = function(load){
                if (load == false) {
                    if (angular_module_origin) {
                        angular.module = angular_module_origin;
                        angular_module_origin = null;
                    }
                    return;
                }

                // 已设置,不可反复设置
                if (angular_module_origin) {
                    return;
                }
                angular_module_origin = angular.module;
                angular.module = function(a,b,c){
                    // 当创建module时,1ms后立即注册module
                    if (b != undefined) {
                        setTimeout(function() {
                            angular.registerModule(a);
                        }, 1);
                        return angular_module_origin(a,b);
                    }
                    else {
                        return angular_module_origin(a);
                    }
                };
            };

            angular.setAutoRegesterModule(true);

        }
    ]);
});
