import { Component, Input, OnInit } from '@angular/core';
import { WeekWisePracticeAvailability, Weekday } from '../../models/calendar.model';

@Component({
	selector: 'dfm-time-slots-table',
	templateUrl: './time-slots-table.component.html',
	styleUrls: ['./time-slots-table.component.scss'],
})
export class TimeSlotsTableComponent implements OnInit {
	tableData: any[] = [];

	@Input() set weekWisePracticeAvailability(data: WeekWisePracticeAvailability[]) {
		this.tableData = data;
	}

	columns: Weekday[] = [Weekday.MON, Weekday.TUE, Weekday.WED, Weekday.THU, Weekday.FRI, Weekday.SAT, Weekday.SUN];

	constructor() {}

	ngOnInit(): void {}
}
