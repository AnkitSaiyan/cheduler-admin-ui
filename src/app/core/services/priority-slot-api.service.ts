import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
	BehaviorSubject,
	catchError,
	combineLatest,
	debounceTime,
	filter,
	forkJoin,
	map,
	Observable,
	of,
	startWith,
	Subject,
	switchMap,
	takeUntil,
	tap,
	throttleTime,
	throwError,
} from 'rxjs';
import { BaseResponse } from 'src/app/shared/models/base-response.model';
import { NextSlotOpenPercentageData, PrioritySlot } from 'src/app/shared/models/priority-slots.model';
import { environment } from 'src/environments/environment';
import { DestroyableComponent } from 'src/app/shared/components/destroyable.component';
import { UtcToLocalPipe } from 'src/app/shared/pipes/utc-to-local.pipe';
import { DateTimeUtils } from 'src/app/shared/utils/date-time.utils';
import { LoaderService } from './loader.service';
import { RepeatType } from '../../shared/models/absence.model';
import { ShareDataService } from './share-data.service';
import { Translate } from '../../shared/models/translate.model';

@Injectable({
	providedIn: 'root',
})
export class PrioritySlotApiService extends DestroyableComponent {
	public repeatTypes = [
		{
			name: 'Daily',
			value: RepeatType.Daily,
		},
		{
			name: 'Weekly',
			value: RepeatType.Weekly,
		},
		{
			name: 'Monthly',
			value: RepeatType.Monthly,
		},
	];

	private readonly prioritySlots: string = `${environment.schedulerApiUrl}/priorityslot`;

	private refreshPrioritySlots$$ = new Subject<void>();

	private selectedLang$$ = new BehaviorSubject<string>('');

	private pageNo$$ = new BehaviorSubject<number>(1);

	constructor(
		private shareDataSvc: ShareDataService,
		private http: HttpClient,
		private loaderSvc: LoaderService,
		private utcToLocalPipe: UtcToLocalPipe,
	) {
		super();
		this.shareDataSvc
			.getLanguage$()
			.pipe(takeUntil(this.destroy$$))
			.subscribe({
				next: (lang) => this.selectedLang$$.next(lang),
			});
	}

	public set pageNo(pageNo: number) {
		this.pageNo$$.next(pageNo);
	}

	public get pageNo(): number {
		return this.pageNo$$.value;
	}

	public get prioritySlots$(): Observable<BaseResponse<PrioritySlot[]>> {
		return combineLatest([this.refreshPrioritySlots$$.pipe(startWith('')), this.pageNo$$]).pipe(
			switchMap(([_, pageNo]) => this.fetchAllPrioritySlots(pageNo)),
		);
	}

	public getPriorityPercentage$(dates: string[]) {
		const request = dates.map((date) => {
			return this.http.get<BaseResponse<NextSlotOpenPercentageData>>(`${this.prioritySlots}/getprioritypercentage?date=${date}`).pipe(
				throttleTime(200),
				map((res) => res?.data),
				catchError((err) => of({})),
			);
		});

		return combineLatest(request) as Observable<NextSlotOpenPercentageData[]>;
	}

	get repeatType$(): Observable<any[]> {
		return combineLatest([this.selectedLang$$.pipe(startWith(''))]).pipe(
			switchMap(([lang]) => {
				return of(this.repeatTypes).pipe(
					map((downloadTypeItems) => {
						if (lang) {
							return downloadTypeItems.map((downloadType) => {
								return {
									...downloadType,
									name: Translate[downloadType.name][lang],
								};
							});
						}
						return downloadTypeItems;
					}),
				);
			}),
		);
	}

	public deletePrioritySlot$(slotID: number): Observable<boolean> {
		this.loaderSvc.activate();
		return this.http.delete<BaseResponse<boolean>>(`${this.prioritySlots}/${slotID}`).pipe(
			map((response) => response.data),
			tap(() => {
				this.refreshPrioritySlots$$.next();
				this.loaderSvc.deactivate();
			}),
			catchError((e) => {
				this.loaderSvc.deactivate();
				return throwError(e);
			}),
		);
	}

