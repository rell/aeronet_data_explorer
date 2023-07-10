function  setColorScale()
{
    return d3.scaleLinear()
        .domain([0, (1/6), ((1/6)*2), ((1/6)*3), ((1/6)*4), ((1/6)*5), 1])
        .range(['blue', 'teal', 'green', 'chartreuse', 'yellow', 'orange','red']);
}

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

export function getEndDate(startDate, endLength)
{
    //expected date input format mm/dd/yyyy

    let date = null;

    if (startDate != null)
    {
        const newStartDate = startDate.join('/');
        date = new Date(startDate);

    }
    else
    {
        date = getDate()
    }

    date.setDate(date.getDate() - endLength);

    //format mm/dd/yyyy -> ['mm','dd','yyyy']
    return date.toLocaleDateString().split('/');

}
export function createColorLegend() {
    const colorScale = setColorScale();
    const colorLegend = L.control({ position: 'topright' });
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

export function updateTime(date = null, time = null, previouslySet = false, daily = false)
{
    const currentTimeDiv = document.getElementById('currentTime');

    if (date === null || previouslySet === false && daily === false)
    {
        const now = getDate();
        const year = now.getFullYear().toString();
        const month = now.getUTCMonth().toString().padStart(2, '0');
        const day = (now.getDate()+1).toString().padStart(2, '0');
        const hours = now.getUTCHours().toString().padStart(2, '0');
        const previousHour = (now.getUTCHours()-1).toString().padStart(2, '0');
        const minutes = now.getUTCMinutes().toString().padStart(2, '0');
        const dateString = new Date(Date.UTC(year, month, day)).toLocaleString('en-US', { month: 'long', day: '2-digit', year: 'numeric' });
        currentTimeDiv.innerHTML = `${dateString} (${previousHour}:${minutes}\t&mdash;${hours}:${minutes} UTC)`; // time string
    }
    else if (previouslySet === false && daily)
    {
        const now = getDate();
        const year = now.getFullYear().toString();
        const month = now.getUTCMonth().toString().padStart(2, '0');
        const day = (now.getDate()+1).toString().padStart(2, '0');
        const dateString = new Date(Date.UTC(year, month, day)).toLocaleString('en-US', { month: 'long', day: '2-digit', year: 'numeric' });
        currentTimeDiv.innerHTML = `${dateString} Daily Average`;
    }
    else if (daily)
    {
        const dateString = new Date(Date.UTC(date[0], parseFloat(date[1])-1, parseFloat(date[2])+1)).toLocaleString('en-US', { month: 'long', day: '2-digit', year: 'numeric' });
        currentTimeDiv.innerHTML = `${dateString} Daily Average`; // time string

    }
    else
    {
        const [hour, minute] = time;
        let previousHour;
        if (parseFloat(hour) < 0)
        {
            previousHour = 24
            console.log("ISSUE")
        }
        else
        {
            previousHour = (parseFloat(hour)-1).toString().padStart(2, '0');
        }
        const dateString = new Date(Date.UTC(date[0], parseFloat(date[1])-1, parseFloat(date[2])+1)).toLocaleString('en-US', { month: 'long', day: '2-digit', year: 'numeric' });
        // currentTimeDiv.innerHTML = `${dateString} ${hour}:${minute} UTC`; // time string
        currentTimeDiv.innerHTML = `${dateString} (${previousHour}:${minute}\t&mdash;${hour}:${minute} UTC)`; // time string

    }
    currentTimeDiv.style.textAlign = 'center';
    currentTimeDiv.style.fontSize = '14px';
}

export function updateAOD(optical_dep)
{
    optical_dep = optical_dep.split('_')[1]
    const currentTimeDiv = document.getElementById('AOD');

    currentTimeDiv.innerHTML = `Aerosol Optical Depth (${optical_dep})`; // aod string
    currentTimeDiv.style.textAlign = 'center';
    currentTimeDiv.style.fontSize = '14px';

}

export function getDate ()
{
    return new Date();
}
