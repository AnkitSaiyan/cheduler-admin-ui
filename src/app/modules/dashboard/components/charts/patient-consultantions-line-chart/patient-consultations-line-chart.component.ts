import { Component, OnInit } from '@angular/core';
import { ChartConfiguration, ChartOptions } from 'chart.js/dist/types';
import { DashboardApiService } from 'src/app/core/services/dashboard-api.service';
import { DestroyableComponent } from 'src/app/shared/components/destroyable.component';
import { debounceTime, forkJoin, map, switchMap, takeUntil } from 'rxjs';
import { Month, MonthFull } from 'src/app/shared/models/calendar.model';
import { ShareDataService } from 'src/app/core/services/share-data.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
	selector: 'dfm-patient-consultations-line-chart',
	templateUrl: './patient-consultations-line-chart.component.html',
	styleUrls: ['./patient-consultations-line-chart.component.scss'],
})
export class PatientConsultationsLineChartComponent extends DestroyableComponent implements OnInit {
	public lineChartLabels = ['Total', 'New', 'Unconfirmed'];

	public lineChartOptions: ChartOptions<'line'> = {
		scales: {
			y: {
				beginAtZero: true,
				ticks: {
					includeBounds: true,
					precision: 0,
				},
				suggestedMax: 50,
			},
		},
	};

	public lineChartConfig!: ChartConfiguration<'line'>['data'];

	public lineChartLegend = false;

	public labels: string[] = [];

	constructor(
		private dashboardApiService: DashboardApiService,
		private translateService: TranslateService,
		private shareDataService: ShareDataService,
	) {
		super();
	}

	public ngOnInit(): void {
		this.shareDataService
			.getLanguage$()
			.pipe(
				debounceTime(0),
				map(() => Object.keys(Month).filter((key) => isNaN(+key))),
				switchMap((months) => {
					const observables = months.map((month) => this.translateService.get(month));
					return forkJoin(observables);
				}),
				takeUntil(this.destroy$$),
			)
			.subscribe({
				next: (months) => (this.labels = months),
			});

		this.dashboardApiService.yearlyAppointmentsChartData$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (yearlyAppointmentsData) => {
				const dataset: number[] = Array(12).fill(0);

				yearlyAppointmentsData.forEach((data) => {
					dataset[MonthFull[data.label.toLocaleUpperCase()] - 1] = data.value ?? 0;
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
			},
		});
	}
}
