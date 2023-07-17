// Function to create a color scale for mapping data values to colors
function  setColorScale()
{
    return d3.scaleLinear()
        .domain([0, (1/6), ((1/6)*2), ((1/6)*3), ((1/6)*4), ((1/6)*5), 1])
        .range(['blue', 'teal', 'green', 'chartreuse', 'yellow', 'orange','red']);
}

// This function takes a data value as input and returns a color based on the value
export function setColor(value)
{
    let color = ''
    if (value <= 1)
    {
        const colorScale = setColorScale();
        return colorScale(value); // sets weight of color based on scale
    }
    else if (value > 1)
    {
        return d3.color('darkred');
    }
    else if (value === 'inactive')
    {
        return d3.color('grey');
    }
    return color;
}

export function createColorLegend() {
    const colorScale = setColorScale();
    const colorLegend = L.control({ position: 'bottomleft' });
    colorLegend.onAdd = function (map) {
        const div = L.DomUtil.create('div', 'legend');

        // create and append colorBar div
        const colorBar = L.DomUtil.create('div', '', div);
        colorBar.id = 'colorBar';
        colorBar.style.backgroundImage = `linear-gradient(to right, ${colorScale(0)}, ${colorScale(1 / 6)}, ${colorScale((1 / 6) * 2)}, ${colorScale((1 / 6) * 3)}, ${colorScale((1 / 6) * 4)}, ${colorScale((1 / 6) * 5)}, ${colorScale(1)})`;
        colorBar.style.width = '300px'

        // colorBar.style.border = '1px dashed black';
        // // add vertical dashed lines to colorBar
        // const numLines = 20;
        // const lineColor = 'black';
        // const lineWidth = 1;
        // const lineStyle = 'dashed';
        // const lineSpacing = 3 / numLines;
        // colorBar.style.backgroundImage = `repeating-linear-gradient(to right, transparent, transparent ${lineWidth}px, ${lineColor} ${lineWidth}px, ${lineColor} ${lineWidth + lineSpacing}px)`;

        // create and append legendMarker div
        const legendMarker = L.DomUtil.create('div', '', div);
        legendMarker.id = 'legendMarker';
        legendMarker.style.width = '300px'
        for (let i = 0; i <= 5; i++) {
            const value = (i / 5).toFixed(1);
            const p = L.DomUtil.create('p', '', legendMarker);
            p.innerText = value;
        }

        const AOD = L.DomUtil.create('div', '', div);
        AOD.id = 'AOD';
        AOD.style.display = 'block';

        const currentTime = L.DomUtil.create('div', '', div);
        currentTime.id = 'currentTime';
        currentTime.style.display = 'block';

        // div.style.margin = '30px';
        div.style.padding = '10px';


        return div;
    };
    return colorLegend;
}

// Function to update the current time label
// export function updateTime(date = null, time = null, previouslySet = false, daily = false, hourTolerance=1) {
export function updateTime(dateTime, daily = false) {
    let year, month, day, previousHr, hour, bufferHr, minute;
    let dayValidation,xz,xy;
    if (dateTime.length === 2)
    {
        [year, month, day] = dateTime[0].map(Number);
        [previousHr, hour, bufferHr, minute] = dateTime[1];

    }
    else if (dateTime.length === 3)
    {
        [year, month, day] = dateTime[1].map(Number);
        [previousHr, hour, bufferHr, minute] = dateTime[2]
    }

    const currentTimeDiv = document.getElementById('currentTime');
    if (!daily) {
        const dateString = new Date(Date.UTC(year, month-1, parseInt(day)+1)).toLocaleString('en-US', {
            month: 'long',
            day: '2-digit',
            year: 'numeric'
        });

        const timeString = `${previousHr}:${minute} &mdash; ${hour}:${minute} UTC`;
        currentTimeDiv.innerHTML = `${dateString} (${timeString})`;
    } else if (daily) {
        const dateString = new Date(Date.UTC(year, month-1, day+1)).toLocaleString('en-US', {
            month: 'long',
            day: '2-digit',
            year: 'numeric'
        });
        currentTimeDiv.innerHTML = `${dateString} Daily Average`;
    } else {

    }
}

export function updateAOD(optical_dep)
{
    optical_dep = optical_dep.split('_')[1]
    const currentTimeDiv = document.getElementById('AOD');

    currentTimeDiv.innerHTML = `Aerosol Optical Depth (${optical_dep})`; // aod string
    currentTimeDiv.style.textAlign = 'center';
    currentTimeDiv.style.fontSize = '14px';
}


export function getStartEndDateTime(dateTime = null, hourTolerance = 1)
{
    let yesterday;
    let year, month, day, previousYear, previousMonth, previousDay, previousHr, hour, bufferHr, minute;
    if(!dateTime)
    {
        const now = new Date();
        yesterday = new Date(Date.parse(now.toISOString()))
        yesterday.setDate(now.getDate() - 1)
        year = now.getUTCFullYear().toString().padStart(4, '0');
        month = (now.getUTCMonth() + 1).toString().padStart(2, '0');
        day = (now.getUTCDate()).toString().padStart(2, '0');
        hour = now.getUTCHours().toString().padStart(2, '0');
        minute = now.getUTCMinutes().toString().padStart(2, '0');
        previousYear = yesterday.getUTCFullYear().toString().padStart(4, '0');
        previousMonth = (yesterday.getUTCMonth() + 1).toString().padStart(2, '0');
        previousDay = (yesterday.getUTCDate()).toString().padStart(2, '0');
    }
    else if (dateTime)
    {
        const setTime = new Date(Date.parse(dateTime))
        yesterday = new Date(Date.parse(dateTime))
        yesterday.setDate(setTime.getDate() - 1)
        year = setTime.getUTCFullYear().toString().padStart(4, '0');
        month = (setTime.getUTCMonth() + 1).toString().padStart(2, '0');
        day = (setTime.getUTCDate()).toString().padStart(2, '0');
        hour = setTime.getUTCHours().toString().padStart(2, '0');
        minute = setTime.getUTCMinutes().toString().padStart(2, '0');
        previousYear = yesterday.getUTCFullYear().toString().padStart(4, '0');
        previousMonth = (yesterday.getUTCMonth() + 1).toString().padStart(2, '0');
        previousDay = (yesterday.getUTCDate()).toString().padStart(2, '0');
    }


    previousHr = (((parseInt(hour) - hourTolerance) % 24 + 24) % 24).toString().padStart(2, '0');
    bufferHr = (((parseInt(hour) + 1) % 24 + 24) % 24).toString().padStart(2, '0');

    if (hour==='00' || bufferHr < hour)
    {
        return [
            [
                previousYear,
                previousMonth,
                previousDay,
            ],
            [
                year,
                month,
                day,
            ],
            [
                previousHr,
                hour,
                bufferHr,
                minute,
            ],
        ];
    }
    else
    {
        return [
            [
                year,
                month,
                day,
            ],
            [
                previousHr,
                hour,
                bufferHr,
                minute,
            ],
        ];
    }
}
