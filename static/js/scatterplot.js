(function () {
  const points = APP.pcaData.points;
  const year   = APP.pcaData.year;

  document.getElementById('scatter-subtitle').textContent =
    `PCA on most recent year (${year})`;

  const margin = { top: 20, right: 20, bottom: 50, left: 50 };
  const totalW = 560, totalH = 420;
  const W = totalW - margin.left - margin.right;
  const H = totalH - margin.top  - margin.bottom;

  const svg = d3.select('#scatter-svg')
    .attr('viewBox', `0 0 ${totalW} ${totalH}`);

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const pad = 0.15;
  const xExt = d3.extent(points, d => d.pc1);
  const yExt = d3.extent(points, d => d.pc2);

  const xScale = d3.scaleLinear()
    .domain([xExt[0]-(xExt[1]-xExt[0])*pad, xExt[1]+(xExt[1]-xExt[0])*pad])
    .range([0, W]);

  const yScale = d3.scaleLinear()
    .domain([yExt[0]-(yExt[1]-yExt[0])*pad, yExt[1]+(yExt[1]-yExt[0])*pad])
    .range([H, 0]);

  const zeroLineV = g.append('line').attr('class','zero-line')
    .attr('x1',xScale(0)).attr('x2',xScale(0)).attr('y1',0).attr('y2',H);
  const zeroLineH = g.append('line').attr('class','zero-line')
    .attr('x1',0).attr('x2',W).attr('y1',yScale(0)).attr('y2',yScale(0));

  const xAxisG = g.append('g').attr('class','axis').attr('transform',`translate(0,${H})`)
    .call(d3.axisBottom(xScale).ticks(6));
  const yAxisG = g.append('g').attr('class','axis')
    .call(d3.axisLeft(yScale).ticks(6));

  g.append('text').attr('class','axis-label')
    .attr('x',W/2).attr('y',H+40).attr('text-anchor','middle').text('PC1');
  g.append('text').attr('class','axis-label')
    .attr('transform','rotate(-90)').attr('x',-H/2).attr('y',-38)
    .attr('text-anchor','middle').text('PC2');

  const dotsG = g.append('g');

  let _brushed = new Set();
  let _mapHighlight = null;

  const circles = dotsG.selectAll('circle.dot')
    .data(points)
    .join('circle')
      .attr('class','dot')
      .attr('cx', d => xScale(d.pc1))
      .attr('cy', d => yScale(d.pc2))
      .attr('r', 5)
    .on('mousemove', (event, d) => {
      const tip = document.getElementById('tooltip');
      tip.style.display = 'block';
      tip.style.left = (event.clientX+12)+'px';
      tip.style.top  = (event.clientY-28)+'px';
      tip.textContent = d.country;
      if (window.WorldMap) window.WorldMap.highlightCountry(d.country);
    })
    .on('mouseleave', () => {
      document.getElementById('tooltip').style.display='none';
      if (window.WorldMap) window.WorldMap.clearHighlight();
    })
    .on('click', (event, d) => {
      if (_brushed.size > 0) return;
      _brushed.clear();
      _brushed.add(d.country);
      updateDotStyles();
      if (window.WorldMap) window.WorldMap.setSelectedCountries([..._brushed]);
    });

  function updateDotStyles() {
    circles
      .classed('map-highlight',   d => d.country === _mapHighlight)
      .classed('brush-selected',  d => _brushed.has(d.country));
  }

  const brush = d3.brush()
    .extent([[0,0],[W,H]])
    .on('brush end', (event) => {
      const sel = event.selection;
      if (!sel) {
        _brushed.clear();
        updateDotStyles();
        if (window.WorldMap) window.WorldMap.setSelectedCountries([]);
        return;
      }
      const [[x0,y0],[x1,y1]] = sel;
      _brushed.clear();
      circles.each(function(d) {
        const cx = xScale(d.pc1), cy = yScale(d.pc2);
        if (cx>=x0&&cx<=x1&&cy>=y0&&cy<=y1) _brushed.add(d.country);
      });
      updateDotStyles();
      if (window.WorldMap) window.WorldMap.setSelectedCountries([..._brushed]);
    });

  g.append('g').attr('class','brush').call(brush);

  window.ScatterPlot = {
    highlightCountry(name) {
      _mapHighlight = name;
      updateDotStyles();
    },
    clearHighlight() {
      _mapHighlight = null;
      updateDotStyles();
    },
    updatedata(newPcaData){
      const Newpoints = newPcaData.points;
      const newYear = newPcaData.year;
      document.getElementById('scatter-subtitle').textContent = `PCA on year ${newYear}`;
      const xExt = d3.extent(Newpoints, d => d.pc1);
      const yExt = d3.extent(Newpoints, d => d.pc2);
      xScale.domain([xExt[0]-(xExt[1]-xExt[0])*pad, xExt[1]+(xExt[1]-xExt[0])*pad]);
      yScale.domain([yExt[0]-(yExt[1]-yExt[0])*pad, yExt[1]+(yExt[1]-yExt[0])*pad]);
      xAxisG.transition().duration(400).call(d3.axisBottom(xScale).ticks(6));
      yAxisG.transition().duration(400).call(d3.axisLeft(yScale).ticks(6));
      zeroLineV.transition().duration(400).attr('x1', xScale(0)).attr('x2', xScale(0));
      zeroLineH.transition().duration(400).attr('y1', yScale(0)).attr('y2', yScale(0));
      circles.data(Newpoints, d => d.country).transition().duration(400).attr('cx', d => xScale(d.pc1)).attr('cy', d => yScale(d.pc2));
    }
  };
}());
