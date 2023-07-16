export function drawGraph(data, canvas)
{
  const ctx = canvas.getContext('2d');
  const average = data.reduce((sum, d) => sum + d.y, 0) / data.length;
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
      },  {
        label: 'Average',
        data: [{ x: data[0].x, y: average }, { x: data[data.length - 1].x, y: average }],
        borderColor: 'red',
        borderWidth: 1,
        // Configure the borderDash option to display the line as a dotted line
        borderDash: [5, 5],
        fill: false,
        // Display the average line behind the main data
        order: 0,
        // Do not display the average line in the legend
        showLine: false,
      }
      ],
    },
    options: {
      legend: {
        display: false,
      },
      tooltips: {
        callbacks:{
          title: function(tooltipItem, data) {
            // Get the index of the hovered point
            const index = tooltipItem[0].index;
            // Get the corresponding data point
            const dataPoint = data.datasets[0].data[index];
            // Format the date string
            const date = formatDate(data.labels[index], true);
            // Return the title with the full date string and AOD value
            return `${date}\nAverage AOD Value: ${dataPoint}`;
          },
          label: function(tooltipItem)
          {
            return '';
          }
        }
      },
      scales: {
        yAxes: [
          {
            ticks: {
              beginAtZero: true,
              stepSize: 1,
              maxTickLimit: 4
            },
          },
        ],
        xAxes: [
          {
            ticks: {
              maxTicksLimit: 15,
              autoSkip: true,
              maxRotation: 150,
              minRotation: 0,
              callback: function(value, index, values) {
                return formatDate(value);
              }
            }
          }
        ]
      },
      backgroundColor: 'rgba(255, 255, 255, 1)',
      responsive: true,
      onCreate: function (chart) {
        // Calculate the max value based on the chart data
        const max = Math.max(...chart.data.datasets[0].data);
        // Update the max option of the y-axis ticks
        chart.options.scales.yAxes[0].ticks.max = parseFloat(max.toFixed(2));
        chart.update();
      }
    }
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