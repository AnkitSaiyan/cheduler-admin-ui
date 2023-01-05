import { Component, OnInit } from '@angular/core';
import { ChartConfiguration, ChartOptions } from 'chart.js/dist/types';
import * as pluginDataLabels from 'chartjs-plugin-datalabels';

@Component({
  selector: 'dfm-appointments-bar-chart',
  templateUrl: './appointments-bar-chart.component.html',
  styleUrls: ['./appointments-bar-chart.component.scss'],
})
export class AppointmentsBarChartComponent implements OnInit {
  public appointmentBarChartLabels = [ '2006', '2007', '2008', '2009', '2010', '2011', '2012' ];

  public appointmentBarChartOptions!: ChartOptions<'bar'>;

  public appointmentBarChartConfig!: ChartConfiguration<'bar'>['data'];

  public appointmentBarChartLegend = false;

  public appointmentBarChartPlugins = [pluginDataLabels.default];

  public ngOnInit(): void {
    this.appointmentBarChartConfig = {
      labels: this.appointmentBarChartLabels,
      datasets: [
        {
          barPercentage: 1.0,
          // categoryPercentage: 1.0,
          data: [65, 59, 80, 81, 56, 55, 40],
          backgroundColor: ['#FEEE95'],
          hoverBackgroundColor: ['#FEEE95'],
        },
      ],
    };

    this.appointmentBarChartOptions = {
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
          color: '#531422',
          font: {
            size: 8,
          },
        },
      },
    };
  }
}
