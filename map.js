//Leaflet Documentation https://docs.eegeo.com/eegeo.js/v0.1.730/docs/leaflet/
//Graph Documentation https://developers.arcgis.com/esri-leaflet/samples/dynamic-chart/
import { getAllSites, latestOfSet, getSitesData } from './data.js';
import { createColorLegend, updateTime, updateAOD, getStartEndDateTime } from './components.js';
import { MarkerManager } from './marker.js';
import { initMap } from './init.js';
import { FieldInitializer } from './fields.js';

// Declare variables
let map = null;
let markerLayer = null;
let initFields = null;
let colorLegend = null;
let args = null;
let defaultDate = null;
let site_data = null;
let all_site_data = null;
let optical_depth = 'AOD_500nm'; // to be set by drop menu

// Function to initialize the map
async function initializeMap() {
    if (!map) {
        map = initMap();
    }

    defaultDate = getStartEndDateTime();

    let year, month, day, previousHr, hour, bufferHr, minute,previousYear, previousMonth, previousDay
    if (defaultDate.length === 2) {
         [year, month, day] = defaultDate[0].map(Number);
         [previousHr, hour, bufferHr, minute] = defaultDate[1].map(Number);
        args = `?year=${year}&month=${month}&day=${day}&year2=${year}&month2=${month}&day2=${day}&hour=${previousHr}&hour2=${bufferHr}&AOD15=1&AVG=10&if_no_html=1`;
    } else if (defaultDate.length === 3) {
         [previousYear, previousMonth, previousDay] = defaultDate[0].map(Number);
         [year, month, day] = defaultDate[1].map(Number);
         [previousHr, hour, bufferHr, minute] = defaultDate[2].map(Number);
        args = `?year=${previousYear}&month=${previousMonth}&day=${previousDay}&year2=${year}&month2=${month}&day2=${day}&hour=${previousHr}&hour2=${bufferHr}&AOD15=1&AVG=10&if_no_html=1`;
    }


    site_data = await getSitesData(args, 10, defaultDate); // passing default args and (realtime = 10)
    all_site_data = await getAllSites(year);

    colorLegend = createColorLegend(optical_depth);
    colorLegend.addTo(map);

    updateAOD(optical_depth);
    updateTime(defaultDate);

    markerLayer = new MarkerManager(map, args);
    markerLayer.addMarker(latestOfSet(site_data), optical_depth);
    markerLayer.addInactiveMarker(all_site_data, optical_depth);

    // Build fields
    initFields = new FieldInitializer(site_data, all_site_data, optical_depth, map, markerLayer, defaultDate, colorLegend);
    markerLayer.fieldsClass = initFields;

    // Set center and default zoom
    map.setView([0, 0], 1);
}

// Call the initializeMap function
initializeMap();