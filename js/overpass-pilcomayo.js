/**
 * ============================================================================
 * BRIDGE MODULE — MAPA OFICIAL DE LA CUENCA DEL RÍO PILCOMAYO (OTN-PB)
 * ============================================================================
 */

(function (window) {
    'use strict';

    var PilcomayoOverpass = {
        attachControlToMap: function (map, overpassLayerGroup) {
            if (window.PilcomayoOfficialMap) {
                window.PilcomayoOfficialMap.initOfficialMap(map, overpassLayerGroup);
            } else {
                console.warn('[Mapa Oficial] PilcomayoOfficialMap no encontrado.');
            }
        }
    };

    window.PilcomayoOverpass = PilcomayoOverpass;

})(window);
