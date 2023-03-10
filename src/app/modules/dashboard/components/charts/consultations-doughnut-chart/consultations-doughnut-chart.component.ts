import { Component, OnInit } from '@angular/core';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import * as pluginDataLabels from 'chartjs-plugin-datalabels';

@Component({
  selector: 'dfm-consultations-doughnut-chart',
  templateUrl: './consultations-doughnut-chart.component.html',
  styleUrls: ['./consultations-doughnut-chart.component.scss'],
})
export class ConsultationsDoughnutChartComponent implements OnInit {
  public cancelledBarChartLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  public cancelledBarChartOptions!: ChartOptions<'bar'>;

  public cancelledBarChartConfig!: ChartConfiguration<'bar'>['data'];

  public cancelledBarChartLegend = false;

  public cancelledBarChartPlugins = [pluginDataLabels.default];

  public ngOnInit(): void {
    this.cancelledBarChartConfig = {
      labels: this.cancelledBarChartLabels,
      datasets: [
        {
          barPercentage: 0.5,
          // categoryPercentage: 1.0,
          data: [65, 59, 80, 81, 56, 55, 40],
          backgroundColor: ['#F7B27A'],
          hoverBackgroundColor: ['#EF6820'],
        },
      ],
    };

    this.cancelledBarChartOptions = {
      responsive: true,
      scales: {
        x: {
          display: true,
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
          color: '#EF6820',
          font: {
            size: 8,
          },
        },
      },
    };
  }

  // this.doughnutChartDatasets = [{
  //   data: {
  //   }
  // }]
}
