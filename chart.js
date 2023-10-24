import {fillChartData} from "./data.js";

export function drawGraph(data, canvas) {
  const ctx = canvas.getContext('2d');
  // const average = data.reduce((sum, d) => sum + d.y, 0) / data.length;
  // canvas.width = 400;
  // canvas.height = 600;

  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(d => d.x),
      datasets: [{
        // label: 'Daily Average (Month)',
        data: data.map(d => d.y),
        borderColor: 'blue',
        // backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderWidth: 1,
        fill: true,
        spanGaps: true,
      },
      //   {
      //   label: 'Average',
      //   data: [{ x: data[0].x, y: average }, { x: data[data.length - 1].x, y: average }],
      //   borderColor: 'red',
      //   borderWidth: 1,
      //   borderDash: [5, 5],
      //   fill: false,
      //   order: 0,
      //   spanGaps:false,
      //
      //   // showLine: true,
      // }
      ],
    },
    options: {
      maintainAspectRatio: false,
      animation: {
        duration: 0,
        easing: 'linear',
        animateRotate: false,
        animateScale: false,
        animateDraw: false,
      },
      hover: {
        animationDuration: 0,
      },
      responsiveAnimationDuration: 0,
      legend: {
        display: false,
      },
      tooltips: {
        callbacks: {
          title: function(tooltipItem, data) {
            const index = tooltipItem[0].index;
            const dataPoint = data.datasets[0].data[index];
            const date = formatDate(data.labels[index], true);
            return `${date}\nAverage AOD Value: ${dataPoint}`;
          },
          label: function(tooltipItem) {
            return '';
          }
        }
      },
      scales: {
        yAxes: [
          {
            ticks: {
              fontColor: 'black',
              // beginAtZero: true,
              stepSize: 1,
              // maxTickLimit: 4,
            },
          },
        ],
        xAxes: [
          {
            ticks: {
              fontColor: 'black',
              // maxTicksLimit: 15,
              autoSkip: true,
              // max: parseFloat(data.datasets[0].data.toFixed(2)),
              maxRotation: 150,
              minRotation: 0,
              callback: function(value, index, values) {
                return formatDate(value);
              },
            },
          },
        ],
      },
      elements: {
        line: {
          borderColor: 'rgba(0, 0, 0, 1)',
        },
        point: {
          borderColor: 'rgba(0, 0, 0, 1)',
        },
      },
      responsive: false,
      onCreated: function(chart) {
        const max = Math.max(...chart.data.datasets[0].data);
        chart.options.scales.yAxes[0].ticks.max = parseFloat(max.toFixed(2));
        chart.update();
      },
    },
  });
}
function formatDate(dateString, full=false) {
  const dateArr = dateString.split(':')
  const date = new Date(dateArr[2], dateArr[1]-1, dateArr[0]);
  let options;
  if (full)
  {
    options = {year: 'numeric', month: 'long', day: 'numeric'}
  }else {

    options = {month: 'short', day: 'numeric'};
  }
  return date.toLocaleDateString('en-US', options);
}