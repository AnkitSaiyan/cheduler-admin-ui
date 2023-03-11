import { Component, OnDestroy, OnInit } from '@angular/core';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import * as pluginDataLabels from 'chartjs-plugin-datalabels';
import { BehaviorSubject, takeUntil } from 'rxjs';
import { DashboardApiService } from 'src/app/core/services/dashboard-api.service';
import { DestroyableComponent } from 'src/app/shared/components/destroyable.component';

@Component({
  selector: 'dfm-appointments-doughnut-chart',
  templateUrl: './appointments-doughnut-chart.component.html',
  styleUrls: ['./appointments-doughnut-chart.component.scss'],
})
export class AppointmentsDoughnutChartComponent extends DestroyableComponent implements OnInit, OnDestroy {
  public appointmentDetails = {
    Total: 0,
    Approved: 0,
    Pending: 0,
  };

  public doughnutChartLabels = ['Total', 'New', 'Confirmed'];

  public doughnutChartOptions!: ChartOptions<'doughnut'>;

  public doughnutChartConfig!: ChartConfiguration<'doughnut'>['data'];

  public doughnutChartLegend = false;

  public doughnutChartPlugins = [pluginDataLabels.default];

  constructor(private dashboardApiService: DashboardApiService) {
    super();
  }

  public ngOnInit(): void {
    this.dashboardApiService.appointmentChart$.pipe(takeUntil(this.destroy$$)).subscribe((appointment) => {
      appointment['appointments'].forEach((element) => {
        this.appointmentDetails[element.label] = element.value;
      });

      this.doughnutChartConfig = {
        labels: this.doughnutChartLabels,
        datasets: [
          {
            data: [this.appointmentDetails.Total, this.appointmentDetails.Pending, this.appointmentDetails.Approved],
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
      // this.appoinmtnetData$$.next(appointment['data'].appointments);
      // this.filteredAppointment$$.next(appointment['data'].appointments);
    });
    // this.doughnutChartDatasets = [{
    //   data: {
    //   }
    // }]
  }
}
