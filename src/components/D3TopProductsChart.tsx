import { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Sale } from '../types';
import { Calendar, ShoppingBag, DollarSign, Award, Info } from 'lucide-react';

interface D3TopProductsChartProps {
  sales: Sale[];
}

type TimeRange = 'weekly' | 'monthly' | 'quarterly';
type MetricType = 'qty' | 'value';

interface ProductData {
  name: string;
  qty: number;
  value: number;
}

export default function D3TopProductsChart({ sales }: D3TopProductsChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('monthly');
  const [metric, setMetric] = useState<MetricType>('qty');
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 350 });

  // Handle responsiveness via ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        setDimensions((prev) => ({ ...prev, width: Math.max(width, 280) }));
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Filter and aggregate data
  const chartData: ProductData[] = useMemo(() => {
    const now = new Date();
    let days = 30;
    if (timeRange === 'weekly') days = 7;
    if (timeRange === 'quarterly') days = 90;

    const cutoff = new Date();
    cutoff.setDate(now.getDate() - days);

    // Aggregate sales product quantities and values
    const agg: { [name: string]: { qty: number; value: number } } = {};

    sales.forEach((sale) => {
      const saleDate = new Date(sale.date);
      if (saleDate >= cutoff) {
        sale.products.forEach((p) => {
          const name = p.name;
          if (!agg[name]) {
            agg[name] = { qty: 0, value: 0 };
          }
          agg[name].qty += p.quantity;
          agg[name].value += p.total;
        });
      }
    });

    // Transform into array and sort by selected metric
    return Object.entries(agg)
      .map(([name, stats]) => ({
        name,
        qty: stats.qty,
        value: stats.value,
      }))
      .sort((a, b) => b[metric] - a[metric])
      .slice(0, 7); // Display top 7 selling products
  }, [sales, timeRange, metric]);

  // Render D3 Chart
  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clean up canvas before redraw

    const margin = { top: 30, right: 40, bottom: 50, left: 140 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    // Create main grouping
    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Definitions for gradients and drop shadows
    const defs = svg.append('defs');

    // Soft gradient for bars
    const gradient = defs
      .append('linearGradient')
      .attr('id', 'bar-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');

    gradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#3b82f6'); // Tailwind blue-500

    gradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#6366f1'); // Tailwind indigo-500

    // Gradient for hover/top bar
    const topGradient = defs
      .append('linearGradient')
      .attr('id', 'top-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');

    topGradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#1d4ed8'); // Tailwind blue-700

    topGradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#4f46e5'); // Tailwind indigo-600

    if (chartData.length === 0) {
      // Show empty state inside the SVG
      g.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('class', 'fill-slate-400 font-sans text-xs italic')
        .text('No transaction records found for this period.');
      return;
    }

    // Set scales
    const y = d3
      .scaleBand()
      .domain(chartData.map((d) => d.name))
      .range([0, height])
      .padding(0.25);

    const xMax = d3.max(chartData, (d) => d[metric]) || 0;
    const x = d3
      .scaleLinear()
      .domain([0, xMax * 1.05]) // Add a 5% padding at the end of the scale
      .range([0, width]);

    // Draw grid lines
    g.append('g')
      .attr('class', 'grid-lines')
      .attr('transform', `translate(0,${height})`)
      .call(
        d3
          .axisBottom(x)
          .ticks(5)
          .tickSize(-height)
          .tickFormat(() => '')
      )
      .call((g) => g.select('.domain').remove())
      .call((g) =>
        g
          .selectAll('.tick line')
          .attr('stroke', '#f1f5f9') // soft slate-100
          .attr('stroke-dasharray', '3,3')
      );

    // Custom Formatter for Metrics
    const formatValue = (v: number) => {
      if (metric === 'value') {
        return `₹${v.toLocaleString('en-IN')}`;
      }
      return `${v} Units`;
    };

    // Draw Y-Axis
    const yAxis = g
      .append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(y).tickSize(0).tickPadding(10));

    // Customize Y-Axis font styling
    yAxis
      .selectAll('.tick text')
      .attr('class', 'font-sans font-bold text-slate-700 text-[10px]')
      .style('text-anchor', 'end')
      .style('max-width', '120px')
      .call(wrapText, 120);

    yAxis.select('.domain').attr('stroke', '#e2e8f0');

    // Draw X-Axis
    const xAxis = g
      .append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(
        d3
          .axisBottom(x)
          .ticks(5)
          .tickFormat((v) => {
            const num = Number(v);
            if (metric === 'value') {
              if (num >= 1000) return `₹${(num / 1000).toFixed(1)}k`;
              return `₹${num}`;
            }
            return String(num);
          })
      );

    xAxis
      .selectAll('.tick text')
      .attr('class', 'font-sans font-medium text-slate-500 text-[9px]');

    xAxis.select('.domain').attr('stroke', '#e2e8f0');

    // Create Tooltip selection
    const tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'd3-chart-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background-color', '#0f172a') // Slate-900
      .style('color', '#fff')
      .style('padding', '8px 12px')
      .style('border-radius', '8px')
      .style('font-size', '11px')
      .style('font-family', 'system-ui, sans-serif')
      .style('box-shadow', '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)')
      .style('z-index', '9999')
      .style('pointer-events', 'none');

    // Render Bars
    const bars = g
      .selectAll('.bar')
      .data(chartData)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('y', (d) => y(d.name) || 0)
      .attr('x', 0)
      .attr('height', y.bandwidth())
      .attr('width', (d) => x(d[metric]))
      .attr('fill', (d, i) => (i === 0 ? 'url(#top-gradient)' : 'url(#bar-gradient)'))
      .attr('rx', 4) // Rounded corners on the end
      .attr('ry', 4)
      .style('cursor', 'pointer')
      .on('mouseover', function (event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('opacity', 0.85);

        tooltip
          .html(
            `<div class="space-y-1">
              <p class="font-bold border-b border-slate-700 pb-0.5">${d.name}</p>
              <p class="flex justify-between gap-4"><span class="text-slate-400">Qty Sold:</span> <span class="font-mono font-semibold">${d.qty}</span></p>
              <p class="flex justify-between gap-4"><span class="text-slate-400">Total Revenue:</span> <span class="font-mono font-semibold text-emerald-400">₹${d.value.toLocaleString('en-IN')}</span></p>
            </div>`
          )
          .style('visibility', 'visible');
      })
      .on('mousemove', function (event) {
        tooltip
          .style('top', `${event.pageY - 10}px`)
          .style('left', `${event.pageX + 15}px`);
      })
      .on('mouseout', function () {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('opacity', 1);

        tooltip.style('visibility', 'hidden');
      });

    // Draw value labels on top of the bars statically
    g.selectAll('.label')
      .data(chartData)
      .enter()
      .append('text')
      .attr('class', 'label font-sans font-bold text-slate-700 text-[10px]')
      .attr('y', (d) => (y(d.name) || 0) + y.bandwidth() / 2 + 3.5)
      .attr('x', (d) => x(d[metric]) + 8)
      .attr('opacity', 1)
      .text((d) => formatValue(d[metric]));

    // Clean up tooltip element on unmount
    return () => {
      tooltip.remove();
    };
  }, [chartData, dimensions, metric]);

  // Helper to wrap long SVG text labels
  function wrapText(selection: d3.Selection<d3.BaseType, unknown, SVGGElement, any>, width: number) {
    selection.each(function () {
      const text = d3.select(this);
      const words = text.text().split(/\s+/).reverse();
      let word;
      let line: string[] = [];
      let lineNumber = 0;
      const lineHeight = 1.1; // ems
      const y = text.attr('y');
      const dy = parseFloat(text.attr('dy') || '0');
      let tspan = text
        .text(null)
        .append('tspan')
        .attr('x', 0)
        .attr('y', y)
        .attr('dy', dy + 'em');

      while ((word = words.pop())) {
        line.push(word);
        tspan.text(line.join(' '));
        if ((tspan.node()?.getComputedTextLength() || 0) > width) {
          line.pop();
          tspan.text(line.join(' '));
          line = [word];
          tspan = text
            .append('tspan')
            .attr('x', 0)
            .attr('y', y)
            .attr('dy', ++lineNumber * lineHeight + dy + 'em')
            .text(word);
        }
      }
    });
  }

  return (
    <div className="glass-card rounded-2xl p-5 border border-slate-150 bg-white shadow-xs space-y-4" id="d3-top-products-section">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Award className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-800">D3.js Core Engine: Product Volume Ranks</h3>
          </div>
          <p className="text-[11px] text-slate-400">
            Interactive analytical charts visualizing inventory turns and sales velocity
          </p>
        </div>

        {/* Chart Configuration controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time Range Filter */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            {([
              { id: 'weekly', label: 'Weekly', icon: Calendar },
              { id: 'monthly', label: 'Monthly', icon: Calendar },
              { id: 'quarterly', label: 'Quarterly', icon: Calendar },
            ] as const).map((r) => (
              <button
                key={r.id}
                onClick={() => setTimeRange(r.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                  timeRange === r.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-200/50'
                }`}
              >
                <span>{r.label}</span>
              </button>
            ))}
          </div>

          {/* Metric Selector */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setMetric('qty')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                metric === 'qty'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/50'
              }`}
              title="Filter by Quantity Sold"
            >
              <ShoppingBag className="w-3 h-3" />
              <span>Qty</span>
            </button>
            <button
              onClick={() => setMetric('value')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                metric === 'value'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/50'
              }`}
              title="Filter by Gross Invoice Value"
            >
              <DollarSign className="w-3 h-3" />
              <span>Value</span>
            </button>
          </div>
        </div>
      </div>

      {/* D3 canvas */}
      <div ref={containerRef} className="w-full overflow-hidden relative min-h-[350px]">
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="mx-auto"
        />
      </div>

      {/* Insights footnote */}
      <div className="bg-slate-50 rounded-xl p-3 border border-slate-150 flex items-start gap-2 text-[11px] text-slate-500 leading-relaxed">
        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <div>
          {chartData.length > 0 ? (
            <p>
              Your top selling line in the selected <strong>{timeRange}</strong> range is{' '}
              <strong className="text-slate-800">{chartData[0].name}</strong> with{' '}
              <strong>{metric === 'qty' ? `${chartData[0].qty} units sold` : `₹${chartData[0].value.toLocaleString('en-IN')} gross sales`}</strong>. Maintain healthy safety stock bounds to mitigate supply lapses.
            </p>
          ) : (
            <p>
              No sales registered within the selected <strong>{timeRange}</strong> range. Try extending your range or creating sample invoices under the Billing portal.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
