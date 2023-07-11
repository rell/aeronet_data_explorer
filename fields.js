import {getSitesData, latestOfSet, validateTime} from './data.js';
import {getDate, updateAOD, updateTime} from './components.js';
import {initDropdown} from './init.js';

// This class is responsible for initializing and updating the various fields in the user interface
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
        this.daily = false
        this.init();
    }

    // This method initializes the dropdown menus for selecting the optical depth, AERONET site, and data type,
    // as well as the Flatpickr date/time picker and the radio buttons for toggling inactive stations.
    init() {
        // Initialize dropdown for selecting optical depth.
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
        const dropdownAOD = initDropdown('optical-depth-dropdown', this.aodFieldData, aodDisc, placeholder);

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

            updateTime(this.date, this.time, this.previouslySetTime, this.daily);
            this.markerLayer.updateMarkers(latestOfSet(this.siteData), this.allSiteData, this.opticalDepth, this.api_args, this.time, this.date);
            this.recentlySetInactive = true
        });

        // realtime and daily field
        const dataDropdownElm = document.getElementById('data-type-dropdown');
        dataDropdownElm.addEventListener('change', async event =>  {
            this.updateAvg(event.target.value);
            this.updateApiArgs();
            this.siteData = await getSitesData(this.api_args, this.avg, this.time, this.date);
            console.log(event.target.value)
            if(parseInt(event.target.value) === 10)
            {
                this.daily = false
            }
            else if (parseInt(event.target.value) === 20)
            {
                this.daily = true
            }
            updateTime(this.date, this.time, this.previouslySetTime, this.daily);
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
            updateTime(this.date, this.time, this.previouslySetTime, this.daily);
            this.siteData = await getSitesData(this.api_args, this.avg, this.time, this.date);
            this.markerLayer.updateMarkers(latestOfSet(this.siteData), this.allSiteData, this.opticalDepth, this.api_args, this.time, this.date);
            this.recentlySetInactive = true;
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

    // updates the API arguments used to retrieve AERONET site data based on the selected date and time
    updateApiArgs()
    {
        let currentHr;
        let currentMn;

        if(this.time == null)
        {
            const now = new Date();
            currentHr = now.getHours();
            currentMn = now.getMinutes();
            this.time = [currentHr, currentMn]
        }
        if (parseFloat(this.time[0]-this.hourTolerance) < 0)
        {
        // {this.time[0] = parseFloat(this.time[0] === 0) ? parseInt()this.time[0]+1 : undefined;
            console.log("here");
            let newHr = 24+(this.time[0]-this.hourTolerance)
    //
    //         console.log("HERRRREEEEE")
    //         console.log(newHr)
            let currentDate = new Date(this.date[0], this.date[1]-1, this.date[2]);
            let previousDate = new Date(currentDate.setDate(currentDate.getDate() - 1));
            previousDate = [previousDate.getFullYear(), previousDate.getMonth()+1, previousDate.getDate()];
            this.api_args = (parseInt(this.time[0])===0) ?
                `?year=${previousDate[0]}&month=${previousDate[1]}&day=${previousDate[2]}&hour=${newHr}&year2=${this.date[0]}&month2=${this.date[1]}&day2=${this.date[2]}&hour2=${parseFloat(this.time[0])+1}&AOD15=1&AVG=${this.avg}&if_no_html=1` :
                `?year=${previousDate[0]}&month=${previousDate[1]}&day=${previousDate[2]}&hour=${newHr}&year2=${this.date[0]}&month2=${this.date[1]}&day2=${this.date[2]}&hour2=${parseFloat(this.time[0])}&AOD15=1&AVG=${this.avg}&if_no_html=1`;
        }
        // console.log("MISSED")
        else
        {
            this.api_args = `?year=${this.date[0]}&month=${this.date[1]}&day=${this.date[2]}&hour=${this.time[0]-this.hourTolerance}&year2=${this.date[0]}&month2=${this.date[1]}&day2=${this.date[2]}&hour2=${parseInt(this.time[0])+1}&AOD15=1&AVG=${this.avg}&if_no_html=1`;
        }
        // }
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