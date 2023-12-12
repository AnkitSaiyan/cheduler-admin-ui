import { Component, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { LoaderService } from 'src/app/core/services/loader.service';
import { DestroyableComponent } from '../destroyable.component';

@Component({
	selector: 'dfm-mat-spinner',
	templateUrl: './mat-spinner.component.html',
	styleUrls: ['./mat-spinner.component.scss'],
})
export class MatSpinnerComponent extends DestroyableComponent implements AfterViewInit {
	public isSpinnerActive$$ = new Subject<boolean>();

	constructor(private loaderService: LoaderService, private cdr: ChangeDetectorRef) {
		super();
	}

	public ngAfterViewInit(): void {
		this.loaderService.isSpinnerActive$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (value) => {
				this.isSpinnerActive$$.next(value);
				this.cdr.detectChanges();
			},
		});
	}
}
