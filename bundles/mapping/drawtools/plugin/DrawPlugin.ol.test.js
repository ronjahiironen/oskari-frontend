import { afterAll, afterEach } from '@jest/globals';

// plugin stuff
import '../instance';
import '../resources/locale/en';

// mapmodule stuff
import '../../mapmodule/mapmodule.ol';
import '../../mapmodule/resources/locale/en.js';

// for mapmodule
// defaults from mapfull
const projections = {
    'EPSG:3067': '+proj=utm +zone=35 +ellps=GRS80 +units=m +no_defs',
    'EPSG:4326': '+title=WGS 84 +proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs'
};
Object.keys(projections).forEach(code => {
    // mapmodule introduces proj4 global
    window.proj4.defs(code, projections[code]);
});
//  -/for mapmodule

const NAME = 'DrawPluginTest';
const sandbox = Oskari.getSandbox(NAME);
const mapModule = Oskari.clazz.create('Oskari.mapframework.ui.module.common.MapModule', NAME);
const instance = Oskari.clazz.create('Oskari.mapping.drawtools.DrawToolsBundleInstance');

sandbox.register(mapModule);
mapModule.start(sandbox);

// test doesn't use default MainMapModule
instance.mapModule = mapModule;
instance.start(sandbox);
const plugin = instance.getPlugin();

let eventCallback;

instance.onEvent = event => {
    if (event.getIsFinished() && event.getId() === NAME) {
        if (typeof eventCallback !== 'function') {
            Oskari.log(NAME).warn('No callback stored for event');
            return;
        }
        eventCallback(event);
        eventCallback = null;
    }
};
sandbox.registerForEventByName(instance, 'DrawingEvent');

// No need to use interactions
const OPTIONS = {
    drawControl: false,
    modifyControl: false
};
const COLLECTION = {
    type: 'FeatureCollection',
    features: [
        {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: [[332570, 6899482], [387866, 6989594]]
            }
        }, {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: [[457498, 6840090], [530202, 6839066]]
            }
        }
    ]
};

const getOverlayText = feature => {
    const overlay = plugin.getDrawingTooltip(feature.getId());
    return overlay.getElement().innerHTML;
};

const getDrawInteraction = () => plugin._draw;

const draw = (shape, opts = {}, id = NAME) => {
    sandbox.postRequestByName('DrawTools.StartDrawingRequest', [id, shape, { ...OPTIONS, ...opts }]);
    jest.runAllTimers();
};
const finish = (id = NAME) => {
    sandbox.postRequestByName('DrawTools.StopDrawingRequest', [id]);
    jest.runAllTimers();
};
const clear = (id = NAME) => {
    sandbox.postRequestByName('DrawTools.StopDrawingRequest', [id, true, true]);
    jest.runAllTimers();
};

afterAll(() => {
    mapModule.stop();
});

