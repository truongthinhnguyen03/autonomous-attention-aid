<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import * as d3 from 'd3';

  export let width = 300;
  export let height = 150;
  export let maxPoints = 100;
  export let isConnected = false;

  let svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  let path: d3.Selection<SVGPathElement, unknown, null, undefined>;
  let xAxis: d3.Selection<SVGGElement, unknown, null, undefined>;
  let yAxis: d3.Selection<SVGGElement, unknown, null, undefined>;
  let data: { time: number; series: { [key: string]: number } }[] = [];
  const seriesKeys = ['O1', 'O2', 'T3', 'T4'];
  const seriesColors = {
    O1: '#1d4ed8', // blue
    O2: '#ea580c', // orange
    T3: '#15803d', // green
    T4: '#dc2626'  // red
  };
  let startTime = Date.now();
  let updateInterval: number;

  // Chart margins
  const margin = { top: 20, right: 70, bottom: 30, left: 50 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Scales
  const xScale = d3.scaleLinear().range([0, innerWidth]);
  const yScale = d3.scaleLinear().range([innerHeight, 0]).domain([-50, 50]);

  // Line generator
  const lines = {} as { [key: string]: d3.Line<any> };
  seriesKeys.forEach(key => {
    lines[key] = d3.line<any>()
      .x(d => xScale(d.time))
      .y(d => yScale(d.series[key]))
      .curve(d3.curveBasis);
  });

  function generateNewDataPoint() {
    const time = Date.now() - startTime;
    const lastPoint = data.length > 0 ? data[data.length - 1].series : null;
    
    const series = {} as { [key: string]: number };
    seriesKeys.forEach(key => {
      const lastValue = lastPoint ? lastPoint[key] : 0;
      series[key] = Math.max(-50, Math.min(50, lastValue + (Math.random() - 0.5) * 10));
    });
    
    return { time, series };
  }

  function initializeChart(container: HTMLElement) {
    // Create SVG
    svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    // Add chart group
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Add axes
    xAxis = g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${innerHeight})`);

    yAxis = g.append('g')
      .attr('class', 'y-axis');

    // Add axis labels
    g.append('text')
      .attr('class', 'x-label')
      .attr('text-anchor', 'middle')
      .attr('x', innerWidth / 2)
      .attr('y', height - margin.bottom + 20)
      .text('Time (ms)');

    g.append('text')
      .attr('class', 'y-label')
      .attr('text-anchor', 'middle')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -margin.left + 15)
      .text('Amplitude (µV)');

    // Add paths for each series
    seriesKeys.forEach(key => {
      g.append('path')
        .attr('class', `line ${key}`)
        .attr('stroke', seriesColors[key])
        .attr('fill', 'none')
        .attr('stroke-width', 2);
    });

    // Add legend
    const legend = g.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${innerWidth + 10}, 0)`);

    seriesKeys.forEach((key, i) => {
      const legendRow = legend.append('g')
        .attr('transform', `translate(0, ${i * 20})`);

      legendRow.append('line')
        .attr('x1', 0)
        .attr('x2', 20)
        .attr('stroke', seriesColors[key])
        .attr('stroke-width', 2);

      legendRow.append('text')
        .attr('x', 25)
        .attr('y', 4)
        .text(key);
    });
  }

  function updateChart() {
    if (!svg) return;

    // Update x scale domain
    const xMin = data[0]?.time || 0;
    const xMax = data[data.length - 1]?.time || 100;
    xScale.domain([xMin, xMax]);

    // Update each line
    seriesKeys.forEach(key => {
      svg.select(`.line.${key}`)
        .datum(data)
        .attr('d', lines[key]);
    });

    // Update axes
    xAxis.call(
      d3.axisBottom(xScale)
        .ticks(5)
        .tickFormat(d => Math.round(d/1000) + 's')
    );
    yAxis.call(d3.axisLeft(yScale));
  }

  function updateData() {
    data = [...data, generateNewDataPoint()];
    if (data.length > maxPoints) {
      data = data.slice(-maxPoints);
    }
    updateChart();
  }

  onMount(() => {
    const container = document.querySelector('.chart-container');
    if (!container) return;

    initializeChart(container);
    updateChart(); // Just initialize axes without data
    
    // Only start updates if connected
    if (isConnected) {
      // Initialize with some data points
      for (let i = 0; i < 10; i++) {
        data = [...data, generateNewDataPoint()];
      }
      updateChart();
      
      // Start real-time updates
      updateInterval = setInterval(updateData, 100) as unknown as number;
    }
  });

  // Watch isConnected changes
  $: {
    if (isConnected) {
      if (!updateInterval) {
        data = []; // Clear existing data
        for (let i = 0; i < 10; i++) {
          data = [...data, generateNewDataPoint()];
        }
        updateChart();
        updateInterval = setInterval(updateData, 100) as unknown as number;
      }
    } else {
      if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = undefined;
        data = []; // Clear data
        updateChart(); // Update to show empty state
      }
    }
  }

  onDestroy(() => {
    if (updateInterval) {
      clearInterval(updateInterval);
    }
  });
</script>

<div class="chart-container">
  <!-- Chart will be rendered here -->
</div>

<style>
  div {
    font-family: 'Inter', sans-serif;
    font-size: 12px;
    font-weight: 400;
    color: black;
  }

  :global(.line) {
    fill: none;
    stroke-width: 2;
  }

  :global(.x-axis), :global(.y-axis) {
    color: #64748b;
  }

  :global(.x-axis path), :global(.y-axis path),
  :global(.x-axis line), :global(.y-axis line) {
    stroke: #94a3b8;
  }

  :global(.x-label), :global(.y-label) {
    fill: black;
    font-size: 12px;
    font-family: 'Inter', sans-serif;
  }

  :global(.legend text) {
    font-size: 12px;
    font-family: 'Inter', sans-serif;
    dominant-baseline: middle;
  }

  :global(.legend line) {
    stroke-width: 2;
  }
</style>
