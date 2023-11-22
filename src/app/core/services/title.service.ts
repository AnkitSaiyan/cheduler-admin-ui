import { Injectable, OnDestroy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';
import { Translate } from 'src/app/shared/models/translate.model';
import { ENG_BE } from 'src/app/shared/utils/const';
import { ShareDataService } from './share-data.service';

@Injectable()
export class AppTitlePrefix extends TitleStrategy implements OnDestroy {
	private selectedLang$$: BehaviorSubject<string> = new BehaviorSubject<string>(ENG_BE);

	private destroy$$ = new Subject<undefined>();

	updateTitle(snapshot: RouterStateSnapshot): void {
		const title = this.buildTitle(snapshot); // build the current route title
		if (title) {
			this.title.setTitle(`Cheduler - ${Translate[title][this.selectedLang$$.value]}`); // set the app prefix with the current title.
		}
	}

	constructor(private title: Title, private shareDataSvc: ShareDataService) {
		// inject the title service
		super();
		this.shareDataSvc
			.getLanguage$()
			.pipe(takeUntil(this.destroy$$))
			.subscribe({
				next: (lang) => this.selectedLang$$.next(lang),
			});
	}

	ngOnDestroy(): void {
		this.destroy$$.next(undefined);
		this.destroy$$.complete();
	}
}
