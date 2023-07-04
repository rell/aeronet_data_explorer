import { getAvg, getAvgUrl, getFullData, buildChartData, latestOfSet } from './data.js';
import { setColor, getEndDate} from './components.js';
import { drawGraph } from './chart.js';
// import { } // set all keys to data in a config file

export class MarkerManager {
  constructor(map, args) {
    this.defaultRadius = 4;
    this.map = map;
    this.currentArg = args;
    this.markersLayer = L.layerGroup().addTo(this.map);
    this.markersInactiveLayer = L.layerGroup().addTo(this.map);
    this.total = 0;
    this.active = [];
    this.chart = null;
    this.startDate = null;
    this.endDate = getEndDate(this.startDate, 30);
    this.dateString = null;
    this.chartTimeLength = 30; // days to capture chart avgs
    this.resetMap()
    this.zoomedMarkers()
  }

  addMarker(data, activeDepth) {

    // keys of active sites
    const site_name = 'AERONET_Site';
    const site_lat = 'Site_Latitude(Degrees)';
    const site_long = 'Site_Longitude(Degrees)';
    const site_date = 'Date(dd:mm:yyyy)';
    const site_time = 'Time(hh:mm:ss)';

    data.forEach( async element => {
      if (!element[activeDepth].toString().includes('-999'))
      {
        // active sites will be used for creating inactive sites
        this.active.push(element[site_name].toLowerCase());
        const marker = L.circleMarker([element[site_lat], element[site_long]],
            {
              closePopupOnClick: false,
              color: '#000000',
              weight: 0,
              riseOnHover: true,
              fillColor: setColor(element[activeDepth]),
              fillOpacity: .85,
              radius: element[activeDepth],
            });
            
        const extendedPopup = L.popup({
          // autoPan: false,
          keepInView: true,
          closeButton: true,
          autoClose: true,
          offset: [0,-2]
        }).setLatLng([element[site_lat],element[site_long]]);
        marker.bindPopup(extendedPopup);


        const dataPopup = L.popup({
          // autoPan: false,
          keepInView: true,
          closeButton: false,
          autoClose: true,
          offset: [0,-2]
        }).setLatLng([element[site_lat],element[site_long]]);
        // marker.bindPopup(dataPopup);



        const hourAvg = getAvg(data, element[site_name], activeDepth)
        const elementTime = element[site_time]
        const elementDate = element[site_date]
        const site = element[site_name]
        const activeReading = parseFloat(element[activeDepth]).toPrecision(4)


        marker.on('click', async () =>
        {
          const avgUrl = await getAvgUrl(site, this.startDate, this.endDate);
          const timedSiteData = await getFullData(avgUrl)
          const chartData = buildChartData(timedSiteData, activeDepth, this.startDate, this.endDate);
          const chartControl = this.createMarkerChart(chartData)
          chartControl.addTo(this.map);
          const lastDate = elementDate.split(':')

          this.updateDateString(lastDate)
          // const elementStateCountry = await getStateCountry(element[site_lat],element[site_long])
          // console.log(elementStateCountry)
          // const state = elementStateCountry[0]
          // const country = elementStateCountry[1]
          // Bind to tool tip click like purple map
          // fetch full data ( past hr avg  using data given in full data set)
          // refer to https://stackoverflow.com/questions/42604005/hover-of-marker-in-leaflet
          extendedPopup.setContent(`<p><span style='font-weight:bold'>Site is online</span> </p>
          <p>Most recent reading: <span style='font-weight:bold'>${activeReading}<span> </p>
          <div id='testtype'><p> As of ${this.dateString} ${elementTime} UTC</p>
          <p> Site: <a href='aeronet.gsfc.nasa.gov/new_web/photo_db_v3/new_web/photo_blank/${site}.html'>${site}</a> (${element[site_lat]},${element[site_long]})</p>
          <p> <a href='https://aeronet.gsfc.nasa.gov/cgi-bin/print_web_data_v3${this.currentArg}&site=${element[site_name]}'>View Raw</a></p>
          </div>`);

          extendedPopup.openOn(this.map);

          marker.on('popupclose', (event) => {
            this.chartClear(chartControl)
          })
        });


        marker.on('mouseover', async () =>
        {
          // If wanting to output state, country of desired coordinates
          // const elementStateCountry = await getStateCountry(element[site_lat],element[site_long])
          // console.log(elementStateCountry)
          // const state = elementStateCountry[0]
          // const country = elementStateCountry[1]
          const lastDate = elementDate.split(':')
          this.updateDateString(lastDate)
          dataPopup.setContent(`<div style='text-align:center'><p>Updated: <span style='font-weight:bold'>${this.dateString} ${elementTime} UTC<span></p>
          <p> Site: <a href='aeronet.gsfc.nasa.gov/new_web/photo_db_v3/new_web/photo_blank/${site}.html'>${site}</a> (${element[site_long]}, ${element[site_lat]}) </p>
          <p>Latest: <span style='font-weight:bold'>${activeReading}</span></p></div>`)
          dataPopup.openOn(this.map);


        });

        marker.on('mouseout', () =>
        {
          dataPopup.isOpen() ? this.map.closePopup() : undefined;
        });
        this.markersLayer.addLayer(marker);


      }
    });
  }
  addInactiveMarker(data, active_depth) {

    // keys of inactive sites
    const site_lat = 'Latitude(decimal_degrees)';
    const site_long = 'Longitude(decimal_degrees)';
    const site_name = 'Site_Name';

    data.forEach( async element => {
      if (!(this.active.includes(element[site_name].toLowerCase())))
      {
        let marker  = L.circleMarker([element[site_lat],element[site_long]],
            {
              closePopupOnClick: false,
              color: '#000000',
              weight: 0,
              riseOnHover:true,
              fillColor: setColor('inactive'),
              fillOpacity: 0.25,
              radius: 0
            });

        let dataPopup = L.popup({
          // autoPan: false,
          keepInView: true,
          closeButton: false,
          autoClose: true,
          offset: [0,-2]
        }).setLatLng([element[site_lat],element[site_long]]);

        let extendedPopup = L.popup({
          // autoPan: false,
          keepInView: true,
          closeButton: true,
          autoClose: false,
          offset: [0,-2]
        }).setLatLng([element[site_lat],element[site_long]]);
        marker.bindPopup(extendedPopup);

        marker.on('mouseover', async () =>
        {
          dataPopup.setContent(`${element[site_name]} is currently inactive <br/>`)
          dataPopup.openOn(this.map)
        });

        marker.on('mouseout', () =>
        {
          dataPopup.isOpen() ? this.map.closePopup() : undefined;
        });

        // const timeString = `${getDate().toLocaleString('default', { month: 'long' })} ${getDate().getDate()} ${getDate().getFullYear()} UTC </p>`

        const site = element[site_name]

        marker.on('click', async () =>
        {
          const avgUrl = await getAvgUrl(site, this.startDate, this.endDate);
          const timedSiteData = await getFullData(avgUrl)
          const chartData = buildChartData(timedSiteData, active_depth, this.startDate, this.endDate);

          if (chartData.length !== 0) {
            const chartControl = this.createMarkerChart(chartData)
            const lastElement = latestOfSet(chartData)
            const lastDate = lastElement[0].x.split(':')

            this.updateDateString(lastDate)

            extendedPopup.setContent(`
              <p><span style='font-weight:bold'>Site is currently offline</span> </p>
              <div id='testtype'><p> ${site} has been active within the past thirty days. <span style='font-weight:bold'>${this.dateString}</span> is when the most recent reading occured.</p>
              <p> Site: <a href='aeronet.gsfc.nasa.gov/new_web/photo_db_v3/new_web/photo_blank/${site}.html'>${site}</a> (${element[site_lat]},${element[site_long]})</p>
              <p> <a href=${avgUrl}>View Raw</a></p>
              </div>`);

            extendedPopup.openOn(this.map);
            chartControl.addTo(this.map);

            marker.on('popupclose', (event) => {
              // delete chart object on closing popup (GARBAGE COLLECTION)
              this.chartClear(chartControl)
            })
          } else {
            extendedPopup.setContent(`<p><span style='font-weight:bold'>Site is currently offline</span> </p>
            <p>${site} has been <span style='font-weight:bold'>inactive</span> within the past thirty days. no data to display.</p>
            <p> Site: <a href='aeronet.gsfc.nasa.gov/new_web/photo_db_v3/new_web/photo_blank/${site}.html'>${site}</a> ${site}</a> (${element[site_lat]},${element[site_long]})</p>`);
            extendedPopup.openOn(this.map)
          }

        });
        this.markersInactiveLayer.addLayer(marker);
      }
    });
  }

