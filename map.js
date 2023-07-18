//Leaflet Documentation https://docs.eegeo.com/eegeo.js/v0.1.730/docs/leaflet/
//Graph Documentation https://developers.arcgis.com/esri-leaflet/samples/dynamic-chart/
import {getAllSites, latestOfSet, getSitesData} from './data.js';
import { createColorLegend, updateTime, updateAOD, getStartEndDateTime } from './components.js';
import { MarkerManager } from './marker.js'
import { initMap } from './init.js';
import { FieldInitializer } from './fields.js'

// const defaultDate = getStartEndDateTime('2023-07-13T00:34:56.789Z') // test date
// const defaultDate = getStartEndDateTime('2023-07-13T12:34:56.789Z') // test date
const defaultDate = getStartEndDateTime()

// // create map obj
const map = initMap();

let args;
let year, month, day, previousYear, previousMonth, previousDay, previousHr, hour, bufferHr, minute;
if (defaultDate.length === 2)
{
    [year, month, day] = defaultDate[0].map(Number);
    [previousHr, hour, bufferHr, minute] = defaultDate[1].map(Number);
    args=`?year=${year}&month=${month}&day=${day}&year2=${year}&month2=${month}&day2=${day}&hour=${previousHr}&hour2=${bufferHr}&AOD15=1&AVG=10&if_no_html=1`
    // args=`year=2022&month=6&day=1&year2=2022&month2=6&day2=1&AOD15=1&hour=0&hour2=2&AVG=10`
}
else if (defaultDate.length === 3)
{
    [previousYear, previousMonth, previousDay] = defaultDate[0].map(Number);
    [year, month, day] = defaultDate[1].map(Number);
    [previousHr, hour, bufferHr, minute] = defaultDate[2].map(Number);
    args=`?year=${previousYear}&month=${previousMonth}&day=${previousDay}&year2=${year}&month2=${month}&day2=${day}&hour=${previousHr}&hour2=${bufferHr}&AOD15=1&AVG=10&if_no_html=1`
}

// console.log(year, month, day, previousYear, previousMonth, previousDay, previousHr, hour, bufferHr, minute)
// initial pull of data
const site_data = await getSitesData(args, 10, defaultDate); // passing default args and (realtime = 10)
const all_site_data = await getAllSites(year);
//
// default optical depth
let optical_depth = 'AOD_500nm'; // to be set by drop menu

// legend
const colorLegend = createColorLegend(optical_depth);
colorLegend.addTo(map);
updateAOD(optical_depth);
updateTime(defaultDate);

// create marker obj
// adding layers
const markerLayer = new MarkerManager(map, args);
markerLayer.addMarker(latestOfSet(site_data), optical_depth);
markerLayer.addInactiveMarker(all_site_data, optical_depth);
// build fields
const initFields = new FieldInitializer(site_data, all_site_data, optical_depth, map, markerLayer, defaultDate);
markerLayer.fieldsClass = initFields
// set center and default zoom
map.setView([0,0],3);

