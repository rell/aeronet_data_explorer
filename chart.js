export function drawGraph(data, canvas)
{
  const ctx = canvas.getContext('2d');
  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(d => d.x),
      datasets: [{
        label: 'Daily Average (Month)',
        data: data.map(d => d.y),
        borderColor: 'black',
        // backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderWidth: 1,
        fill: true,
      }]
    },
    options: {
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
      },
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
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
