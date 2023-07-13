// import {getDate} from './components.js';

// Latest data flow
// const date = getDate().toISOString().split('T')[0].split('-');
const splitCsvAt = 'https://aeronet.gsfc.nasa.gov/cgi-bin/site_info_v3'
// const allSites = 'https://aeronet.gsfc.nasa.gov/aeronet_locations_v3.txt'

// const api_args = `?year=2023&month=6&day=11&AOD15=1&AVG=10&if_no_html=1`


export async function getAllSites(year)
{
    try
    {
        const response = await fetch(`https://aeronet.gsfc.nasa.gov/Site_Lists_V3/aeronet_locations_v3_${year}_lev15.txt`, {method:'GET', mode:'no-cors'})
            .then(response => response.text())
            .catch(error => console.log(error))
        const config = {
            delimiter: ',',
            newline: '\n',
            header: true,
            skipEmptyLines: true,
        }

        const data = response.split(`,${year}`)[1] // CSV
        const objs = await Papa.parse(data, config) // Avg for building js objects was ~7 ms
        return objs.data
    } catch (error) {
        console.error(error);
        throw new Error('Failed to get data');

    }
}

export async function getSitesData(args, dataType, date = null)
{
    console.log(date)
    const apiUrl = 'https://aeronet.gsfc.nasa.gov/cgi-bin/print_web_data_v3'
    console.log(apiUrl.concat(args))
    try {
        const response = await fetch(apiUrl.concat(args), {method:'GET', mode:'no-cors'})
            .then(response => response.text())
            .catch(error => console.log(error))
        const config = {
            delimiter: ',',
            newline: '\n',
            header: true,
            skipEmptyLines: true,
        }
        if(dataType.toString() === '20') // daily avg
        {
            // If mode is ALL POINT = 20
            // validate API dates
            const data = response.split(splitCsvAt)[1]; // CSV
           const objs = await Papa.parse(data, config);
            // validate time is correct -> fixes api returning wrong date
            if(date !== null)
            {  
                return validateTime(objs.data, date);
            }
            return objs.data;
        }
        if (dataType.toString() === '10') // all points
        {

            // If mode is ALL POINT = 10
            // Only keep points with an currentHr from current UTC times
            const data = response.split(splitCsvAt)[1]; // CSV
            const objs = await Papa.parse(data, config);

            return withinTime(objs.data, date);
        }
    } catch (error) {
        console.error(error);
        throw new Error('Failed to get data');
    }
}

// export async function processSiteList(data) {
//     const promises = data.map( async (obj) => {
//         const url = createUrl(obj['Site_Name']);
//         const result = await fetch(url);
//         const json = await result.json
//         return json;
//     });
//     const results = await Promise.all(promises)
//
//     return results
// }

function createUrl(site)
{
    return `https://aeronet.gsfc.nasa.gov/cgi-bin/print_web_data_v3?year=${date[0]}&month=${date[1]}&day=${date[2]}&AOD15=1&AVG=10&if_no_html=1&site=${site}`
}


export async function getAvgUrl(site, startDate, endDate)
{
    console.log(startDate)
    console.log(endDate)
    // input dates should be mm/dd/yyyy
    if (startDate[2].length > 2) // corrects format when data is changed
    {
        return `https://aeronet.gsfc.nasa.gov/cgi-bin/print_web_data_v3?year=${startDate[2]}&month=${startDate[0]}&day=${startDate[1]}&year1=${endDate[2]}&month1=${endDate[0]}&day1=${endDate[1]}&AOD15=1&AVG=20&site=${site}&if_no_html=1`
    }
    else
    {
        return `https://aeronet.gsfc.nasa.gov/cgi-bin/print_web_data_v3?year=${endDate[2]}&month=${endDate[0]}&day=${endDate[1]}&year1=${startDate[0]}&month1=${startDate[1]}&day1=${startDate[2]}&AOD15=1&AVG=20&site=${site}&if_no_html=1`
        // url = `https://aeronet.gsfc.nasa.gov/cgi-bin/print_web_data_v3?year=${endDate[0]}&month=${endDate[1]}&day=${endDate[2]}&year1=${startDate[2]}&month1=${startDate[0]}&day1=${startDate[1]}&AOD15=1&AVG=20&site=${site}&if_no_html=1`
    }
}

// export async function getAllDataUrl(site, timestart, timeend)
// {
//     // Get averages for one week
//     const date = new Date();
//     date.setDate(date.getDate() - daysToAvg);
//     let time = date.toLocaleDateString();
//     time = time.split('/');
//     let [month, day, year] = time
//     return `https://aeronet.gsfc.nasa.gov/cgi-bin/print_web_data_v3?year=${year}&month=${month}&day=${day}&AOD15=1&AVG=20&if_no_html=1&site=${site}`
// }

function buildDates(date)
{
    date = date.map((element) => element.padStart(2, '0'));
    let [month, day, year] = date
    return [year, month, day]
}

export function validateTime(data, date)
{
    const site_date = 'Date(dd:mm:yyyy)';
    return data.filter((obj) => {
        // Date(dd:mm:yyyy)
        let [objDay, objMonth, objYear] = obj[site_date].split(':');
        let [dateYear, dateMonth, dateDay] = date;
        const timestamp = new Date(objYear, objMonth, objDay).getTime();
        const setDate = new Date(dateYear, dateMonth, dateDay).getTime();
        return timestamp === setDate;
    });
}