describe('DrawPlugin', () => {
    describe('getFeaturesAsGeoJSON', () => {
        const getGeoJSON = () => plugin.getFeaturesAsGeoJSON(plugin.getDrawFeatures());

        test('no features', () => {
            const { type, crs, features } = getGeoJSON();
            expect(type).toEqual('FeatureCollection');
            expect(crs).toEqual('EPSG:3067');
            expect(features).toEqual([]);
        });
        test('multiGeom', () => {
            const geojson = {
                type: 'MultiPoint',
                coordinates: [[350208, 7011328], [385024, 6982144], [330240, 6947328]]
            };
            draw('Point', { allowMultipleDrawing: 'multiGeom', geojson });
            // drawtools doesn't handle multi geoms
            // check from source that multigeom is parsed to simple features
            const olFeatures = plugin.getDrawSource().getFeatures();
            expect(olFeatures.length).toBe(3);
            olFeatures.forEach(feat => {
                expect(feat.getGeometry().getType()).toEqual('Point');
            });

            // for event splitted features are gathered to one MultiPoint
            const { features } = getGeoJSON();
            expect(features.length).toBe(1);
            expect(features[0].geometry.type).toEqual('MultiPoint');
            expect(features[0].properties.valid).toBe(true);
            clear();
        });
        test('selfIntersect', () => {
            const geojson = {
                type: 'Polygon',
                coordinates: [[[350208, 7011328], [385024, 6982144], [330240, 6947328], [386560, 6924800], [350208, 7011328]]]
            };
            draw('Polygon', { geojson });
            const { valid, area } = getGeoJSON().features[0].properties;
            const reason = Oskari.getMsg('DrawTools', 'intersectionNotAllowed');
            expect(area).toEqual(reason);
            expect(valid).toBe(false);
            // warning tooltip is created even showMeasureOnMap is false
            expect(getOverlayText(plugin.getDrawFeatures()[0])).toEqual(reason);
            clear();
        });
        test('invalidLineLenght', () => {
            const geojson = {
                type: 'LineString',
                coordinates: [[350208, 7011328], [385024, 6982144]]
            };
            const limits = { length: 1000 };
            draw('LineString', { limits, geojson });
            const { valid, length } = getGeoJSON().features[0].properties;
            const formatted = mapModule.formatMeasurementResult(limits.length, 'line');
            const reason = Oskari.getMsg('DrawTools', 'invalidLineLenght', { length: formatted });
            expect(length).toEqual(reason);
            expect(valid).toBe(false);
            // warning tooltip is created even showMeasureOnMap is false
            expect(getOverlayText(plugin.getDrawFeatures()[0])).toEqual(reason);
        });
        afterAll(() => {
            // Clear only after all tests to be sure that different shapes with same id doesn't mess geojson features count
            clear();
        });
    });

    describe('DrawingEvent', () => {
        test('LineString length', done => {
            draw('LineString', { showMeasureOnMap: true, geojson: COLLECTION });
            // Test lengths and sum against hard coded lengths
            const lengths = [105459.38565591227, 72469.86192228278];
            const lengthsSum = lengths.reduce((a, b) => a + b, 0);
            const olFeatures = plugin.getDrawFeatures();
            const formatted = lengths.map(l => (l / 1000).toFixed(3).replace('.', Oskari.getDecimalSeparator()) + ' km');
            expect(olFeatures.map(getOverlayText)).toEqual(formatted);

            eventCallback = event => {
                try {
                    const { features } = event.getGeoJson();
                    const data = event.getData();
                    expect(features.length).toBe(2);
                    const featLengths = features.map(f => f.properties.length);
                    expect(featLengths).toEqual(lengths);
                    const featureSum = featLengths.reduce((a, b) => a + b, 0);
                    expect(featureSum).toBe(lengthsSum);
                    expect(data.length).toBe(lengthsSum);
                    const allValid = features.map(f => f.properties.valid).every(v => v === true);
                    expect(allValid).toBe(true);
                    done();
                } catch (error) {
                    done(error);
                }
            };
            finish();
        });
        // TODO: getFeaturesAsGeoJSON 3. test
        test('new LineString without clearing previous', done => {
            draw('LineString', { geojson: COLLECTION });
            eventCallback = event => {
                try {
                    const { features } = event.getGeoJson();
                    expect(features.length).toBe(4);
                    done();
                } catch (error) {
                    done(error);
                }
            };
            finish();
        });
        // TODO: getFeaturesAsGeoJSON 2. test
        test('other drawing without clear', done => {
            draw('LineString', { geojson: COLLECTION }, 'other');
            finish('other');
            draw('LineString');
            eventCallback = event => {
                const { features } = event.getGeoJson();
                // FIXME: event has features from 'other' functionality
                // The problem is that features are gathered from shape related layer and these aren't filtered by functionality/id
                try {
                    expect(features.length).toBe(0);
                    done();
                } catch (error) {
                    done(error);
                }
            };
            finish();
        });
        test('Polygon area and length', done => {
            const geojson = {
                type: 'Polygon',
                coordinates: [[
                    [353985, 6856175],
                    [430785, 6842863],
                    [411329, 6918639],
                    [353985, 6856175]
                ]]
            };
            draw('Polygon', { showMeasureOnMap: true, geojson });
            const olGeom = plugin.getDrawFeatures()[0].getGeometry();
            const area = mapModule.getGeomArea(olGeom);
            const length = mapModule.getGeomLength(olGeom);
            eventCallback = event => {
                try {
                    const { features } = event.getGeoJson();
                    const data = event.getData();
                    expect(features.length).toBe(1);
                    const { properties } = features[0];
                    expect(properties.area).toBe(area);
                    expect(data.area).toBe(area);
                    expect(properties.length).toBe(length);
                    expect(data.length).toBe(length);
                    expect(properties.valid).toBe(true);
                    done();
                } catch (error) {
                    done(error);
                }
            };
            finish();
        });
        afterAll(() => {
            clear();
        });
    });

    describe('bufferedGeoJson', () => {
        // getFeaturesAsGeoJSON last test or remove
        test('Should be empty', () => {
            clear();
            draw('LineString');
            const olFeatures = plugin.getDrawFeatures();
            // FIXME: plugin clearDrawing(id) should remove features
            // The problem is that previous afterAll clear removes features only from Polygon layer (draw + Polygon => functionality/id (NAME) is linked to Polygon draw layer)
            expect(olFeatures.length).toBe(0);
        });
        test('LineString', done => {
            draw('LineString', { buffer: 1000, geojson: COLLECTION });
            eventCallback = event => {
                const { crs, features } = event.getData().bufferedGeoJson;
                try {
                    expect(event.getGeoJson().features.length).toBe(2);
                    expect(crs).toEqual('EPSG:3067');
                    // FIXME: plugin should return buffered features for all, not just for sketch
                    expect(features.length).toBe(2);
                    done();
                } catch (error) {
                    done(error);
                }
            };
            finish();
        });
        afterAll(() => {
            clear();
        });
    });
    describe('drawInteraction', () => {
        test('LineString', done => {
            const coords = [[350208, 7011328], [385024, 6982144]];
            const length = 45289.70928296261;

            draw('LineString', { drawControl: true });
            eventCallback = event => {
                const { features } = event.getGeoJson();
                try {
                    expect(features.length).toBe(1);
                    expect(event.getData().length).toBe(length);
                    expect(features[0].properties.length).toBe(length);
                } catch (error) {
                    done(error);
                }
            };
            const interaction = getDrawInteraction();
            interaction.appendCoordinates(coords);
            // should trigger finished DrawingEvent
            interaction.finishDrawing();

            eventCallback = event => {
                const { features } = event.getGeoJson();
                try {
                    expect(features.length).toBe(2);
                    expect(event.getData().length).toBe(length * 2);
                    features.forEach(feat => expect(feat.properties.length).toBe(length));
                    done();
                } catch (error) {
                    done(error);
                }
            };
            interaction.appendCoordinates(coords);
            // stop drawing should finish sketch
            finish();
        });
        test('Buffer', done => {
            const buffer = 1000;
            draw('Point', { drawControl: true, buffer });
            eventCallback = event => {
                const data = event.getData();
                const buffered = data.bufferedGeoJson.features;
                try {
                    expect(event.getGeoJson().features.length).toBe(1);
                    expect(buffered.length).toBe(1);
                    const { properties, geometry } = buffered[0];
                    expect(geometry.type).toBe('Polygon');
                    expect(properties.valid).toBe(true);
                    expect(properties.buffer).toBe(buffer);
                    expect(properties.area).toBe(3110083.444244218);
                    expect(properties.length).toBe(6258.038619283929);
                    expect(data.buffer).toBe(buffer);
                } catch (error) {
                    done(error);
                }
            };
            const interaction = getDrawInteraction();
            interaction.appendCoordinates([[350208, 7011328]]);
            interaction.finishDrawing();

            eventCallback = event => {
                try {
                    expect(event.getGeoJson().features.length).toBe(2);
                    // FIXME: plugin should return buffered features for all, not just for sketch
                    expect(event.getData().bufferedGeoJson.features.length).toBe(2);
                    done();
                } catch (error) {
                    done(error);
                }
            };
            interaction.appendCoordinates([[385024, 6982144]]);
            interaction.finishDrawing();
        });
        afterEach(() => {
            clear();
        });
    });
});
