import { Component, OnDestroy, OnInit } from '@angular/core';
import { ChartConfiguration, ChartData, ChartOptions } from 'chart.js';
import * as pluginDataLabels from 'chartjs-plugin-datalabels';
import { takeUntil } from 'rxjs';
import { DashboardApiService } from 'src/app/core/services/dashboard-api.service';
import { ShareDataService } from 'src/app/core/services/share-data.service';
import { DestroyableComponent } from 'src/app/shared/components/destroyable.component';
import { AppointmentChartDataType } from 'src/app/shared/models/dashboard.model';
import { Translate } from 'src/app/shared/models/translate.model';

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

	public doughnutChartLabels: string[] = [];

	public doughnutChartOptions!: ChartOptions<'doughnut'>;

	public doughnutChartConfig!: ChartConfiguration<'doughnut'>['data'];

	public doughnutChartLegend = false;

	public noDataFound: boolean = true;

	public doughnutChartPlugins = [pluginDataLabels.default];

	private selectedLang!: string;

	private chartData!: AppointmentChartDataType[];

	constructor(private dashboardApiService: DashboardApiService, private shareDataSvc: ShareDataService) {
		super();
		this.shareDataSvc.getLanguage$().pipe(takeUntil(this.destroy$$)).subscribe({
			next: (lang) => {
				this.selectedLang = lang;
				if(this.chartData)this.createChartConfig(this.chartData);
			},
			
		});
	}

	public ngOnInit(): void {
		this.dashboardApiService.appointmentDoughnutChartData$$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (chartData) => {
				this.chartData = chartData;
				this.createChartConfig(chartData);
			},
		});
	}

	private createChartConfig(chartData: AppointmentChartDataType[]): void {
		this.doughnutChartLabels = [];
		chartData.forEach((data) => {
			this.appointmentDetails[data.label] = data.value;
			this.doughnutChartLabels.push(Translate.AppointmentStatus[data.label][this.selectedLang]);
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
					data: [...chartData.map((item) => item.value)],
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
