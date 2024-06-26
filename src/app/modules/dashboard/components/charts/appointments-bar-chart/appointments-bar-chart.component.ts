import { Component, OnInit } from '@angular/core';
import { ChartConfiguration, ChartOptions } from 'chart.js/dist/types';
import * as pluginDataLabels from 'chartjs-plugin-datalabels';
import { takeUntil } from 'rxjs';
import { DashboardApiService } from 'src/app/core/services/dashboard-api.service';
import { DestroyableComponent } from 'src/app/shared/components/destroyable.component';

@Component({
	selector: 'dfm-appointments-bar-chart',
	templateUrl: './appointments-bar-chart.component.html',
	styleUrls: ['./appointments-bar-chart.component.scss'],
})
export class AppointmentsBarChartComponent extends DestroyableComponent implements OnInit {
	public appointmentBarChartLabels = ['2006', '2007', '2008', '2009', '2010', '2011', '2012'];

	public appointmentBarChartOptions!: ChartOptions<'bar'>;

	public appointmentBarChartConfig!: ChartConfiguration<'bar'>['data'];

	public appointmentBarChartLegend = false;

	public appointmentBarChartPlugins = [pluginDataLabels.default];

	public appointmentDetails: any;

	constructor(private dashboardApiService: DashboardApiService) {
		super();
	}

	public ngOnInit(): void {
		this.dashboardApiService.appointmentBarChart$.pipe(takeUntil(this.destroy$$)).subscribe((appointment) => {
			this.appointmentDetails = appointment.weeklyappointments;
		});

		this.appointmentBarChartConfig = {
			labels: this.appointmentBarChartLabels,
			datasets: [
				{
					barPercentage: 1.0,
					data: [],
					backgroundColor: ['#FEEE95'],
				},
			],
		};

		this.appointmentBarChartOptions = {
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
