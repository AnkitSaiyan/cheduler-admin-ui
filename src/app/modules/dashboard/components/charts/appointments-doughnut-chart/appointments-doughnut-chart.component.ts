import { Component, OnDestroy, OnInit } from '@angular/core';
import { ChartConfiguration, ChartData, ChartOptions } from 'chart.js';
import * as pluginDataLabels from 'chartjs-plugin-datalabels';
import { takeUntil } from 'rxjs';
import { DashboardApiService } from 'src/app/core/services/dashboard-api.service';
import { DestroyableComponent } from 'src/app/shared/components/destroyable.component';
import { AppointmentChartDataType } from 'src/app/shared/models/dashboard.model';

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

	public noDataFound: boolean = false;

	public doughnutChartPlugins = [pluginDataLabels.default];

	constructor(private dashboardApiService: DashboardApiService) {
		super();
	}

	public ngOnInit(): void {
		this.dashboardApiService.appointmentDoughnutChartData$$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (chartData) => {
				this.createChartConfig(chartData);
			},
		});
	}

	private createChartConfig(chartData: AppointmentChartDataType[]): void {
		chartData.forEach((data) => {
			this.appointmentDetails[data.label] = data.value;
		});

		if (this.appointmentDetails.Total === 0 && this.appointmentDetails.Pending === 0 && this.appointmentDetails.Approved === 0) {
			this.noDataFound = false;
		} else {
			this.noDataFound = true;
		}

		this.doughnutChartConfig = {
			labels: this.doughnutChartLabels,
			datasets: [
				{
					data: [
						this.appointmentDetails.Total ? this.appointmentDetails.Total : 0,
						this.appointmentDetails.Pending ? this.appointmentDetails.Pending : 0,
						this.appointmentDetails.Approved ? this.appointmentDetails.Approved : 0,
					],
					backgroundColor: ['#E0DDE4', '#C3B3CD', '#A589B7'],
					hoverBackgroundColor: ['#E0DDE4', '#C3B3CD', '#A589B7'],
					hoverBorderColor: ['#4E2267', '#4E2267', '#4E2267'],
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
	}
}
