import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { SeriesPoint } from '../lib/energy';
import { formatHM } from '../lib/time';
import { useResolvedTheme } from '../hooks/useTheme';

const cssVar = (name: string, fallback: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

/**
 * Category axis with one slot per expected interval. A missing interval is `null`,
 * and ECharts does not connect across null (connectNulls: false), so gaps stay visible.
 * Below the 0 line = charging / consuming.
 * The colours come from CSS variables, so the chart is drawn again when the theme changes.
 */
export function PowerChart({ points }: { points: SeriesPoint[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const theme = useResolvedTheme();

  useEffect(() => {
    if (!ref.current) return;
    const accent = cssVar('--accent', '#2563eb');
    const muted = cssVar('--muted', '#6b7280');
    const border = cssVar('--border', '#e5e7eb');

    const chart = echarts.init(ref.current, undefined, { renderer: 'svg' });
    chart.setOption({
      grid: { left: 8, right: 12, top: 16, bottom: 28, containLabel: true },
      tooltip: {
        trigger: 'axis',
        valueFormatter: (v: unknown) => (v == null || v === '-' ? 'no data' : `${v} W`),
      },
      xAxis: {
        type: 'category',
        data: points.map((p) => formatHM(p.t)),
        axisLabel: { color: muted, interval: (index: number) => index % 24 === 23 },
        axisLine: { lineStyle: { color: border } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: muted, formatter: (v: number) => `${v / 1000} kW` },
        splitLine: { lineStyle: { color: border } },
      },
      dataZoom: [{ type: 'inside' }],
      series: [
        {
          type: 'line',
          data: points.map((p) => p.powerW),
          connectNulls: false,
          showSymbol: true,
          symbolSize: 3,
          smooth: false,
          lineStyle: { color: accent, width: 2 },
          itemStyle: { color: accent },
          markLine: { silent: true, symbol: 'none', label: { show: false }, lineStyle: { color: muted, type: 'dashed' }, data: [{ yAxis: 0 }] },
          areaStyle: { opacity: 0.12 },
        },
      ],
    });
    const onResize = () => chart.resize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      chart.dispose();
    };
  }, [points, theme]); // theme: re-read the CSS colours after a light/dark switch

  return <div ref={ref} className="chart" role="img" aria-label="Power over the selected day" />;
}
