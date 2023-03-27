import { Component, OnInit } from '@angular/core';
import { ChartConfiguration, ChartOptions } from 'chart.js/dist/types';
import * as pluginDataLabels from 'chartjs-plugin-datalabels';
import { DashboardApiService } from 'src/app/core/services/dashboard-api.service';
import { DestroyableComponent } from 'src/app/shared/components/destroyable.component';
import { takeUntil } from 'rxjs';

@Component({
  selector: 'dfm-patient-consultations-line-chart',
  templateUrl: './patient-consultations-line-chart.component.html',
  styleUrls: ['./patient-consultations-line-chart.component.scss'],
})
export class PatientConsultationsLineChartComponent extends DestroyableComponent implements OnInit {
  public lineChartLabels = ['Total', 'New', 'Unconfirmed'];

  public lineChartOptions!: ChartOptions<'line'>;

  public lineChartConfig!: ChartConfiguration<'line'>['data'];

  public lineChartLegend = false;

  public labels: any[] = [];

  constructor(private dashboardApiService: DashboardApiService) {
    super();
    this.dashboardApiService.fileTypes$.pipe(takeUntil(this.destroy$$)).subscribe((items) => {
      this.labels = [];
      this.labels = items;
      this.ngOnInit();
    });
  }

  public ngOnInit(): void {
    console.log(this.labels);
    this.dashboardApiService.overallStatusBarChart$.pipe(takeUntil(this.destroy$$)).subscribe((appointment) => {
      const dataset: any = [];

      appointment.yearlyappointments.forEach((element) => {
        if (element?.label === 'January') dataset[0] = element.value;
        else dataset[0] = 0;
        if (element?.label === 'February') dataset[1] = element.value;
        else dataset[1] = 0;
        if (element?.label === 'March') dataset[2] = element.value;
        else dataset[2] = 0;
        if (element?.label === 'April') dataset[3] = element.value;
        else dataset[3] = 0;
        if (element?.label === 'May') dataset[4] = element.value;
        else dataset[4] = 0;
        if (element?.label === 'June') dataset[5] = element.value;
        else dataset[5] = 0;
        if (element?.label === 'July') dataset[6] = element.value;
        else dataset[6] = 0;
        if (element?.label === 'August') dataset[7] = element.value;
        else dataset[7] = 0;
        if (element?.label === 'September') dataset[8] = element.value;
        else dataset[8] = 0;
        if (element?.label === 'October') dataset[9] = element.value;
        else dataset[9] = 0;
        if (element?.label === 'November') dataset[10] = element.value;
        else dataset[10] = 0;
        if (element?.label === 'December') dataset[11] = element.value;
        else dataset[11] = 0;
      });

      this.lineChartConfig = {
        labels: this.labels,
        datasets: [
          {
            data: dataset,
            label: 'Patients',
            pointBorderColor: 'white',
            pointBackgroundColor: '#6172F3',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#6172F3',
            pointStyle: 'circle',
            pointRadius: 6,
            borderColor: '#6172F3',
          },
        ],
      };

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const data = {
        data: [],
        backgroundColor: ['#FDF8F2', '#F4E3CF', '#F1D2AE'],
        hoverBackgroundColor: ['#FDF8F2', '#F4E3CF', '#F1D2AE'],
        hoverBorderColor: ['#531422', '#531422', '#531422'],
        hoverOffset: 0,
      };
    });

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
  }
}
