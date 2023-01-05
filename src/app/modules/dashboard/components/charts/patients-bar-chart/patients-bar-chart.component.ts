import { Component, OnInit } from '@angular/core';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import * as pluginDataLabels from 'chartjs-plugin-datalabels';

@Component({
  selector: 'dfm-patients-bar-chart',
  templateUrl: './patients-bar-chart.component.html',
  styleUrls: ['./patients-bar-chart.component.scss'],
})
export class PatientsBarChartComponent implements OnInit {
  public patientsBarChartLabels = ['2006', '2007', '2008', '2009', '2010', '2011', '2012'];

  public patientsBarChartOptions!: ChartOptions<'bar'>;

  public patientsBarChartConfig!: ChartConfiguration<'bar'>['data'];

  public patientsBarChartLegend = false;

  public patientsBarChartPlugins = [pluginDataLabels.default];

  public ngOnInit(): void {
    this.patientsBarChartConfig = {
      labels: this.patientsBarChartLabels,
      datasets: [
        {
          barPercentage: 1.0,
          // categoryPercentage: 1.0,
          data: [65, 59, 80, 81, 56, 55, 40],
          backgroundColor: ['#DDD6FE'],
          hoverBackgroundColor: ['#DDD6FE'],
        },
      ],
    };

    this.patientsBarChartOptions = {
      responsive: true,
      scales: {
        x: {
          display: false,
        },
        y: {
          display: false,
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        datalabels: {
          anchor: 'end',
          align: 'end',
          color: '#7839EE',
          font: {
            size: 8,
          },
        },
      },
    };
  }
}
