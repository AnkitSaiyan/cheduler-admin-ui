import { Component, Input, HostBinding } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { RepeatType } from '../../models/absence.model';
import { getNumberArray } from '../../utils/getNumberArray';

@Component({
	selector: 'dfm-repeat-form',
	templateUrl: './repeat-form.component.html',
	styleUrls: ['./repeat-form.component.scss'],
})
export class RepeatFormComponent {
	@Input() public form!: FormGroup;

	@HostBinding('class.repeat-form')
	public readonly hostClass = true;

	public RepeatType = RepeatType;

	public repeatEvery = [...getNumberArray(28).map((d) => ({ name: d.toString(), value: d.toString() }))];
}
