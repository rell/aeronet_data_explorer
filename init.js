export function initMap()
{
    const copy = '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
    const basemap = 'http://tile.openstreetmap.org/{z}/{x}/{y}.png';
    const layer = L.tileLayer(basemap, { attribution:copy, noWrap: false, tileSize: 256 });

    // Define the bounds for the map
    const bounds = [
        [-90, -180], // Southwest coordinates
        [90, 180] // Northeast coordinates
    ];
    const options = {
        layers: [layer],
        minwidth: 200,
        minZoom: 1,
        maxZoom: 18,
        maxBounds: bounds
    }
    // Create the Leaflet map

    // Return the map object
    return L.map('map', options);
}

export function initDropdown(id, options, fieldDescription, placeholder, disabledPlaceholder)// create dropdown fields
{
    let dropdownHTML = `<label for=${id}>${fieldDescription}:</label>`
    dropdownHTML += `<select id='${id}'>`;
    if (disabledPlaceholder)
    {
        dropdownHTML += `<option value='' disabled>${placeholder}</option>`;
    }
    else
    {
        dropdownHTML += `<option value=''>${placeholder}</option>`;
    }
    for (const option of options) {
        dropdownHTML += `<option value='${option.value}'>${option.label}</option>`;
    }
    dropdownHTML += `</select>`;
    return dropdownHTML;
}