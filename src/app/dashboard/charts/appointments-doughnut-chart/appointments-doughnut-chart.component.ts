import { Component, OnInit } from '@angular/core';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import * as pluginDataLabels from 'chartjs-plugin-datalabels';

@Component({
  selector: 'dfm-appointments-doughnut-chart',
  templateUrl: './appointments-doughnut-chart.component.html',
  styleUrls: ['./appointments-doughnut-chart.component.scss'],
})
export class AppointmentsDoughnutChartComponent implements OnInit {
  public appointmentDetails = {
    new: 8,
    unconfirmed: 20,
    total: 120,
  };

  public doughnutChartLabels = ['Total', 'New', 'Unconfirmed'];

  public doughnutChartOptions!: ChartOptions<'doughnut'>;

  public doughnutChartConfig!: ChartConfiguration<'doughnut'>['data'];

  public doughnutChartLegend = false;

  public doughnutChartPlugins = [pluginDataLabels.default];

  public ngOnInit(): void {
    this.doughnutChartConfig = {
      labels: this.doughnutChartLabels,
      datasets: [
        {
          data: [this.appointmentDetails.total, this.appointmentDetails.new, this.appointmentDetails.unconfirmed],
          backgroundColor: ['#FDF8F2', '#F4E3CF', '#F1D2AE'],
          hoverBackgroundColor: ['#FDF8F2', '#F4E3CF', '#F1D2AE'],
          hoverBorderColor: ['#531422', '#531422', '#531422'],
          hoverOffset: 0,
        },
      ],
    };

    this.doughnutChartOptions = {
      responsive: true,
      plugins: {
        datalabels: {
          anchor: 'center',
          align: 'center',
          color: '#531422',
          font: {
            size: 16,
          },
        },
      },
    };

    // this.doughnutChartDatasets = [{
    //   data: {
    //   }
    // }]
  }
}
