import { Component, OnInit } from '@angular/core';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import * as pluginDataLabels from 'chartjs-plugin-datalabels';
import { DashboardApiService } from 'src/app/core/services/dashboard-api.service';
import { DestroyableComponent } from 'src/app/shared/components/destroyable.component';
import { BehaviorSubject, takeUntil } from 'rxjs';

@Component({
	selector: 'dfm-patients-bar-chart',
	templateUrl: './patients-bar-chart.component.html',
	styleUrls: ['./patients-bar-chart.component.scss'],
})
export class PatientsBarChartComponent extends DestroyableComponent implements OnInit {
	public patientsBarChartLabels = ['2006', '2007', '2008', '2009', '2010', '2011', '2012'];

	public patientsBarChartOptions!: ChartOptions<'bar'>;

	public patientsBarChartConfig!: ChartConfiguration<'bar'>['data'];

	public patientsBarChartLegend = false;

	public patientsBarChartPlugins = [pluginDataLabels.default];

	public patienttDetails: any;

	constructor(private dashboardApiService: DashboardApiService) {
		super();
	}

	public ngOnInit(): void {
		this.dashboardApiService.patientsBarChart$.pipe(takeUntil(this.destroy$$)).subscribe((appointment) => {
			this.patienttDetails = appointment.patients;
		});

		this.patientsBarChartConfig = {
			labels: this.patientsBarChartLabels,
			datasets: [
				{
					barPercentage: 1.0,
					data: [],
					backgroundColor: ['#DDD6FE'],
					hoverBackgroundColor: ['#DDD6FE'],
				},
			],
		};

		this.patientsBarChartOptions = {
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
				tooltip: {
					enabled: false,
				},
				datalabels: {
					display: false,
				},
			},
		};
	}
}
