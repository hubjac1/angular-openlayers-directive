angular.module('openlayers-directive').directive('olPath', function($log, $q, olMapDefaults, olHelpers) {

    return {
        restrict: 'E',
        scope: {
            properties: '=olGeomProperties'
        },
        require: '^openlayers',
        replace: true,
        template: '<div class="popup-label path" ng-bind-html="message"></div>',

        link: function(scope, element, attrs, controller) {
            var isDefined = olHelpers.isDefined;
            var createFeature = olHelpers.createFeature;
            var createOverlay = olHelpers.createOverlay;
            var createVectorLayer = olHelpers.createVectorLayer;
            var insertLayer = olHelpers.insertLayer;
            var removeLayer = olHelpers.removeLayer;
            var olScope = controller.getOpenlayersScope();

            olScope.getMap().then(function(map) {
                var mapDefaults = olMapDefaults.getDefaults(olScope);
                var viewProjection = mapDefaults.view.projection;

                var layer = createVectorLayer();
                var layerCollection = map.getLayers();

                insertLayer(layerCollection, layerCollection.getLength(), layer);
                var label;

                var removePath = function() {
                    if (label) {
                        map.removeOverlay(label);
                    }
                    map.removeLayer(layer);
                    removeLayer(layerCollection, layer.index);
                };

                var createPath = function(source) {
                    var proj = source.proj || 'EPSG:4326';
                    var coords = source.coords;
                    var type = source.type || 'Polygon';
                    scope.data = {
                        type: type,
                        coords: coords,
                        projection: proj,
                        style: mapDefaults.styles.path
                    };
                    var feature = createFeature(scope.data, viewProjection);
                    layer.getSource().addFeature(feature);

                    if (source.message) {
                        scope.message = source.message;
                        var extent = feature.getGeometry().getExtent();
                        label = createOverlay(element, extent);
                        map.addOverlay(label);
                    }

                    if (source.center) {
                        if (source.center === 'auto') {
                            var extentLayer = layer.getSource().getExtent();
                            map.getView().fit(extentLayer, map.getSize());
                        }
                    }
                };

                scope.$on('$destroy', function() {
                    removePath();
                });

                scope.$watch('properties', function(properties) {
                    if (!isDefined(properties)) {
                        return;
                    }
                    if (!isDefined(properties.type)) {
                        return;
                    }
                    if (!isDefined(scope.data)) {
                        createPath(properties);
                        return;
                    }
                });

                if (isDefined(attrs.coords)) {
                    attrs.coords = JSON.parse(attrs.coords);
                    createPath(attrs);
                    return;
                }
            });
        }
    };
});
