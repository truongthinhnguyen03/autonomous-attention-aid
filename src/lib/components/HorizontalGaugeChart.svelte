<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import * as d3 from 'd3';

  export let value = 10; // Value between 0 and 100
  export let width = 400;
  export let height = 100;
  export let simulateData = false; // Whether to use simulated data

  let chart: HTMLDivElement;
  let simulationInterval: number;
  let svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  let marker: d3.Selection<SVGPathElement, unknown, null, undefined>;
  let valueText: d3.Selection<SVGTextElement, unknown, null, undefined>;

  // Simulate attention data with some randomness and trends
  function simulateAttentionValue(currentValue: number): number {
    // Add random walk with tendency to move towards center
    const randomWalk = Math.random() * 10 - 5; // Random value between -5 and 5
    const centeringForce = (50 - currentValue) * 0.1; // Pull towards 50
    let newValue = currentValue + randomWalk + centeringForce;
    
    // Ensure value stays within bounds
    newValue = Math.max(0, Math.min(100, newValue));
    return Math.round(newValue);
  }

  function startSimulation() {
    if (simulateData && !simulationInterval) {  // Only start if not already running
      stopSimulation();  // Ensure clean state
      // Set initial value when starting simulation
      value = 50; // Start from middle
      updateValue(value);
      simulationInterval = window.setInterval(() => {
        const newValue = simulateAttentionValue(value);
        updateValue(newValue);
      }, 100);
    }
  }

  function stopSimulation() {
    if (simulationInterval) {
      clearInterval(simulationInterval);
      simulationInterval = undefined;
    }
  }

  function initializeChart() {
    if (!chart) return;

    // Clear previous content
    d3.select(chart).selectAll('*').remove();

    const margin = { top: 20, right: 20, bottom: 30, left: 20 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = 40;

    // Create SVG element that takes full container width
    svg = d3.select(chart)
      .append('svg')
      .attr('width', '100%')  // Changed to 100%
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)  // Added viewBox
      .attr('preserveAspectRatio', 'xMidYMid meet')  // Added to maintain aspect ratio and center
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create gradient
    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', 'gauge-gradient')
      .attr('x1', '0%')
      .attr('x2', '100%')
      .attr('y1', '0%')
      .attr('y2', '0%');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('style', 'stop-color:#4ade80;stop-opacity:1'); // Green

    gradient.append('stop')
      .attr('offset', '50%')
      .attr('style', 'stop-color:#facc15;stop-opacity:1'); // Yellow

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('style', 'stop-color:#ef4444;stop-opacity:1'); // Red

    // Create gauge background
    svg.append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('rx', 5)
      .attr('ry', 5)
      .style('fill', 'url(#gauge-gradient)');

    // Add labels
    const labels = ['Low', 'Medium', 'High'];
    const labelPositions = [0, innerWidth/2, innerWidth];
    
    labels.forEach((label, i) => {
      svg.append('text')
        .attr('x', labelPositions[i])
        .attr('y', -5)
        .attr('text-anchor', i === 1 ? 'middle' : (i === 0 ? 'start' : 'end'))
        .attr('class', 'text-sm font-medium')
        .text(label);
    });

    // Add marker triangle (store reference for animation)
    marker = svg.append('path')
      .attr('d', 'M-6,0 L6,0 L0,8 Z')
      .attr('fill', 'black');

    // Add value text (store reference for animation)
    valueText = svg.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 25)
      .attr('text-anchor', 'middle')
      .attr('class', 'text-base font-semibold');

    // Initial position
    updateValue(value);
  }

  function updateValue(newValue: number) {
    if (!svg || !marker || !valueText) return;

    const margin = { top: 20, right: 20, bottom: 30, left: 20 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = 40;

    value = newValue;
    const markerPosition = (value / 100) * innerWidth;

    // Only show marker if simulating data
    marker.style('opacity', simulateData ? 1 : 0);

    // Update marker position and text
    if (simulateData) {
      marker
        .transition()
        .duration(200)
        .ease(d3.easeLinear)
        .attr('transform', `translate(${markerPosition},${innerHeight + 5})`);

      // Update value text immediately to avoid NaN
      valueText.text(`${Math.round(value)}%`);
    } else {
      // Show NaN when not simulating
      valueText.text('NaN');
    }
  }

  $: {
    if (svg && marker && valueText) {
      if (!simulateData) {
        updateValue(0); // Reset to initial state when disconnected
      } else {
        updateValue(value);
      }
    }
  }

  onMount(() => {
    initializeChart();
    if (simulateData) {
      startSimulation();
    } else {
      updateValue(0); // Set initial state
    }
  });

  // Watch simulateData changes
  $: {
    if (simulateData) {
      startSimulation();
    } else {
      stopSimulation();
      updateValue(0); // Reset value when disconnecting
    }
  }

  // Remove the value watch since we handle updates in simulation
  onDestroy(() => {
    stopSimulation();
  });
</script>

<div 
  bind:this={chart} 
  class="w-full h-full flex justify-center items-center"
></div>

<style>
  div {
    font-family: 'Inter', sans-serif;
    font-size: 12px;
    font-weight: 400;
    color: black;
    display: flex;
    justify-content: center;
    align-items: center;
  }
</style>
