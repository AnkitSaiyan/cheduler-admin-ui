import { Component, OnInit } from '@angular/core';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import * as pluginDataLabels from 'chartjs-plugin-datalabels';
import { DashboardApiService } from 'src/app/core/services/dashboard-api.service';
import { DestroyableComponent } from 'src/app/shared/components/destroyable.component';
import { BehaviorSubject, takeUntil } from 'rxjs';

@Component({
  selector: 'dfm-consultations-doughnut-chart',
  templateUrl: './consultations-doughnut-chart.component.html',
  styleUrls: ['./consultations-doughnut-chart.component.scss'],
})
export class ConsultationsDoughnutChartComponent extends DestroyableComponent implements OnInit {
  public completedBarChartLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  public cancelledBarChartOptions!: ChartOptions<'bar'>;

  public cancelledBarChartConfig!: ChartConfiguration<'bar'>['data'];

  public cancelledBarChartLegend = false;

  public cancelledBarChartPlugins = [pluginDataLabels.default];

  constructor(private dashboardApiService: DashboardApiService) {
    super();
  }

  public ngOnInit(): void {
    this.dashboardApiService.completedBarChart$.pipe(takeUntil(this.destroy$$)).subscribe((appointment) => {
      const dataset: any = [];
      appointment.completedappointments.forEach((element) => {
        if (element?.label === 'Sunday') dataset[0] = element.value;
        else dataset[0] = 0;
        if (element?.label === 'Monday') dataset[1] = element.value;
        else dataset[1] = 0;
        if (element?.label === 'Tuesday') dataset[2] = element.value;
        else dataset[2] = 0;
        if (element?.label === 'Wednesday') dataset[3] = element.value;
        else dataset[3] = 0;
        if (element?.label === 'Thursday') dataset[4] = element.value;
        else dataset[4] = 0;
        if (element?.label === 'Friday') dataset[5] = element.value;
        else dataset[5] = 0;
        if (element?.label === 'Saturday') dataset[6] = element.value;
        else dataset[6] = 0;
      });

      this.cancelledBarChartConfig = {
        labels: this.completedBarChartLabels,
        datasets: [
          {
            barPercentage: 0.5,
            // categoryPercentage: 1.0,
            data: dataset,
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
    });
  }

  // this.doughnutChartDatasets = [{
  //   data: {
  //   }
  // }]
}
