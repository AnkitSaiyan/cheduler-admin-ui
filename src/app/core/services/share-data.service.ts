import { Injectable } from '@angular/core';
import { combineLatest, BehaviorSubject, map, Observable, of, startWith, Subject, switchMap, tap } from 'rxjs';
import { BaseResponse } from 'src/app/shared/models/base-response.model';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { DUTCH_BE, Gender } from 'src/app/shared/utils/const';
import { Translate } from 'src/app/shared/models/translate.model';

@Injectable({
	providedIn: 'root',
})
export class ShareDataService {
	private changeTimeModalData$$ = new BehaviorSubject<any>(null);

	private date$$ = new BehaviorSubject<any>(null);

	private language$$ = new BehaviorSubject<string>(DUTCH_BE);

	private refreshRooms$$ = new Subject<void>();

	private readonly patientsUrl = `${environment.schedulerApiUrl}/common/getpatients`;

	private gender: { name: string; value: string }[] = [
		{
			name: 'Male',
			value: Gender.Male,
		},
		{
			name: 'Female',
			value: Gender.Female,
		},
	];

	constructor(private http: HttpClient) {
		if (localStorage.getItem('lang')) {
			this.language$$.next(localStorage.getItem('lang') ?? '');
		}
	}

	public getChangeTimeModalData$(): Observable<any> {
		return this.changeTimeModalData$$.asObservable();
	}

	get genderType$(): Observable<any[]> {
		return combineLatest([this.language$$.pipe(startWith(''))]).pipe(
			switchMap(([lang]) => {
				return of(this.gender).pipe(
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

	public bodyPart$(gender?: Gender): Observable<any[]> {
		return this.http.get('assets/json/category.json').pipe(
			switchMap((value: any) => {
				switch (gender) {
					case Gender.Male:
						return of(
							[...value.skeletonParts, ...value.maleBodyParts.front, ...value.maleBodyParts.back].sort().map((value) => ({ name: value, value })),
						);
					case Gender.Female:
						return of(
							[...value.skeletonParts, ...value.femaleBodyParts.front, ...value.femaleBodyParts.back].sort().map((value) => ({ name: value, value })),
						);
					default:
						return of(
							[
								...value.skeletonParts,
								...value.femaleBodyParts.front,
								...value.femaleBodyParts.back,
								...value.maleBodyParts.front,
								...value.maleBodyParts.back,
							]
								.sort()
								.map((value) => ({ name: value, value })),
						);
				}
			}),
		);
	}

	public setChangeTimeModalData(data: any) {
		this.changeTimeModalData$$.next(data);
	}

	public getDate$(): Observable<Date> {
		return this.date$$.asObservable();
	}

	public setDate(date: Date) {
		this.date$$.next(date);
	}

	public setLanguage(languge: string) {
		localStorage.setItem('lang', languge);
		this.language$$.next(languge);
	}

	public getLanguage$(): Observable<string> {
		return this.language$$.asObservable();
	}

	public get patient$(): Observable<any> {
		return combineLatest([this.refreshRooms$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchPatients()));
	}

	private fetchPatients(): Observable<any> {
		return this.http.get<BaseResponse<any>>(`${this.patientsUrl}`).pipe(
			map((response) => {
				return response['data'];
			}),
		);
	}
}
