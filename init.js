let map = null;

export function initMap(basemapUrl = null) {
    basemapUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    const basemapLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        noWrap:true,

    });

    const bounds = [
        [-90, -180], // Southwest coordinates
        [90, 180], // Northeast coordinates
    ];

    const options = {
        layers: [basemapLayer],
        minwidth: 200,
        minZoom: 3.0,
        maxZoom: 17,
        maxBounds: bounds,
        // noWrap: true,
    };


    return L.map('map', options);
}

export function destroyMap() {
    if (map) {
        map.remove();
        map = null;
    }
}

// Example usage
function createMap() {
    // Initialize the map
    const map = initMap();

    // Do something with the map

    // Destroy the map when no longer needed
    destroyMap();
}
export function initDropdown(id, options, fieldDescription, placeholder, disabledPlaceholder, group, toolTipContent,)// create dropdown fields
{
    let dropdownHTML = `<div class="tooltip-container">
                               <div id='row'><label for=${id}>${fieldDescription}</label>
                               <div class="tooltip-trigger-container">
                               <span class="tooltip-trigger">?</span>
                               <div class="tooltip-content">
                               <p>${toolTipContent}</p>
                               </div>
                               </div>
                               </div>`;

    dropdownHTML += `<select id='${id}' name='${group}'>`;

    if (disabledPlaceholder) {
        dropdownHTML += `<option value='' selected>${placeholder}</option>`;
    }
    if(group === 'site-fields')
    {
        for (const option of options) {
            if (option.value.toString().includes(placeholder) && !disabledPlaceholder) {
                dropdownHTML += `<option value='${option.value}' selected>${option.label}</option>`;
            } else {
                dropdownHTML += `<option value='${option.value}'>${option.label}</option>`;
            }
        }
    }
    else if(group === 'map-fields'){
        for (const option of options) {
            if (option.label.toString().includes(placeholder) && !disabledPlaceholder) {
                dropdownHTML += `<option value='${option.value}' selected>${option.label}</option>`;
            } else {
                dropdownHTML += `<option value='${option.value}'>${option.label}</option>`;
            }
        }

    }
    else{
        for (const option of options) {
            if (option.value.toString().includes(placeholder) && !disabledPlaceholder) {
                dropdownHTML += `<option value='${option.value}' selected>${option.label}</option>`;
            } else {
                dropdownHTML += `<option value='${option.value}'>${option.label}</option>`;
            }
        }
}

    dropdownHTML += `</select></div>`;

    return dropdownHTML;
}

export function initDropdownCN(id, options, fieldDescription, placeholder, disabledPlaceholder, group, toolTipContent) {
    const dropdownContainer = document.createElement('div');
    dropdownContainer.classList.add('tooltip-container');

    let dropdownHTML = `<div id='row'><label for=${id}>${fieldDescription}</label>
        <div class="tooltip-trigger-container">
        <span class="tooltip-trigger">?</span>
        <div class="tooltip-content">
        <p>${toolTipContent}</p>
        </div>
        </div>
        </div>`;

    dropdownHTML += `<select id='${id}' name='${group}'>`;

    if (disabledPlaceholder) {
        dropdownHTML += `<option value='' selected>${placeholder}</option>`;
    }

    if (group === 'site-fields') {
        for (const option of options) {
            if (option.value.toString().includes(placeholder) && !disabledPlaceholder) {
                dropdownHTML += `<option value='${option.value}' selected>${option.label}</option>`;
            } else {
                dropdownHTML += `<option value='${option.value}'>${option.label}</option>`;
            }
        }
    } else if (group === 'map-fields') {
        for (const option of options) {
            if (option.label.toString().includes(placeholder) && !disabledPlaceholder) {
                dropdownHTML += `<option value='${option.value}' selected>${option.label}</option>`;
            } else {
                dropdownHTML += `<option value='${option.value}'>${option.label}</option>`;
            }
        }
    } else {
        for (const option of options) {
            if (option.value.toString().includes(placeholder) && !disabledPlaceholder) {
                dropdownHTML += `<option value='${option.value}' selected>${option.label}</option>`;
            } else {
                dropdownHTML += `<option value='${option.value}'>${option.label}</option>`;
            }
        }
    }

    dropdownHTML += `</select></div>`;

    dropdownContainer.innerHTML = dropdownHTML;

    return dropdownContainer.firstChild;
}