(function () {
  const slider  = document.getElementById('year-slider');
  const display = document.getElementById('year-display');
  const select  = document.getElementById('indicator-select');

  slider.addEventListener('input', function () {
    display.textContent = this.value;
    if (window.WorldMap)   window.WorldMap.refreshChoropleth();
    if (window.TimeSeries) window.TimeSeries.onYearChange(+this.value);
    fetch('/api/pca?year=' + this.value).then(r => r.json()).then(data => {if (window.ScatterPlot) window.ScatterPlot.updatedata(data);
    });
  });

  select.addEventListener('change', function () {
    if (window.WorldMap)   window.WorldMap.refreshChoropleth();
    if (window.TimeSeries) window.TimeSeries.refresh();
  });
}());