	public getPrioritySlotsByID(slotID: number): Observable<PrioritySlot | undefined> {
		this.loaderSvc.activate();
		this.loaderSvc.spinnerActivate();

		let queryParams = new HttpParams();
		queryParams = queryParams.append('id', slotID);
		return combineLatest([this.refreshPrioritySlots$$.pipe(startWith(''))]).pipe(
			switchMap(() =>
				this.http.get<BaseResponse<PrioritySlot>>(`${this.prioritySlots}/${slotID}`).pipe(
					map((response) => {
						if (Array.isArray(response.data)) {
							return response.data[0];
						}
						return response.data;
					}),
					map((data) => ({
						...data,
						startedAt: this.utcToLocalPipe.transform(data.startedAt, false, true),
						endedAt: this.utcToLocalPipe.transform(data.endedAt, false, true),
						slotStartTime: this.utcToLocalPipe.transform(data.slotStartTime, true),
						slotEndTime: this.utcToLocalPipe.transform(data.slotEndTime, true),
					})),
					tap(() => {
						this.loaderSvc.deactivate();
						this.loaderSvc.spinnerDeactivate();
					}),
					catchError((e) => {
						this.loaderSvc.deactivate();
						return throwError(e);
					}),
				),
			),
		);
	}

	public savePrioritySlot$(requestData: PrioritySlot) {
		this.loaderSvc.activate();
		const { id, ...restData } = requestData;
		const queryParams = new HttpParams();
		queryParams.append('id', 0);
		requestData.id = id;

		return this.http.post<BaseResponse<PrioritySlot>>(`${this.prioritySlots}`, restData, { params: queryParams }).pipe(
			map((response) => response.data),
			tap(() => {
				this.refreshPrioritySlots$$.next();
				this.loaderSvc.deactivate();
			}),
			catchError((e) => {
				this.loaderSvc.deactivate();
				return throwError(e);
			}),
		);
	}

	public updatePrioritySlot$(requestData: PrioritySlot) {
		this.loaderSvc.activate();
		const { id, ...restData } = requestData;
		const queryParams = new HttpParams();
		queryParams.append('id', String(id));
		return this.http.post<BaseResponse<PrioritySlot>>(`${this.prioritySlots}?id=${id}`, restData).pipe(
			map((response) => response.data),
			tap(() => {
				this.refreshPrioritySlots$$.next();
				this.loaderSvc.deactivate();
			}),
			catchError((e) => {
				this.loaderSvc.deactivate();
				return throwError(e);
			}),
		);
	}

	private fetchAllPrioritySlots(pageNo: number): Observable<BaseResponse<PrioritySlot[]>> {
		this.loaderSvc.activate();
		const params = new HttpParams().append('pageNo', pageNo);
		return this.http.get<BaseResponse<PrioritySlot[]>>(`${this.prioritySlots}`, { params }).pipe(
			map((response) => response),
			tap(() => this.loaderSvc.deactivate()),
			catchError((e) => {
				this.loaderSvc.deactivate();
				return throwError(e);
			}),
		);
	}

	public openAndClosePrioritySlot(requestData, isClose) {
		this.loaderSvc.activate();
		return this.http.post<BaseResponse<PrioritySlot>>(`${this.prioritySlots}/priorityopenclose`, requestData, { params: { isClose } }).pipe(
			tap(() => {
				this.loaderSvc.deactivate();
			}),
			catchError((e) => {
				this.loaderSvc.deactivate();
				return throwError(e);
			}),
		);
	}

	getOpenCloseSlotData(dates) {
		const currentDate = new Date();
		currentDate.setHours(0, 0, 0, 0);
		const request = dates
			.filter((date) => {
				const myDate = new Date(date);
				return myDate.getTime() >= currentDate.getTime();
			})
			.map((date) => {
				const splitDate = date.split('-');
				const finalDate = `${+splitDate[2]}-${+splitDate[1]}-${splitDate[0]}`;
				return this.http.get<any>(`${this.prioritySlots}/getpriorityopencloselist?date=${date}`).pipe(
					throttleTime(200),
					map((res) => ({ [finalDate]: res?.data })),
					catchError((err) => of({})),
				);
			});

		return combineLatest(request) as Observable<[]>;
	}

	public refresh(): void {
		this.refreshPrioritySlots$$.next();
	}
}
