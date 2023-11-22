import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { takeUntil } from 'rxjs';
import { EndDateType, RepeatType } from '../../models/absence.model';
import { DestroyableComponent } from '../destroyable.component';
import { getNumberArray } from '../../utils/getNumberArray';

@Component({
	selector: 'dfm-repeat-form',
	templateUrl: './repeat-form.component.html',
	styleUrls: ['./repeat-form.component.scss'],
	host: {
		class: 'repeat-form',
	},
})
export class RepeatFormComponent extends DestroyableComponent implements OnInit, OnDestroy {
	@Input() form!: FormGroup;

	public RepeatType = RepeatType;

	public repeatEvery = [...getNumberArray(28).map((d) => ({ name: d.toString(), value: d.toString() }))];

	constructor() {
		super();
	}

	ngOnInit() {}

	public override ngOnDestroy(): void {
		super.ngOnDestroy();
	}
}
