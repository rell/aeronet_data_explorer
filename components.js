function  setColorScale()
{
    return d3.scaleLinear()
        .domain([0, (1/6), ((1/6)*2), ((1/6)*3), ((1/6)*4), ((1/6)*5), 1])
        .range(['blue', 'teal', 'green', 'yellow', 'orange', 'red']);
}

export function setColor(value)
{
    let color = ""
    if (value <= 1)
    {
        const colorScale = setColorScale();
        return colorScale(value); // sets weight of color based on scale
    }
    else if (value > 1)
    {
        return d3.color("darkred");
    }
    else if (value === "inactive")
    {
        return d3.color("grey");
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
    return date.toLocaleDateString().split("/");

}
export function createColorLegend()
{
    const colorScale = setColorScale();
    const colorLegend = L.control({ position: 'bottomleft' });
    colorLegend.onAdd = function (map) {
        const div = L.DomUtil.create('div', 'legend');
        div.innerHTML = `<div id="legend"><div id="legendMarker"><p>0</p><p>1</p></div>
                            <!--0, (1/6), ((1/6)*2), ((1/6)*3), ((1/6)*4), ((1/6)*5), 1-->
                            <div id="colorBar" style="background-image: linear-gradient(to right, ${colorScale(0)}, ${colorScale((1 / 6))}, ${colorScale(((1 / 6) * 2))}, ${colorScale(((1 / 6) * 3))}, ${colorScale(((1 / 6) * 4))}, ${colorScale(((1 / 6) * 5))}, ${colorScale(1)});"></div>
                            <div id="AOD" style="display: block;"></div>
                            <div id="currentTime" style="display: block;"></div></div>`;
        return div;
    };
    return colorLegend;
}

export function updateTime(date = null, time = null, previouslySet = false)
{
    if (date === null || previouslySet === false) {
        const currentTimeDiv = document.getElementById("currentTime");
        const now = getDate();
        const year = now.getFullYear().toString();
        const month = now.getUTCMonth().toString().padStart(2, '0');
        const day = (now.getDate()+1).toString().padStart(2, '0');
        const hours = now.getUTCHours().toString().padStart(2, "0");
        const minutes = now.getUTCMinutes().toString().padStart(2, "0");
        const dateString = new Date(Date.UTC(year, month, day)).toLocaleString('en-US', { month: 'long', day: "2-digit", year: "numeric" });
        currentTimeDiv.innerHTML = `${dateString} ${hours}:${minutes} UTC`; // time string
        currentTimeDiv.style.textAlign = "center";
        currentTimeDiv.style.fontSize = "14px";
    }else {
        const [hour, minute] = time;
        const currentTimeDiv = document.getElementById("currentTime");
        const dateString = new Date(Date.UTC(date[0], parseFloat(date[1])-1, parseFloat(date[2])+1)).toLocaleString('en-US', { month: 'long', day: "2-digit", year: "numeric" });
        currentTimeDiv.innerHTML = `${dateString} ${hour}:${minute} UTC`; // time string
        currentTimeDiv.style.textAlign = "center";
        currentTimeDiv.style.fontSize = "14px";
    }
}

export function updateAOD(optical_dep)
{
    optical_dep = optical_dep.split("_")[1]
    const currentTimeDiv = document.getElementById("AOD");

    currentTimeDiv.innerHTML = `Displaying AOD: ${optical_dep}`; // aod string
    currentTimeDiv.style.textAlign = "center";
    currentTimeDiv.style.fontSize = "14px";

}
export function getDate ()
{
    return new Date();
}
