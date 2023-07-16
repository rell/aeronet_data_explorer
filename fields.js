import {getSitesData, latestOfSet, validateTime} from './data.js';
import {updateAOD, updateTime, getStartEndDateTime} from './components.js';
import {initDropdown} from './init.js';

// This class is responsible for initializing and updating the various fields in the user interface
export class FieldInitializer {
    constructor(siteData, allSiteData, opticalDepth, map, markerLayer, dateTime) {
        this.siteData = siteData;
        this.allSiteData = allSiteData;
        this.opticalDepth = opticalDepth;
        this.radiusIncreased = false;
        // this.startDate = null;
        this.avg = 10;
        this.map = map;
        this.markerLayer = markerLayer;
        // this.dateString = stringIt(this.dateTime) // TODO: Return the string to be put into the date variable upon updating -- possible
        this.dateTime = dateTime;

        // TODO: SET DATE FOR CHART DATA TO UTILIZE
        this.markerLayer.endDate = this.dateTime.length === 3 ? this.dateTime[1] : this.dateTime[0];
        this.markerLayer.startDate = this.setChartStart(this.dateTime)

        this.aodFieldData = [];
        this.siteFieldData = [];
        this.hourTolerance = 1;
        this.recentlySetInactive = true;
        this.siteCurrentlyZoomed = false
        this.previouslySetTime = false;
        this.daily = false
        this.init();
    }

    // This method initializes the dropdown menus for selecting the optical depth, AERONET site, and data type,
    // as well as the Flatpickr date/time picker and the radio buttons for toggling inactive stations.
    init() {
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
        const sitenames = this.allSiteData.map(obj => obj['Site_Name']);
        this.siteFieldData = sitenames.map(element => ({ value: element, label: element}))
            .sort((a, b) => a.value.localeCompare(b.value));

        // Initialize dropdown menus for selecting data type and AERONET site.
        let placeholder = '500';
        const aodDisc = 'Select wavelength for AOD';
        const dropdownAOD = initDropdown('optical-depth-dropdown', this.aodFieldData, aodDisc, placeholder, false);

        placeholder = 'Select'
        const siteDisc = 'AEROnet Site: ';
        const dropdownSite = initDropdown('site-drop-down', this.siteFieldData, siteDisc, placeholder, true);


        const datatypeOpt = [{value: 10, label: 'realtime'}, {value: 20, label: 'daily average'}];
        const dataTypeDisc = 'Select mode';
        placeholder = 'realtime'
        const dropdownData = initDropdown('data-type-dropdown', datatypeOpt, dataTypeDisc, placeholder, false);

        // Initialize Flatpickr date/time picker.
        const calender = `<form><label for='date-input'>Select Day/Time </label>
                          <input type='text' id='date-input' name='date' data-toggle='flatpickr'>
                          <button type='button' id='submitButton'>Submit</button></form>`;

        // Initialize radio buttons for toggling inactive stations.
        const inactiveOff = `<form><label for='hide-inacive'>Inactive station:</label>
                             <input type="radio" id="hide-inactive" name="hide_marker" value="no">
                             <label for="hide-inacive">Hide</label>
                             <input type="radio" id="show-inactive" name="hide_marker" value="yes" checked>
                             <label for="show-inacive">Show</label></form>`;

        // Set the HTML for the fields container.
        const fieldsContainer = document.getElementById('fields');
        fieldsContainer.innerHTML = dropdownAOD + dropdownSite + dropdownData + calender + inactiveOff;

        // Add event listeners to the dropdown menus, date/time picker, and radio buttons.
        const aodDropdownElm = document.getElementById('optical-depth-dropdown');
        aodDropdownElm.addEventListener('change', event => {
            // Update the average dropdown and API arguments
            this.opticalDepth = event.target.value;
            updateAOD(this.opticalDepth);
            this.markerLayer.updateMarkers(latestOfSet(this.siteData), this.allSiteData, this.opticalDepth, this.api_args);
            if (this.markerLayer.currentZoom > 5)
            {
                this.markerLayer.changeMarkerRadius(null)
                this.markerLayer.changeMarkerRadius(this.markerLayer.currentZoom)
            }
            this.recentlySetInactive = true
            updateTime(this.dateTime, this.daily);
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
            }
            else if (parseInt(event.target.value) === 20)
            {
                this.daily = true
            }

            this.markerLayer.updateMarkers(latestOfSet(this.siteData), this.allSiteData, this.opticalDepth, this.api_args);
            this.recentlySetInactive = true;
            if (this.siteCurrentlyZoomed)
            {
                this.markerLayer.changeMarkerRadius(15)
            }else {
                this.map.setView([0,0],3);
            }
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
                console.log(this.radiusIncreased)
                this.map.setView([result['Latitude(decimal_degrees)'], result['Longitude(decimal_degrees)']], 15);
            }
        }

        const now = new Date();
        flatpickr('#date-input', {
            utc: true,
            enableTime: true,
            dateFormat: 'Z',
            altInput:true,
            altFormat: 'Y-m-d h:i K',
            minDate: new Date(1993, 0, 1),
            maxDate: now,
            defaultDate: now,
        });

        document.getElementById('submitButton').addEventListener('click', async (event) => {
            // Get the selected date from Flatpickr
            const dateString = document.getElementById('date-input').value;
            this.dateTime = getStartEndDateTime(dateString)
            this.updateApiArgs();
            this.previouslySetTime = true;
            this.markerLayer.endDate = this.dateTime.length === 3 ? this.dateTime[1] : this.dateTime[0];
            this.markerLayer.startDate = this.setChartStart(this.dateTime)
            this.siteData = await getSitesData(this.api_args, this.avg, this.dateTime);
            this.markerLayer.updateMarkers(latestOfSet(this.siteData), this.allSiteData, this.opticalDepth, this.api_args,);
            this.recentlySetInactive = true;
            if (this.markerLayer.currentZoom > 5)
            {
                this.markerLayer.changeMarkerRadius(null)
                this.markerLayer.changeMarkerRadius(this.markerLayer.currentZoom * 1.5)
            }
            updateTime(this.dateTime, this.daily);
        });

        const toggleInactiveOff = document.getElementById('hide-inactive');
        toggleInactiveOff.addEventListener('click', event => {
            if (this.recentlySetInactive)
            {
                this.markerLayer.clearInactiveMarkers();
                this.recentlySetInactive = false;
            }
        });

        const toggleInactiveOn = document.getElementById('show-inactive');
        toggleInactiveOn.addEventListener('click', event => {
            if(!this.recentlySetInactive)
            {
                this.markerLayer.showInactiveMarkers(this.allSiteData, this.opticalDepth);
                this.recentlySetInactive = true;
            }
        });

    }
    setChartStart() {
        let date;
        let startYear,startMonth,startDay,year,month,day;
        if (this.dateTime.length === 3)
        {
            [year, month, day] = this.dateTime[1].map(Number);
            date = new Date(year, month - 1, day);
            date.setDate(date.getDate()-30);
            startYear = date.getUTCFullYear();
            startMonth = date.getUTCMonth();
            startDay = date.getUTCDate();
        }
        else if (this.dateTime.length === 2)
        {
            [year, month, day] = this.dateTime[0].map(Number);
            date = new Date(year, month - 1, day);
            date.setDate(date.getDate()-30);
            startYear = date.getUTCFullYear();
            startMonth = date.getUTCMonth()+1;
            startDay = date.getUTCDate();
        }
        return [startYear, startMonth, startDay].map(value => value.toString().padStart(2, '0'));
    }

    // updates the API arguments used to retrieve AERO-NET site data based on the selected date and time
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
