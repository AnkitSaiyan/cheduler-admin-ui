import { Component, OnInit } from '@angular/core';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import * as pluginDataLabels from 'chartjs-plugin-datalabels';
import { DashboardApiService } from 'src/app/core/services/dashboard-api.service';
import { DestroyableComponent } from 'src/app/shared/components/destroyable.component';
import { BehaviorSubject, takeUntil } from 'rxjs';

@Component({
	selector: 'dfm-completed-bar-chart',
	templateUrl: './completed-bar-chart.component.html',
	styleUrls: ['./completed-bar-chart.component.scss'],
})
export class CompletedBarChartComponent extends DestroyableComponent implements OnInit {
	public completedBarChartLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

	public cancelledBarChartOptions!: ChartOptions<'bar'>;

	public cancelledBarChartConfig!: ChartConfiguration<'bar'>['data'];

	public cancelledBarChartLegend = false;

	public cancelledBarChartPlugins = [pluginDataLabels.default];

	public status$$ = new BehaviorSubject<any>(null);

	public isNoData$$ = new BehaviorSubject<boolean>(false);

	constructor(private dashboardApiService: DashboardApiService) {
		super();
	}

	public ngOnInit(): void {
		this.dashboardApiService.completedBarChart$.pipe(takeUntil(this.destroy$$)).subscribe((appointment) => {
			this.status$$.next(appointment?.status);
			if (!appointment?.completedappointments || appointment?.completedappointments === null) {
				this.isNoData$$.next(true);
			}
			const dataset: any = Array(7).fill(0);
			appointment.completedappointments.forEach((element) => {
				switch (true) {
					case element?.label === 'Sunday':
						dataset[0] = element.value;
						break;
					case element?.label === 'Monday':
						dataset[1] = element.value;
						break;
					case element?.label === 'Tuesday':
						dataset[2] = element.value;
						break;
					case element?.label === 'Wednesday':
						dataset[3] = element.value;
						break;
					case element?.label === 'Thursday':
						dataset[4] = element.value;
						break;
					case element?.label === 'Friday':
						dataset[5] = element.value;
						break;
					case element?.label === 'Saturday':
						dataset[6] = element.value;
						break;
					default:
						break;
				}
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
