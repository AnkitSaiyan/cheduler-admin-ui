import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class LoaderService {
	private isLoaderActive$$ = new BehaviorSubject<boolean>(false);

	private isSpinnerActive$$ = new BehaviorSubject<boolean>(false);

	public get isActive$() {
		return this.isLoaderActive$$.asObservable();
	}

	public get isSpinnerActive$() {
		return this.isSpinnerActive$$.asObservable();
	}

	public activate() {
		this.isLoaderActive$$.next(true);
	}

	public deactivate() {
		this.isLoaderActive$$.next(false);
	}

	public spinnerActivate() {
		this.isSpinnerActive$$.next(true);
	}

	public spinnerDeactivate() {
		this.isSpinnerActive$$.next(false);
	}
}
