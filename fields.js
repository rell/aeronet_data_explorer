import {getSitesData, latestOfSet, validateTime} from './data.js';
import {getDate, updateAOD, updateTime} from './components.js';
import {initDropdown} from './init.js';

export class FieldInitializer {
    constructor(siteData, allSiteData, opticalDepth, map, markerLayer) {
        this.siteData = siteData;
        this.allSiteData = allSiteData;
        this.opticalDepth = opticalDepth;
        this.startDate = null;
        this.avg = 10;
        this.map = map;
        this.markerLayer = markerLayer;
        this.date = getDate().toISOString().split('T')[0].split('-');
        this.time = null;
        this.aodFieldData = [];
        this.siteFieldData = [];
        this.hourTolerance = 1;
        this.recentlySetInactive = true;
        this.previouslySetTime = false;
        this.init();
    }

    init() {
        this.aodFieldData = Object.keys(this.siteData[0])
            .filter(element => (element.startsWith('AOD_')))
            .map(element => ({ value: element, label: element.split('_')[1] }));

        // sort based on numerical value of AOD descending order
        this.aodFieldData.sort((a, b) => {
            const aValue = parseInt(a.label.slice(0, -2));
            const bValue = parseInt(b.label.slice(0, -2));
            return bValue - aValue;
        });

        // sort alphabetically descending order
        const sitenames = this.allSiteData.map(obj => obj['Site_Name']);
        this.siteFieldData = sitenames.map(element => ({ value: element, label: element}))
            .sort((a, b) => a.value.localeCompare(b.value));

        const placeholder = 'Select';
        const aodDisc = 'Select an optical depth (Default: 500nm)';
        const dropdownAOD = initDropdown('optical-depth-dropdown', this.aodFieldData, aodDisc, placeholder);

        const siteDisc = 'Select a site';
        const dropdownSite = initDropdown('site-drop-down', this.siteFieldData, siteDisc, placeholder);

        const datatypeOpt = [{value: 10, label: 'realtime'}, {value: 20, label: 'daily average'}];
        const dataTypeDisc = 'Select mode (Default: realtime)';
        const dropdownData = initDropdown('data-type-dropdown', datatypeOpt, dataTypeDisc, placeholder);

        const calender = `<form><label for='date-input'>Display data from </label>
                          <input type='text' id='date-input' name='date' data-toggle='flatpickr'>
                          <button type='button' id='submitButton'>Submit</button></form>`;

        const inactiveOff = `<form><label for='hide-inacive'> Inactive markers:</label>
                          <button type='button' id='hide-inactive'>Hide</button>
                          <button type='button' id='show-inactive'>Show</button></form>`;


        const fieldsContainer = document.getElementById('fields');
        fieldsContainer.innerHTML = dropdownAOD + dropdownSite + dropdownData + calender + inactiveOff;

        // aod field
        const aodDropdownElm = document.getElementById('optical-depth-dropdown');
        aodDropdownElm.addEventListener('change', event => {
            this.opticalDepth = event.target.value;
            updateAOD(this.opticalDepth);
            updateTime(this.date, this.time, this.previouslySetTime);
            this.markerLayer.updateMarkers(latestOfSet(this.siteData), this.allSiteData, this.opticalDepth, this.api_args, this.time, this.date);
            this.recentlySetInactive = true
        });

        // realtime and daily field
        const dataDropdownElm = document.getElementById('data-type-dropdown');
        dataDropdownElm.addEventListener('change', async event =>  {
            this.updateAvg(event.target.value);
            this.updateApiArgs();
            this.siteData = await getSitesData(this.api_args, this.avg, this.time, this.date);
            updateTime(this.date, this.time, this.previouslySetTime);
            console.log(this.siteData)
            this.markerLayer.updateMarkers(latestOfSet(this.siteData), this.allSiteData, this.opticalDepth, this.api_args, this.time, this.date);
            this.recentlySetInactive = true;
        });

        // site list field
        const sitedropdownElm = document.getElementById('site-drop-down');
        sitedropdownElm.addEventListener('change', event => {
            const selectedValue = event.target.value;
            const result = this.allSiteData.find(obj => obj['Site_Name'] === selectedValue);
            this.map.setView([result['Latitude(decimal_degrees)'],result['Longitude(decimal_degrees)']],15);
        });

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
            let dateValue = document.getElementById('date-input').value;
            const date = dateValue.split('T')[0].split('-');
            this.date = [date[0],date[1],date[2]];
            let [hour, min] = dateValue.split('T')[1].split('.')[0].split(':');
            this.time = [hour, min];
            this.updateApiArgs();
            this.previouslySetTime = true;
            updateTime(this.date, this.time, this.previouslySetTime);
            this.siteData = await getSitesData(this.api_args, this.avg, this.time, this.date);
            this.markerLayer.updateMarkers(latestOfSet(this.siteData), this.allSiteData, this.opticalDepth, this.api_args, this.time, this.date);
            this.recentlySetInactive = true;
        });

        const toggleInactiveOff = document.getElementById('hide-inactive');
        toggleInactiveOff.addEventListener('click', event => {
            if (this.recentlySetInactive) {
                this.markerLayer.clearInactiveMarkers();
                this.recentlySetInactive = false;
            }
        });

        const toggleInactiveOn = document.getElementById('show-inactive');
        toggleInactiveOn.addEventListener('click', event => {
            if(!this.recentlySetInactive){
                this.markerLayer.showInactiveMarkers(this.allSiteData, this.opticalDepth);
                this.recentlySetInactive = true;
            }
        });

    }

    updateApiArgs()
    {

        if(this.time == null)
        {
            this.api_args = `?year=${this.date[0]}&month=${this.date[1]}&day=${this.date[2]}&year2=${this.date[0]}&month2=${this.date[1]}&day2=${this.date[2]}&AOD15=1&AVG=${this.avg}&if_no_html=1`;
        }
        else
        {
            this.api_args = `?year=${this.date[0]}&month=${this.date[1]}&day=${this.date[2]}&hour=${this.time[0]-this.hourTolerance}&year2=${this.date[0]}&month2=${this.date[1]}&day2=${this.date[2]}&hour2=${this.time[0]}&AOD15=1&AVG=${this.avg}&if_no_html=1`;
        }
    }
    updateAvg(avg)
    {
        this.avg = avg;
    }
    setDate(date)
    {
        this.date = date;
    }

}