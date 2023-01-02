import {Component, OnInit} from '@angular/core';
import {ChartConfiguration, ChartOptions} from 'chart.js/dist/types';
import * as pluginDataLabels from 'chartjs-plugin-datalabels';

@Component({
  selector: 'dfm-patient-consultations-line-chart',
  templateUrl: './patient-consultations-line-chart.component.html',
  styleUrls: ['./patient-consultations-line-chart.component.scss'],
})
export class PatientConsultationsLineChartComponent implements OnInit {
  public lineChartLabels = ['Total', 'New', 'Unconfirmed'];

  public lineChartOptions!: ChartOptions<'line'>;

  public lineChartConfig!: ChartConfiguration<'line'>['data'];

  public lineChartLegend = false;

  public ngOnInit(): void {
    this.lineChartConfig = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [
        {
          data: [30, 43, 42, 44, 49, 40, 40, 45, 38, 36, 40, 40],
          label: 'Patients',
          pointBorderColor: 'white',
          pointBackgroundColor: '#6172F3',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#6172F3',
          pointStyle: 'circle',
          pointRadius: 6,
          borderColor: '#6172F3',
        },
        {
          data: [28, 40, 40, 42, 40, 38, 37, 40, 34, 29, 39, 35],
          label: 'Consultations',
          pointBorderColor: 'white',
          pointBackgroundColor: '#15B79E',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#15B79E',
          pointStyle: 'circle',
          pointRadius: 6,
          borderColor: '#15B79E',
        },
      ],
    };

    // this.lineChartOptions = {
    //   elements: {
    //     line: {
    //       tension: 0.5,
    //     },
    //   },
    //   scales: {
    //     // We use this empty structure as a placeholder for dynamic theming.
    //     y: {
    //       position: 'left',
    //     },
    //     y1: {
    //       position: 'right',
    //       grid: {
    //         color: 'rgba(255,0,0,0.3)',
    //       },
    //       ticks: {
    //         color: 'red',
    //       },
    //     },
    //   },
    //
    //   plugins: {
    //     legend: {
    //       display: true,
    //     },
    //   },
    // };

    const data = {
      data: [],
      backgroundColor: ['#FDF8F2', '#F4E3CF', '#F1D2AE'],
      hoverBackgroundColor: ['#FDF8F2', '#F4E3CF', '#F1D2AE'],
      hoverBorderColor: ['#531422', '#531422', '#531422'],
      hoverOffset: 0,
    };
  }
}
