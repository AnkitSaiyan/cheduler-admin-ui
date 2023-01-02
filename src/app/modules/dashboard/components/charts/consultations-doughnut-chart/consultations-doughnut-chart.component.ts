import { Component, OnInit } from '@angular/core';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import * as pluginDataLabels from 'chartjs-plugin-datalabels';

@Component({
  selector: 'dfm-consultations-doughnut-chart',
  templateUrl: './consultations-doughnut-chart.component.html',
  styleUrls: ['./consultations-doughnut-chart.component.scss'],
})
export class ConsultationsDoughnutChartComponent implements OnInit {
  public doughnutChartLabels = ['A', 'B'];

  public doughnutChartOptions!: ChartOptions<'doughnut'>;

  public doughnutChartConfig!: ChartConfiguration<'doughnut'>['data'];

  public doughnutChartLegend = false;

  public doughnutChartPlugins = [];

  public ngOnInit(): void {
    this.doughnutChartConfig = {
      labels: this.doughnutChartLabels,
      datasets: [
        {
          data: [32, 68],
          backgroundColor: ['#B2CCFF', '#155EEF'],
          hoverBorderColor: ['#155EEF', '#B2CCFF'],
          hoverOffset: 1,
        },
      ],
    };

    this.doughnutChartOptions = {
      responsive: true,
      plugins: {
        datalabels: {
          // anchor: 'center',
          // align: 'center',
          // color: '#531422',
          // font: {
          //   size: 16,
          // },
        },
      },
    };

    // this.doughnutChartDatasets = [{
    //   data: {
    //   }
    // }]
  }
}