export function buildChartData(data, activeDepth, startDate, endDate)
{
    if (startDate.join() === endDate.join())
    {
        const chartData = data.map(obj => {
            if(!(obj[activeDepth].toString().includes('-999'))){ // -999 represents inactive data
                return {
                    x: obj['Date(dd:mm:yyyy)'], y: obj[activeDepth]
                };
            }
        });
        return chartData.filter((obj) => obj !== undefined);
    }
    else
    {
        const chartData = data.map(obj => {
            if(!(obj[activeDepth].toString().includes('-999'))){ // -999 represents inactive data
                return {
                    x: obj['Date(dd:mm:yyyy)'], y: obj[activeDepth]
                };
            }
        });

        const cleanedData =  chartData.filter((obj) => obj !== undefined);
        endDate = buildDates(endDate)
        let [endYear, endMonth, endDay] = endDate;
        let [startYear, startMonth, startDay] = startDate;
        return  cleanedData.filter((obj) => {
            let [month, day, year] = obj.x.split(':');
            let dataTime = [month, day, year]
            dataTime = buildDates(dataTime);
            day = dataTime[1];
            month = dataTime[2];
            year = dataTime[0];
            const timestamp = new Date(year, month, day).getTime();
            const max = new Date(startYear, startMonth, startDay).getTime();
            const min = new Date(endYear, endMonth, endDay).getTime();

            // if  min <= timestamp <= max -> data is within range
            return timestamp >= min && timestamp <= max;

        })
    }
}


export async function getFullData(url)
{
    try
    {
        const initial_key = 'AERONET_Site,';
        const response = await fetch(url, {method:'GET', mode:'no-cors'})
            .then(response => response.text())
            .catch(error => console.log(error));
        const config = {
            delimiter: ',',
            newline: '\n',
            header: true,
            skipEmptyLines: true,
        };
        let data = response.split(initial_key)[1]; // CSV
        data = `${initial_key}${data}`;
        const objs = await Papa.parse(data, config); // Avg for building js objects was ~7 ms
        return objs.data;
    }
    catch (error)
    {
        throw new Error('Failed to get data');
    }
}

// export function recentCheck ()
// {
//
//     return undefined
// }

export function getAvg (objs, site, opticalDepth)
{
    const activeSiteKey = 'AERONET_Site'
    const invalidReading = '-999.'
    let totalAvg = 0;
    let aodAvg = 0;
    objs.forEach((element, i) =>
        // get all objects that are within the list =>
        (element[activeSiteKey] === site &&
            !element[opticalDepth].toString().includes(invalidReading)) ? (aodAvg += parseFloat(element[opticalDepth]), totalAvg+=1) : undefined);

    return (aodAvg/totalAvg).toPrecision(4);
}

export function withinTime (dataset, defaultDate)
{
    // sitetime Key
    const siteTime = 'Time(hh:mm:ss)';

    let previousHr, hour, bufferHr, minute;
    if (defaultDate.length === 2)
    {
        [previousHr, hour, bufferHr, minute] = defaultDate[1];

    }
    else if (defaultDate.length === 3)
    {
        [previousHr, hour, bufferHr, minute] = defaultDate[2];
    }


    let withinTime = [];

    // do tolerance check whilst adding points to map for adding only points that are within an hour tolerance of the current hour
    dataset.forEach( element => {
        const [siteHours, siteMinutes, siteSeconds] = element[siteTime].split(':').map(Number);
        let isBetween;
        if(parseInt(hour) !== 0) {
            isBetween = (hour > siteHours || (hour === siteHours && minute >= siteMinutes) || (hour === siteHours && minute === siteMinutes))
                && (hour > siteHours || (hour === siteHours && minute >= siteMinutes) || (hour === siteHours && minute === siteMinutes))
                && (previousHr < siteHours || (previousHr === siteHours && minute <= siteMinutes) || (previousHr === siteHours && minute === siteMinutes));
        }
        else
        {
            isBetween = ((hour === siteHours && minute > siteMinutes) || (hour === siteHours && minute === siteMinutes))
                        || (previousHr < siteHours || (previousHr === siteHours && minute <= siteMinutes) || (previousHr === siteHours && minute === siteMinutes))
        }
        console.log(`start Time:${previousHr}: current${minute}-${hour}:${minute} is ${siteHours}:${siteMinutes} between? ${isBetween}`);
        console.log('04:')
        isBetween ? withinTime.push(element) : undefined;
    });
    // console.log(withinTime)
    console.log(withinTime)
    return withinTime;
}

export function latestOfSet(objs)
{
    const activeSiteKey = 'AERONET_Site'
    return Object.values(
        // reduces each item using site name to get latest obj for each site name
        objs.reduce((siteObjs, site) => {
            siteObjs[site[activeSiteKey]] = site;
            return siteObjs;
        }, {})
    );
}

export async function getStateCountry(latitude, longitude)
{
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`, {method:'GET', mode:'no-cors'})
        .then(response => response.json())
        .then(data => { return [data['address']['state'], data['address']['country']] })
        .catch(error => console.log(error));
}