/*
 * This file is part of Cockpit.
 *
 * Copyright (C) 2016 Red Hat, Inc.
 *
 * Cockpit is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation; either version 2.1 of the License, or
 * (at your option) any later version.
 *
 * Cockpit is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Cockpit; If not, see <http://www.gnu.org/licenses/>.
 */

(function() {
"use strict";

/*
 * Executes callback for each stream.status.tag[x].item[y]
 * in a stream. Similar behavior to angular.forEach()
 */
function imagestreamEachTagItem(stream, callback, context) {
    var i, il, items;
    var t, tl, tags = (stream.status || {}).tags || [];
    for (t = 0, tl = tags.length; t < tl; t++) {
        items = (tags[t].items) || [];
        for (i = 0, il = items.length; i < il; i++)
            callback.call(context || null, tags[t], items[i]);
    }
}

angular.module('registryUI.images', [
    'registryUI.client',
    'registryUI.date',
])

.factory('imageDockerManifest', [
    'WeakMap',
    function(WeakMap) {
        var weak = new WeakMap();

        return function imageDockerManifest(image) {
            if (!image)
                return { };
            var manifest = weak.get(image);
            if (!manifest) {
                manifest = JSON.parse(image.dockerImageManifest || "{ }");
                angular.forEach(manifest.history || [], function(item) {
                    if (typeof item.v1Compatibility == "string")
                        item.v1Compatibility = JSON.parse(item.v1Compatibility);
                });
                weak.set(image, manifest);
            }
            return manifest;
        };
    }
])

.factory('imageDockerConfig', [
    'WeakMap',
    'imageLayers',
    function(WeakMap, imageLayers) {
        var weak = new WeakMap();
        return function imageDockerConfig(image) {
            if (!image)
                return { };
            var meta, layers, compat, config = weak.get(image);
            if (!config) {
                layers = imageLayers(image);
                if (layers.length)
                    compat = layers[0].v1Compatibility;
                if (compat && compat.config) {
                    config = compat.config;
                } else {
                    meta = image.dockerImageMetadata || { };
                    if (meta.Config)
                        config = meta.Config;
                }
                weak.set(image, config);
            }
            return config || { };
        };
    }
])

.factory('imageLayers', [
    'WeakMap',
    'imageDockerManifest',
    function(WeakMap, imageDockerManifest) {
        var weak = new WeakMap();
        return function imageLayers(image) {
            if (!image)
                return [];
            var manifest, layers = weak.get(image);
            if (!layers) {
                manifest = imageDockerManifest(image);
                if (manifest.history)
                    layers = manifest.history;
                else if (image.dockerImageLayers)
                    layers = image.dockerImageLayers;
                else
                    layers = [];
                weak.set(image, layers);
            }
            return layers;
        };
    }
])

.directive('registryImageBody', [
    'imageLayers',
    'imageDockerConfig',
    function(imageLayers, imageDockerConfig) {
        return {
            restrict: 'E',
            scope: {
                image: '=',
                names: '=',
            },
            templateUrl: 'registry-image-widgets/views/image-body.html',
            link: function(scope, element, attrs) {
                scope.$watch("image", function(image) {
                    scope.layers = imageLayers(image);
                    scope.config = imageDockerConfig(image);
                    scope.labels = scope.config.Labels;
                    if (angular.equals({ }, scope.labels))
                        scope.labels = null;
                });
            }
        };
    }
])

.directive('registryImagePull', [
    function() {
        return {
            restrict: 'E',
            scope: {
                settings: '=',
                names: '=',
            },
            templateUrl: 'registry-image-widgets/views/image-pull.html'
        };
    }
])

.directive('registryImageConfig', [
    'imageDockerConfig',
    function(imageDockerConfig) {
        return {
            restrict: 'E',
            scope: {
                image: '=',
            },
            templateUrl: 'registry-image-widgets/views/image-config.html',
            link: function(scope, element, attrs) {
                scope.configCommand = function configCommand(config) {
                    var result = [ ];
                    if (!config)
                        return "";
                    if (config.Entrypoint)
                        result.push.apply(result, config.Entrypoint);
                    if (config.Cmd)
                        result.push.apply(result, config.Cmd);
                    var string = result.join(" ");
                    if (config.User && config.User.split(":")[0] != "root")
                        return "$ " + string;
                    else
                        return "# " + string;
                };

                scope.$watch("image", function(image) {
                    scope.config = imageDockerConfig(image);
                });
            }
        };
    }
])

.directive('registryImageMeta', [
    'imageDockerConfig',
    function(imageDockerConfig) {
        return {
            restrict: 'E',
            scope: {
                image: '=',
            },
            templateUrl: 'registry-image-widgets/views/image-meta.html',
            link: function(scope, element, attrs) {
                scope.$watch("image", function(image) {
                    scope.config = imageDockerConfig(image);
                    scope.labels = scope.config.Labels;
                    if (angular.equals({ }, scope.labels))
                        scope.labels = null;
                });
            }
        };
    }
]);

}());
