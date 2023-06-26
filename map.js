//Leaflet Documentation https://docs.eegeo.com/eegeo.js/v0.1.730/docs/leaflet/
//Graph Documentation https://developers.arcgis.com/esri-leaflet/samples/dynamic-chart/
import {getAllSites, latestOfSet, getSitesData} from './data.js';
import { createColorLegend, updateTime, updateAOD, getDate, getEndDate } from './components.js';
import { MarkerManager } from './marker.js'
import { initMap } from './init.js';
import { FieldInitializer } from './fields.js'


// create map obj
const map = initMap()

// format mm/dd/yyyy
// default args for pulling data
const [startYear, startMonth, startDay] = getDate().toISOString().split('T')[0].split('-');
const date = [startMonth, startDay, startYear]
const args = `?year=${date[2]}&month=${date[0]}&day=${date[1]}&AOD15=1&AVG=10&if_no_html=1`
// initial pull of data
const site_data = await getSitesData(args, '10', null); // passing default args and (realtime = 10)
const all_site_data = await getAllSites();

// default optical depth
let optical_depth = 'AOD_500nm' // to be set by drop menu

// legend
const colorLegend = createColorLegend(optical_depth)
colorLegend.addTo(map)
updateAOD(optical_depth)
updateTime()

// create marker obj
const markerLayer = new MarkerManager(map, args)

// adding layers
markerLayer.addMarker(latestOfSet(site_data), optical_depth)
markerLayer.addInactiveMarker(all_site_data, optical_depth)
markerLayer.startDate = getEndDate(date, 30)

// set center and default zoom
map.setView([0,0],1)

// dynamically enlarge zoomed markers
markerLayer.zoomedMarkers()

// create fields
const initFields = new FieldInitializer(site_data, all_site_data, optical_depth, map, markerLayer);
