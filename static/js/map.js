(function(){
  "use strict";

  var container = document.getElementById("map-panel");
  var W = (container ?  container.clientWidth: 640) || 640;
  var H = 380;

  var svg = d3.select("#map-svg")
    .attr("viewBox","0 0 "+W+" "+H)
    .attr("preserveAspectRatio","xMidYMid meet");

  var projection = d3.geoNaturalEarth1()
    .scale(W/6.4).translate([W/2, H/2]);

  var path = d3.geoPath().projection(projection);
  var mapGroup = svg.append("g");

  var colorScale = d3.scaleSequential(d3.interpolateYlOrRd).domain([0,100]);

  var _hoveredCountry = null;
  var _selectedCountries = new Set();

  var ISO = APP.isoMap;

  var COUNTRIES_SET = new Set(APP.countries);

  d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
    .then(function(world){
      var features = topojson.feature(world, world.objects.countries).features;

      mapGroup.selectAll(".country")
        .data(features).enter().append("path")
        .attr("class", function(d){
          var name = ISO[+d.id];
          return (name && COUNTRIES_SET.has(name)) ? "country-path in-list" : "country-path not-in-list";
        })
        .attr("d", path)
        .on("mouseover", onOver)
        .on("mouseout",  onOut)
        .on("click",     onClick);

      fetchChoropleth();
    });

  function fetchChoropleth(){
    var indicator = document.getElementById("indicator-select").value;
    var year      = document.getElementById("year-slider").value;
    fetch("/api/choropleth?indicator="+encodeURIComponent(indicator)+"&year="+year)
      .then(function(r){ return r.json(); })
      .then(function(data){
        var vals = Object.values(data.values).filter(function(v){ return !isNaN(v); });
        if (vals.length > 0){
          colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
            .domain([d3.min(vals), d3.max(vals)]);
        }
        mapGroup.selectAll(".country-path.in-list").attr("fill", function(d){
          var name = ISO[+d.id];
          if (!name) return "#888";
          var val = data.values[name];
          return (val == null || isNaN(val)) ? "#888" : colorScale(val);
        });
        reapplyStates();
      });
  }

  function reapplyStates(){
    mapGroup.selectAll(".country-path.in-list")
      .classed("highlighted",    function(d){ return ISO[+d.id] === _hoveredCountry; })
      .classed("brush-selected", function(d){ var n=ISO[+d.id]; return n && _selectedCountries.has(n); });
  }

  var tooltip = document.getElementById("map-tooltip");

  function onOver(event, d){
    var name = ISO[+d.id];
    if (!name || !COUNTRIES_SET.has(name)) return;
    _hoveredCountry = name;
    reapplyStates();
    if (window.ScatterPlot) window.ScatterPlot.highlightCountry(name);

    var year = document.getElementById("year-slider").value;
    fetch("/api/tooltip?country="+encodeURIComponent(name)+"&year="+year)
      .then(function(r){ return r.json(); })
      .then(function(data){
        var html = '<div class="tooltip-country">'+name+'</div>';
        var entries = Object.entries(data.values);
        if (entries.length === 0){ html += "<em>No data</em>"; }
        else { entries.forEach(function(e){ html += "<div><b>"+e[0]+":</b> "+e[1]+"</div>"; }); }
        tooltip.innerHTML = html;
        tooltip.style.display = "block";
        var rect = container.getBoundingClientRect();
        var x = event.clientX - rect.left + 12;
        var y = event.clientY - rect.top  + 12;
        if (x+290 > rect.width)  x = rect.width  - 295;
        if (y+200 > rect.height) y = y - 210;
        tooltip.style.left = x+"px";
        tooltip.style.top  = y+"px";
      });
  }

  function onOut(event, d){
    _hoveredCountry = null;
    reapplyStates();
    if (window.ScatterPlot) window.ScatterPlot.clearHighlight();
    tooltip.style.display = "none";
  }

  function onClick(event, d){
    var name = ISO[+d.id];
    if (!name || !COUNTRIES_SET.has(name)) return;
    if (!window.BrushState || !window.BrushState.active){
      _selectedCountries.clear();
      _selectedCountries.add(name);
    }
    reapplyStates();
    if (window.TimeSeries) window.TimeSeries.update(Array.from(_selectedCountries));
  }

  window.WorldMap = {
    highlightCountry: function(name){ _hoveredCountry=name; reapplyStates(); },
    clearHighlight:   function(){ _hoveredCountry=null; reapplyStates(); },
    setSelectedCountries: function(names){
      _selectedCountries = new Set(names);
      reapplyStates();
      if (window.TimeSeries) window.TimeSeries.update(Array.from(_selectedCountries));
    },
    refreshChoropleth: fetchChoropleth
  };
}());
