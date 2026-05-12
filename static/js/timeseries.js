(function () {
  const margin = { top: 20, right: 170, bottom: 45, left: 55 };
  const totalW = 900, totalH = 240;
  const W = totalW - margin.left - margin.right;
  const H = totalH - margin.top  - margin.bottom;

  const svg = d3.select('#ts-svg')
    .attr('viewBox', `0 0 ${totalW} ${totalH}`);

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const xScale = d3.scaleLinear().domain([APP.minYear, APP.maxYear]).range([0, W]);
  const yScale = d3.scaleLinear().range([H, 0]);

  const xAxisG = g.append('g').attr('class','axis')
    .attr('transform',`translate(0,${H})`)
    .call(d3.axisBottom(xScale).tickFormat(d3.format('d')).ticks(12));

  const yAxisG = g.append('g').attr('class','axis');

  g.append('defs').append('clipPath').attr('id','ts-clip')
    .append('rect').attr('width',W).attr('height',H);

  const linesG = g.append('g').attr('clip-path','url(#ts-clip)');
  const legendG = g.append('g').attr('transform',`translate(${W+12},0)`);

  const yearMark = g.append('line').attr('class','year-mark')
    .attr('y1',0).attr('y2',H).style('display','none');

  const color = d3.scaleOrdinal(d3.schemeTableau10);
  let _countries = [];
  let _year = APP.maxYear;

  function update(countries) {
    _countries = countries || [];
    if (!_countries.length) { clear(); return; }
    const indicator = document.getElementById('indicator-select').value;
    fetch(`/api/timeseries?countries=${encodeURIComponent(_countries.join(','))}&indicator=${encodeURIComponent(indicator)}`)
      .then(r => r.json())
      .then(data => renderLines(data.series || {}));
  }

  function renderLines(series) {
    const countries = Object.keys(series);
    if (!countries.length) { clear(); return; }

    const allVals = countries.flatMap(c => Object.values(series[c]).filter(v => v!=null && !isNaN(v)));
    const ext = d3.extent(allVals);
    const pad = (ext[1]-ext[0])*0.08 || 0.5;
    yScale.domain([ext[0]-pad, ext[1]+pad]);
    yAxisG.transition().duration(300).call(d3.axisLeft(yScale).ticks(5));

    const indicator = document.getElementById('indicator-select').value;
    document.getElementById('ts-title').textContent = `${indicator} — selected countries`;

    yearMark.style('display',null)
      .attr('x1',xScale(_year)).attr('x2',xScale(_year));

    const line = d3.line()
      .defined(([,v]) => v!=null && !isNaN(v))
      .x(([yr]) => xScale(+yr))
      .y(([,v]) => yScale(v))
      .curve(d3.curveMonotoneX);

    linesG.selectAll('.ts-line')
      .data(countries, c => c)
      .join(
        enter => enter.append('path').attr('class','ts-line')
          .attr('stroke', c => color(c)).style('opacity',0),
        update => update,
        exit => exit.transition().duration(300).style('opacity',0).remove()
      )
      .transition().duration(400).style('opacity',1)
      .attr('stroke', c => color(c))
      .attr('d', c => line(
        Object.entries(series[c]).map(([yr,v])=>[+yr,v]).sort((a,b)=>a[0]-b[0])
      ));

    legendG.selectAll('.ts-legend-item')
      .data(countries, c => c)
      .join(
        enter => {
          const item = enter.append('g').attr('class','ts-legend-item');
          item.append('rect').attr('width',10).attr('height',10).attr('rx',2);
          item.append('text').attr('x',14).attr('y',9).attr('font-size','10px');
          return item;
        },
        update => update,
        exit => exit.remove()
      )
      .attr('transform', (_,i) => `translate(0,${i*16})`)
      .each(function(c) {
        d3.select(this).select('rect').attr('fill', color(c));
        d3.select(this).select('text').text(c);
      });
  }

  function clear() {
    linesG.selectAll('.ts-line').remove();
    legendG.selectAll('.ts-legend-item').remove();
    yearMark.style('display','none');
    document.getElementById('ts-title').textContent = 'Time series — click a country on the map';
  }

  window.TimeSeries = {
    update,
    onYearChange(year) {
      _year = +year;
      if (_countries.length) {
        yearMark.style('display',null)
          .transition().duration(150)
          .attr('x1',xScale(_year)).attr('x2',xScale(_year));
      }
    },
    refresh() { if (_countries.length) update(_countries); }
  };
}());
