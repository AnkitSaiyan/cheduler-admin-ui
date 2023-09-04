import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { EndDateType, RepeatType } from '../../models/absence.model';
import { DestroyableComponent } from '../destroyable.component';
import { takeUntil } from 'rxjs';

@Component({
	selector: 'dfm-repeat-form',
	templateUrl: './repeat-form.component.html',
	styleUrls: ['./repeat-form.component.scss'],
})
export class RepeatFormComponent extends DestroyableComponent implements OnInit, OnDestroy {
	@Input() form!: FormGroup;

	public RepeatType = RepeatType;

	constructor() {
		super();
	}

	ngOnInit() {
		this.form.valueChanges.subscribe((value) => {
			console.log('test', value);
		});
	}

	public override ngOnDestroy(): void {
		super.ngOnDestroy();
	}
}