  showInactiveMarkers(allSiteData, opticalDepth)
  {
    this.addInactiveMarker(allSiteData, opticalDepth)
  }

  clearInactiveMarkers()
  {
    this.markersInactiveLayer.clearLayers()
  }

  // clearMarkers() {
  //   this.markersLayer.clearLayers();
  // }

  updateMarkers(currentSiteData, allSiteData, opticalDepth, currentArgs, time, startDate){
    this.total = 0;
    this.active =[];
    this.currentArg = currentArgs;
    this.markersLayer.clearLayers();
    this.markersInactiveLayer.clearLayers();
    this.addMarker(currentSiteData, opticalDepth);
    this.addInactiveMarker(allSiteData, opticalDepth);
    this.time = time;
    this.startDate = startDate;
    this.endDate = getEndDate(startDate, this.chartTimeLength);
  }
  // moveInactiveMarkersToBack() {
  //   this.markersInactiveLayer.bringToBack();
  // }


  zoomedMarkers() {
    // dynamically change size of markers when triggering zoomend -> leaflets zoom event
    this.map.on('zoomend', () => {
      const currentZoom = this.map.getZoom();
      let scalingFactor, maxRadius, fillOpacity;

      if (currentZoom >= 15) {
        //marker size if zoom > 15
        scalingFactor = 3;
        maxRadius = 60;
        fillOpacity = 0.8;
      } else if (currentZoom >= 10) {
        //marker size if zoom > 10
        scalingFactor = 5;
        maxRadius = 40;
        fillOpacity = 0.8;
      } else if (currentZoom >= 5) {
        // marker size if zoom > 5
        scalingFactor = 2;
        maxRadius = 20;
        fillOpacity = 0.8;
      } else {
        // Default marker size
        scalingFactor = 1;
        maxRadius = 10;
        fillOpacity = 0.2;
      }

      // Update marker size and opacity
      this.markersLayer.eachLayer((layer) => {
        console.log(scalingFactor)
        if (layer instanceof L.CircleMarker) {
          const radius = Math.min(layer.getRadius() * scalingFactor + this.defaultRadius, maxRadius);
          layer.setRadius(radius);
          layer.setStyle({ fillOpacity : 1});
        }
      });

      this.markersInactiveLayer.eachLayer((layer) => {
        if (layer instanceof L.CircleMarker) {
          const radius = Math.min(layer.getRadius() * scalingFactor + this.defaultRadius, maxRadius);
          layer.setRadius(radius);
          layer.setStyle({ fillOpacity: fillOpacity * 0.6 });
        }
      });
    });
  }
  createMarkerChart(chartData)
  {
    const chartCanvas = document.createElement('canvas');
    chartCanvas.id = 'graph';
    chartCanvas.width = 600;
    chartCanvas.height = 200;
    this.chart = drawGraph(chartData, chartCanvas);
    const chartControl = L.control({position: 'bottomright'});
    chartControl.onAdd = function() {
      const container = L.DomUtil.create('div', 'leaflet-control-graph');
      container.appendChild(chartCanvas);
      return container;
    };
    return chartControl;
  }
  chartClear(chartControl)
  {
    const chartCanvas = chartControl.getContainer().querySelector('.leaflet-control-graph canvas');
    if (chartCanvas && chartCanvas.parentNode) {
      chartCanvas.parentNode.removeChild(chartCanvas);
    }
    this.map.removeControl(chartControl);
    this.chart = null;
  }

  resetMap() {
    var customControl = L.Control.extend({
      options: {
        position: 'bottomright'
      },
      onAdd: function (map) {
        // Create a button element
        var button = L.DomUtil.create('button', 'my-button');
        button.innerHTML = 'Reset View';
        // Add a click event listener to the button
        L.DomEvent.on(button, 'click', function () {
          map.setView([0.0, 0.0], 1);
        });
        // Return the button element
        return button;
      }
    });
    var myControl = new customControl();
    
    myControl.addTo(this.map);
  }

  // applyToMap()
  // {
  //   this.map.addLayer(this.markersInactiveLayer);
  // }

  updateDateString(date)
  {

    // before custom date is on
    // date format = mm/dd/yyyy
    // setting date
    date[0] = parseInt(date[0])+1;
    //setting month
    date[1] = parseInt(date[1])-1;
    this.dateString = new Date(Date.UTC(date[2], date[1], date[0])).toLocaleString('en-US', { month: 'long', day: '2-digit', year: 'numeric' });

  }
}