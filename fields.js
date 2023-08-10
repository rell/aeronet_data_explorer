import {getSitesData, latestOfSet} from './data.js';
import {updateAOD, updateTime, getStartEndDateTime} from './components.js';
import {initDropdown, initMap} from './init.js';
import { MarkerManager } from "./marker.js";

// This class is responsible for initializing and updating the various fields in the user interface
export class FieldInitializer {
    constructor(siteData, allSiteData, opticalDepth, map, markerLayer, dateTime) {
        this.dateString = null
        this.siteData = siteData;
        this.allSiteData = allSiteData;
        this.opticalDepth = opticalDepth;
        this.radiusIncreased = false;
        this.avg = 10;
        this.map = map;
        this.markerLayer = markerLayer;
        this.dateTime = dateTime;
        this.markerLayer.endDate = this.dateTime.length === 3 ? this.dateTime[1] : this.dateTime[0];
        this.markerLayer.startDate = this.setChartStart(this.dateTime)
        this.aodFieldData = [];
        this.siteFieldData = [];
        this.hourTolerance = 1;
        this.recentlySetInactive = true;
        this.siteCurrentlyZoomed = false
        this.daily = false
        this.toggleInactive = null
        this.init();
    }

    init() {
        let toolTipContent;
        this.radiusIncreased = false;

        this.aodFieldData = Object.keys(this.siteData[0])
            .filter(element => (element.startsWith('AOD_')))
            .map(element => ({ value: element, label: element.split('_')[1] }));

        // Sort aodFieldData based on the numerical value of AOD in descending order.
        this.aodFieldData.sort((a, b) => {
            const aValue = parseInt(a.label.slice(0, -2));
            const bValue = parseInt(b.label.slice(0, -2));
            return bValue - aValue;
        });

        // Sort siteFieldData alphabetically in descending order.
        // const siteNames = this.allSiteData.map(obj => `${obj['Site_Name']} (${obj['Latitude(decimal_degrees)']}, ${obj['Longitude(decimal_degrees)']})`);
        // const siteValues = this.allSiteData.map(obj => `${obj['Site_Name']}`);

        this.siteFieldData = this.allSiteData.map(obj => ({ value: `${obj['Site_Name']}`, label:`${obj['Site_Name']}`}))
            .sort((a, b) => a.value.localeCompare(b.value));
        // this.siteFieldData = this.allSiteData.map(obj => ({ value: `${obj['Site_Name']}`, label: `${obj['Site_Name']} (${obj['Latitude(decimal_degrees)']}, ${obj['Longitude(decimal_degrees)']})`}))
        //     .sort((a, b) => a.value.localeCompare(b.value));
        // Initialize dropdown menus for selecting data type and AERONET site.
        let placeholder = '500';
        const aodDisc = 'Select wavelength';
        toolTipContent = 'Select a preferred wavelength of aerosol optical depth.'
        const dropdownAOD = initDropdown('optical-depth-dropdown', this.aodFieldData, aodDisc, placeholder, false, 'aod-fields', toolTipContent);

        placeholder = 'Select'
        const siteDisc = 'Site';
        toolTipContent =  'This option allows you to select and goto an AERONET site of interest.'
        const dropdownSite = initDropdown('site-drop-down', this.siteFieldData, siteDisc, placeholder, true, 'site-fields', toolTipContent,);


        const datatypeOpt = [{value: 10, label: 'Real-time'}, {value: 20, label: 'Daily'}];
        const dataTypeDisc = 'Select mode';
        toolTipContent =  '<strong>Real-time:</strong> the points displayed on the legend are the most recent within a selected window.</p>\n' +
            '<p><strong>Daily:</strong> the average value displayed for the date set within the window.'
        placeholder = 'realtime'
        const dropdownData = initDropdown('data-type-dropdown', datatypeOpt, dataTypeDisc, placeholder, false, 'avg-fields', toolTipContent);

        // Initialize Flatpickr date/time picker.
        const calender = `<div class="tooltip-container">
                                 <div id='row'> <label for="date-input">Select Day/Time</label>
                                 <div class="tooltip-trigger-container">
                                 <span class="tooltip-trigger">?</span>
                                 <div class="tooltip-content">
                                 <p>This option allows you to select a date and time relative to your local time. <strong>Time is converted from local to UTC.</strong></p>
                                 </div>
                                 </div>
                                 </div>
                                 <div class="input-container">
                                 <input type="text" id="date-input" name="date" data-toggle="flatpickr">
                                 <button type="button" id="submitButton">Submit</button>
                                 </div>
                                 </div>`;


        // Initialize toggle for toggling inactive stations.
        const inactiveOff = `<div class="tooltip-container">
                                 <div id='row'> <label for="toggle-inactive">Show Inactive Sites</label>
                                 <div class="tooltip-trigger-container">
                                 <span class="tooltip-trigger">?</span>
                                 <div class="tooltip-content">
                                 <p>This option allows you to toggle inactive sites on and off.</p>
                                 </div>
                                 </div>
                                 </div>
                                 <label class="toggle-switch">
                                 <input type="checkbox" id="toggle-inactive" name="toggle-inactive" class="toggle-switch-input" checked>
                                 <span class="toggle-switch-label"></span>
                                 </label>
                                 </div>`

        // Set the HTML for the fields container.
        const fieldsContainer = document.getElementById('fields');
        const header = document.createElement("h2");
        header.textContent = "Data Filters";
        header.style.textAlign = 'center';

        // Set the HTML for the fields container.
        const adjustMapHeader = document.createElement("h2");
        adjustMapHeader.textContent = "Adjust Map";
        adjustMapHeader.style.textAlign = 'center';

        const basemapOptions = [
            { value: null, label: 'ArcGIS Satellite View Map' },
            { value: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', label: 'Leaflet Original Map' },
            // { value: 'topo', label: 'Topographic' },
        ]

        placeholder = 'ArcGIS Satellite View Mpa'
        const dropDisc = 'Select Map';
        toolTipContent =  'This option allows you to select different base maps to overlay data to.'
        const dropdownBM = initDropdown('basemap-dropdown', basemapOptions, dropDisc, placeholder, false, 'map-fields', toolTipContent);

        // Insert the header before the form element
        fieldsContainer.insertBefore(header, fieldsContainer.firstChild);

        fieldsContainer.innerHTML = `${header.outerHTML}<form>${dropdownAOD}${dropdownSite}${dropdownData}${calender}${inactiveOff}</form> ${adjustMapHeader.outerHTML} <form>${dropdownBM}</form>`;

        // Append the fields container to the map container
        const mapContainer = document.getElementById('map-container');
        mapContainer.appendChild(fieldsContainer);

        const aodDropdownElm = document.getElementById('optical-depth-dropdown');
        aodDropdownElm.addEventListener('change', event => {
            this.opticalDepth = event.target.value;
            updateAOD(this.opticalDepth);
            this.markerLayer.updateMarkers(latestOfSet(this.siteData), this.allSiteData, this.opticalDepth, this.api_args);
            this.normalizeMarkers()
            this.recentlySetInactive = true
            this.setToggleValue(this.recentlySetInactive)
        });

        let newBasemapLayer = null
        let basemapLayer = null;

        const mapDropdownElm = document.getElementById('basemap-dropdown');
        mapDropdownElm.addEventListener('change', async event => {
            const selectedBasemap = event.target.value;

            if (basemapLayer !== null) {
                // If there's an existing basemap layer, remove it from the map
                this.map.removeLayer(basemapLayer);
                basemapLayer = null; // Reset the basemapLayer reference
            }

            if (selectedBasemap !== null && selectedBasemap !== 'null') {

                // Create a new tile layer with the captured URL
                newBasemapLayer = L.tileLayer(selectedBasemap, {
                    attribution: '<a href="https://openstreetmap.org">OpenStreetMap</a>',
                    noWrap: true,
                    tileSize: 256,
                    errorTileUrl: '',
                    errorTileTimeout: 5000,
                });
                // Add the new basemap layer to the map
                newBasemapLayer.addTo(this.map);
            } else {
                this.map.eachLayer(layer => {
                    if (layer instanceof L.TileLayer && newBasemapLayer !== null) {
                        this.map.removeLayer(newBasemapLayer);
                    }
                });
            }
        });

        // realtime and daily field
        const dataDropdownElm = document.getElementById('data-type-dropdown');
        dataDropdownElm.addEventListener('change', async event =>  {
            this.updateAvg(event.target.value);
            this.updateApiArgs();
            this.siteData = await getSitesData(this.api_args, this.avg, this.dateTime);
            if(parseInt(event.target.value) === 10)
            {
                this.daily = false
                updateFlatpickrOptions(this.daily);
            }
            else if (parseInt(event.target.value) === 20)
            {
                this.daily = true
                updateFlatpickrOptions(this.daily);
            }

            this.markerLayer.updateMarkers(latestOfSet(this.siteData), this.allSiteData, this.opticalDepth, this.api_args);
            if (this.siteCurrentlyZoomed)
            {
                this.normalizeMarkers()
            }else {

                this.map.setView([0, 0], 1);
            }
            this.recentlySetInactive = true;
            this.setToggleValue(this.recentlySetInactive)
            updateTime(this.dateTime, this.daily);
        });


        // site list field
        const sitedropdownElm = document.getElementById('site-drop-down');

        sitedropdownElm.addEventListener('click', (event) => {
            handleSiteChange.call(this, event);
        });

        sitedropdownElm.addEventListener('change', (event) => {
            handleSiteChange.call(this, event);
        });

        const handleSiteChange = (event) => {
            const selectedValue = event.target.value;
            if (selectedValue !== '') {
                const result = this.allSiteData.find(obj => obj['Site_Name'] === selectedValue);
                if (this.radiusIncreased === false) {
                    this.radiusIncreased = true
                    this.markerLayer.changeMarkerRadius(null)
                    this.markerLayer.changeMarkerRadius(25)
                }
                this.siteCurrentlyZoomed = true;
                this.map.setView([result['Latitude(decimal_degrees)'], result['Longitude(decimal_degrees)']], 15);
            }
        }

        const now = new Date();
        // initialize flatpickr with initial options

        let fp = flatpickr('#date-input', {
            utc: true,
            enableTime: true,
            dateFormat: 'Z',
            altInput:true,
            altFormat: 'Y-m-d h:i K',
            minDate: new Date(1993, 0, 1),
            maxDate: now,
            defaultDate: now,
        });
        const updateFlatpickrOptions = (daily) => {

            if (this.dateString === null) {
                if (daily) {
                    fp = flatpickr('#date-input', {
                        utc: true,
                        enableTime: !daily,
                        dateFormat: 'Z',
                        altInput: true,
                        altFormat: 'Y-m-d',
                        minDate: new Date(1993, 0, 1),
                        maxDate: now,
                        defaultDate: now,
                    });
                } else {
                    fp = flatpickr('#date-input', {
                        utc: true,
                        enableTime: !daily,
                        dateFormat: 'Z',
                        altInput: true,
                        altFormat: 'Y-m-d h:i K',
                        minDate: new Date(1993, 0, 1),
                        maxDate: now,
                        defaultDate: now,
                    });
                }
            }else{
                if (daily) {
                    let year,day,month
                    this.dateTime.length === 3 ? [year, month, day] = this.dateTime[1].map(Number) : [year, month, day] = this.dateTime[0].map(Number)
                    fp = flatpickr('#date-input', {
                        utc: true,
                        enableTime: !daily,
                        dateFormat: 'Z',
                        altInput: true,
                        altFormat: 'Y-m-d',
                        minDate: new Date(1993, 0, 1),
                        maxDate: now,
                        defaultDate: new Date(year, month-1, day),
                    });
                } else {
                    let newDate = new Date(this.dateString)
                    if(this.dateString.split('T')[1] === '04:00:00.000Z')
                    {
                        newDate = new Date(this.dateString)

                        if(this.dateTime.length === 2)
                        {
                            newDate.setHours(this.dateTime[1][1]);
                            newDate.setMinutes(this.dateTime[1][3]);
                        }
                        else if (this.dateTime.length === 3)
                        {
                            newDate.setHours(this.dateTime[2][1]);
                            newDate.setMinutes(this.dateTime[2][3]);
                        }
                    }
                    fp = flatpickr('#date-input', {
                        utc: true,
                        enableTime: !daily,
                        dateFormat: 'Z',
                        altInput: true,
                        altFormat: 'Y-m-d h:i K',
                        minDate: new Date(1993, 0, 1),
                        maxDate: now,
                        defaultDate: newDate,
                    });
                }
            }

        }

        document.getElementById('submitButton').addEventListener('click', async (event) => {
            // Get the selected date from Flatpickr
            this.dateString  = document.getElementById('date-input').value;
            this.dateTime = getStartEndDateTime(this.dateString, this.hourTolerance, this.daily, this.dateTime)
            this.updateApiArgs();
            this.markerLayer.endDate = this.dateTime.length === 3 ? this.dateTime[1] : this.dateTime[0];
            this.markerLayer.startDate = this.setChartStart(this.dateTime)
            this.siteData = await getSitesData(this.api_args, this.avg, this.dateTime);
            this.markerLayer.updateMarkers(latestOfSet(this.siteData), this.allSiteData, this.opticalDepth, this.api_args,);
            this.normalizeMarkers()
            this.recentlySetInactive = true;
            this.setToggleValue(this.recentlySetInactive)
            updateTime(this.dateTime, this.daily);
        });

        this.toggleInactive = document.getElementById('toggle-inactive');
        this.toggleInactive.addEventListener('click', (event) => {
            const isChecked = event.target.checked;
            if (isChecked) {
                this.markerLayer.showInactiveMarkers(this.allSiteData, this.opticalDepth);
                this.recentlySetInactive = true;
                this.normalizeMarkers()
            } else {
                this.markerLayer.clearInactiveMarkers();
                this.recentlySetInactive = false;
            }
        });

        const tooltipTrigger = document.querySelector('.tooltip-trigger');
        const tooltip = document.querySelector('.tooltip');

        if (tooltip && tooltipTrigger) {
            tooltipTrigger.addEventListener('mouseover', () => {
                tooltip.style.top = `${tooltipTrigger.offsetTop + tooltipTrigger.offsetHeight}px`;
                tooltip.style.left = `${tooltipTrigger.offsetLeft}px`;
            });

            tooltipTrigger.addEventListener('mouseout', () => {
                tooltip.style.top = null;
                tooltip.style.left = null;
            });
        } else {
            console.error('Tooltip elements not found in the DOM');
        }
    }

    setToggleValue(value) {
        this.toggleInactive.checked = value;
    }
    setChartStart() {
        const daysToAvg = this.markerLayer.chartTimeLength
        let date;
        let startYear,startMonth,startDay,year,month,day;
        if (this.dateTime.length === 3)
        {
            [year, month, day] = this.dateTime[1].map(Number);
            date = new Date(year, month - 1, day);
            date.setDate(date.getDate()-daysToAvg);
            startYear = date.getUTCFullYear();
            startMonth = date.getUTCMonth();
            startDay = date.getUTCDate();
        }
        else if (this.dateTime.length === 2)
        {
            [year, month, day] = this.dateTime[0].map(Number);
            date = new Date(year, month - 1, day);
            date.setDate(date.getDate()-daysToAvg);
            startYear = date.getUTCFullYear();
            startMonth = date.getUTCMonth()+1;
            startDay = date.getUTCDate();
        }
        return [startYear, startMonth, startDay].map(value => value.toString().padStart(2, '0'));
    }


    normalizeMarkers()
    {
        if (this.markerLayer.currentZoom > 5)
        {
            this.markerLayer.changeMarkerRadius(this.markerLayer.currentZoom * 1.5)
            this.markerLayer.markersInactiveLayer.eachLayer((layer) => {
                const opacity = this.markerLayer.currentZoom <= 5 ? 0.1 : 1; // Adjust this value to control the zoom opacity factor
                if (layer instanceof L.CircleMarker) {
                    if (this.markerLayer.currentZoom > 4) {
                        layer.setStyle({ stroke: true, weight: 3, opacity:opacity });
                    } else {
                        layer.setStyle({ stroke: false });
                    }
                }
            });
        }
    }
    // updates the API arguments used to retrieve AERONET site data based on the selected date and time
    updateApiArgs()
    {
        let year, month, day, previousYear, previousMonth, previousDay, previousHr, hour, bufferHr, minute;


        if (parseFloat(this.avg) === 10 || this.avg === null) {
            if (this.dateTime.length === 2) {
                [year, month, day] = this.dateTime[0].map(Number);
                [previousHr, hour, bufferHr, minute] = this.dateTime[1].map(Number);
                this.api_args = `?year=${year}&month=${month}&day=${day}&year2=${year}&month2=${month}&day2=${day}&hour=${previousHr}&hour2=${bufferHr}&AOD15=1&AVG=10&if_no_html=1`

            } else if (this.dateTime.length === 3) {
                [previousYear, previousMonth, previousDay] = this.dateTime[0].map(Number);
                [year, month, day] = this.dateTime[1].map(Number);
                [previousHr, hour, bufferHr, minute] = this.dateTime[2].map(Number);
                this.api_args = `?year=${previousYear}&month=${previousMonth}&day=${previousDay}&year2=${year}&month2=${month}&day2=${day}&hour=${previousHr}&hour2=${bufferHr}&AOD15=1&AVG=10&if_no_html=1`
            }
        }else if (parseFloat(this.avg) === 20)
        {
            if (this.dateTime.length === 2) {
                [year, month, day] = this.dateTime[0].map(Number);
                this.api_args = `?year=${year}&month=${month}&day=${day}&year2=${year}&month2=${month}&day2=${day}&AOD15=1&AVG=20&if_no_html=1`

            } else if (this.dateTime.length === 3) {
                [year, month, day] = this.dateTime[1].map(Number);
                this.api_args = `?year=${year}&month=${month}&day=${day}&year2=${year}&month2=${month}&day2=${day}&AOD15=1&AVG=20&if_no_html=1`
            }

        }

    }
    updateAvg(avg)
    {
        this.avg = avg;
    }
}
