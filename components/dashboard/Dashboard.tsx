/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { useDashboardStore, Metric, ChartConfig } from '@/lib/state';
import c from 'classnames';
import { Bar, Doughnut, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import type { ChartData } from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const chartComponents = {
  bar: Bar,
  doughnut: Doughnut,
  pie: Pie,
};

// FIX: Extracted inline props to a dedicated interface for clarity and to fix typing issues with the `key` prop.
interface MetricCardProps {
  metric: Metric;
}

// FIX: Changed to a const with React.FC type to ensure the component type is recognized correctly, allowing the use of the `key` prop without errors.
const MetricCard: React.FC<MetricCardProps> = ({ metric }) => {
  return (
    <div className="metric-card">
      <div className="metric-card-value">{metric.value}</div>
      <div className="metric-card-label">{metric.label}</div>
    </div>
  );
}

// FIX: Extracted inline props to a dedicated interface for clarity and to fix typing issues with the `key` prop.
interface ChartProps {
  chart: ChartConfig;
}

// FIX: Changed to a const with React.FC type to ensure the component type is recognized correctly, allowing the use of the `key` prop without errors.
const Chart: React.FC<ChartProps> = ({ chart }) => {
  const ChartComponent = chartComponents[chart.type];
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
            color: 'white', // Color of legend text
          }
      },
    },
    scales: {
        x: {
          ticks: {
            color: 'white', // Color of X-axis labels
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)', // Color of X-axis grid lines
          },
        },
        y: {
          ticks: {
            color: 'white', // Color of Y-axis labels
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)', // Color of Y-axis grid lines
          },
        },
      },
    ...chart.options
  };

  return (
    <div className="chart-wrapper">
      <h3>{chart.title}</h3>
      <ChartComponent data={chart.data as ChartData<any>} options={options} />
    </div>
  );
}

export default function Dashboard() {
  const { metrics, charts, isVisible } = useDashboardStore();

  return (
    <div className={c('dashboard-container', { visible: isVisible })}>
      <div className="dashboard-content">
        {metrics.length > 0 && (
          <div className="dashboard-metrics">
            {metrics.map(metric => (
              <MetricCard key={metric.label} metric={metric} />
            ))}
          </div>
        )}
        {charts.length > 0 && (
          <div className="dashboard-charts">
            {charts.map(chart => (
              <Chart key={chart.title} chart={chart} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}