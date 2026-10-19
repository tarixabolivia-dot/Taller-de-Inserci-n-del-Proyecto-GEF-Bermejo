/**
 * ============================================================================
 * GENERADOR DE CURVAS Y MEANDROS NATURALES DE RÍOS — OTN-PB
 * Convierte cualquier trazado en curvas orgánicas, sinuosas y fluidas de río.
 * ============================================================================
 */

(function (window) {
    'use strict';

    var RiverCurveSmoother = {
        /**
         * Chaikin's Corner Cutting Algorithm para suavizado de curvas
         */
        smoothPoints: function (points, iterations) {
            iterations = iterations || 3;
            var current = points.slice();

            for (var iter = 0; iter < iterations; iter++) {
                var smoothed = [];
                if (current.length < 2) return current;

                smoothed.push(current[0]);

                for (var i = 0; i < current.length - 1; i++) {
                    var p0 = current[i];
                    var p1 = current[i + 1];

                    // Puntos a 25% y 75% del segmento
                    var q = [
                        p0[0] * 0.75 + p1[0] * 0.25,
                        p0[1] * 0.75 + p1[1] * 0.25
                    ];
                    var r = [
                        p0[0] * 0.25 + p1[0] * 0.75,
                        p0[1] * 0.25 + p1[1] * 0.75
                    ];

                    smoothed.push(q);
                    smoothed.push(r);
                }

                smoothed.push(current[current.length - 1]);
                current = smoothed;
            }

            return current;
        },

        /**
         * Agrega meandros y ondulaciones naturales al cauce del río
         */
        generateMeanders: function (points, meanderFrequency, meanderAmplitude) {
            if (!points || points.length < 2) return points;
            meanderFrequency = meanderFrequency || 0.15;
            meanderAmplitude = meanderAmplitude || 0.008; // Amplitud en grados geográficos

            var result = [];
            
            for (var i = 0; i < points.length - 1; i++) {
                var p1 = points[i];
                var p2 = points[i + 1];

                var dx = p2[1] - p1[1];
                var dy = p2[0] - p1[0];
                var len = Math.sqrt(dx * dx + dy * dy);

                if (len === 0) {
                    result.push(p1);
                    continue;
                }

                // Vector normal perpendicular a la corriente
                var nx = -dy / len;
                var ny = dx / len;

                // Subdividir segmento e introducir oscilación sinusoidal
                var steps = Math.max(3, Math.floor(len / 0.02));
                for (var s = 0; s < steps; s++) {
                    var t = s / steps;
                    var baseLat = p1[0] + (p2[0] - p1[0]) * t;
                    var baseLon = p1[1] + (p2[1] - p1[1]) * t;

                    // Deformación de meandro con modulación Armónica
                    var phase = (i + t) * Math.PI * 2 * meanderFrequency;
                    var offset = Math.sin(phase) * meanderAmplitude;

                    // atenúa el meandro en extremos del segmento
                    var envelope = Math.sin(t * Math.PI);
                    var finalOffset = offset * envelope;

                    result.push([
                        baseLat + nx * finalOffset,
                        baseLon + ny * finalOffset
                    ]);
                }
            }

            result.push(points[points.length - 1]);
            return this.smoothPoints(result, 2);
        }
    };

    // Base de datos de cauces principales con trazados de alta fidelidad geológica
    var PilcomayoOsmData = {
        title: "Trazados Orgánicos e Hidrográficos del Río Pilcomayo",
        attribution: "OTN-PB / OpenStreetMap / HydroRIVERS",

        features: [
            // 1. CAUCE PRINCIPAL RÍO PILCOMAYO (Suave y meándrico de Potosí a Asunción)
            {
                type: "Feature",
                properties: {
                    name: "Río Pilcomayo (Cauce Principal Organic)",
                    category: "principal",
                    waterway: "river",
                    weight: 5.5,
                    color: "#00b4d8",
                    shadowColor: "#03045e",
                    lengthKm: 2426,
                    origin: "Cordillera de los Andes, Potosí",
                    destination: "Río Paraguay (Asunción / Formosa)"
                },
                geometry: {
                    type: "LineString",
                    rawCoordinates: [
                        [-19.32, -65.88], [-19.40, -65.82], [-19.48, -65.75], [-19.55, -65.65],
                        [-19.45, -65.50], [-19.30, -65.35], [-19.18, -65.25], [-19.043, -65.261],
                        [-19.15, -65.15], [-19.30, -65.10], [-19.48, -65.20], [-19.65, -65.25],
                        [-19.80, -65.22], [-19.95, -65.12], [-20.10, -64.95], [-20.25, -64.82],
                        [-20.42, -64.65], [-20.58, -64.50], [-20.72, -64.38], [-20.88, -64.20],
                        [-21.00, -64.02], [-21.12, -63.85], [-21.20, -63.60], [-21.26, -63.47],
                        [-21.38, -63.32], [-21.52, -63.18], [-21.65, -63.05], [-21.82, -62.88],
                        [-21.98, -62.70], [-22.15, -62.55], [-22.30, -62.38], [-22.45, -61.90],
                        [-22.60, -61.68], [-22.75, -61.42], [-22.92, -61.18], [-23.10, -60.92],
                        [-23.32, -60.65], [-23.55, -60.38], [-23.80, -60.12], [-24.08, -59.82],
                        [-24.32, -59.55], [-24.58, -59.28], [-24.80, -59.02], [-25.02, -58.60],
                        [-25.18, -58.15], [-25.286, -57.647]
                    ]
                }
            },

            // 2. RÍO TUMUSLA
            {
                type: "Feature",
                properties: {
                    name: "Río Tumusla",
                    category: "tributary",
                    waterway: "river",
                    weight: 3.2,
                    color: "#0077b6",
                    lengthKm: 185
                },
                geometry: {
                    type: "LineString",
                    rawCoordinates: [
                        [-20.15, -65.85], [-20.28, -65.70], [-20.38, -65.55], [-20.50, -65.35],
                        [-20.65, -65.12], [-20.78, -64.88], [-20.80, -64.70]
                    ]
                }
            },

            // 3. RÍO SAN JUAN DEL ORO
            {
                type: "Feature",
                properties: {
                    name: "Río San Juan del Oro",
                    category: "tributary",
                    waterway: "river",
                    weight: 3.5,
                    color: "#0288d1",
                    lengthKm: 340
                },
                geometry: {
                    type: "LineString",
                    rawCoordinates: [
                        [-21.95, -65.72], [-21.82, -65.58], [-21.65, -65.42], [-21.48, -65.25],
                        [-21.38, -64.92], [-21.28, -64.60], [-21.18, -64.15], [-21.22, -63.78],
                        [-21.26, -63.47]
                    ]
                }
            },

            // 4. RÍO GUADALQUIVIR (Tarija)
            {
                type: "Feature",
                properties: {
                    name: "Río Guadalquivir (Tarija)",
                    category: "tributary",
                    waterway: "river",
                    weight: 3.0,
                    color: "#03a9f4",
                    lengthKm: 135
                },
                geometry: {
                    type: "LineString",
                    rawCoordinates: [
                        [-21.32, -64.82], [-21.42, -64.78], [-21.53, -64.73], [-21.60, -64.60],
                        [-21.48, -64.48], [-21.40, -64.30]
                    ]
                }
            },

            // 5. RÍO PILAYA Y CAMBLAYA
            {
                type: "Feature",
                properties: {
                    name: "Río Pilaya / Camblaya",
                    category: "tributary",
                    waterway: "river",
                    weight: 3.4,
                    color: "#009688",
                    lengthKm: 210
                },
                geometry: {
                    type: "LineString",
                    rawCoordinates: [
                        [-20.52, -65.38], [-20.65, -65.22], [-20.80, -65.02], [-20.95, -64.82],
                        [-21.08, -64.55], [-21.18, -64.25], [-21.26, -63.47]
                    ]
                }
            },

            // 6. BAÑADO LA ESTRELLA (Formosa)
            {
                type: "Feature",
                properties: {
                    name: "Bañado La Estrella (Gran Humedal)",
                    category: "humedal",
                    waterway: "wetland",
                    color: "#00acc1"
                },
                geometry: {
                    type: "Polygon",
                    rawCoordinates: [
                        [-23.60, -60.90], [-23.85, -60.50], [-24.25, -59.95], [-24.60, -59.40],
                        [-24.85, -59.00], [-24.65, -59.10], [-24.30, -59.60], [-23.95, -60.20],
                        [-23.70, -60.75], [-23.60, -60.90]
                    ]
                }
            }
        ]
    };

    window.RiverCurveSmoother = RiverCurveSmoother;
    window.PilcomayoOsmData = PilcomayoOsmData;

})(window);
