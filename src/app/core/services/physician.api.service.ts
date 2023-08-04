import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, combineLatest, map, Observable, of, startWith, Subject, switchMap, tap } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BaseResponse } from 'src/app/shared/models/base-response.model';
import { environment } from 'src/environments/environment';
import { AddPhysicianRequestData, Physician } from '../../shared/models/physician.model';
import { ChangeStatusRequestData } from '../../shared/models/status.model';
import { LoaderService } from './loader.service';

@Injectable({
	providedIn: 'root',
})
export class PhysicianApiService {
	private readonly doctorUrl = `${environment.schedulerApiUrl}/doctor`;

	private refreshPhysicians$$ = new Subject<void>();

	private pageNo$$ = new BehaviorSubject<number>(1);

	constructor(private http: HttpClient, private loaderSvc: LoaderService) {}

	public set pageNo(pageNo: number) {
		this.pageNo$$.next(pageNo);
	}

	public get pageNo(): number {
		return this.pageNo$$.value;
	}

	public get physicians$(): Observable<BaseResponse<Physician[]>> {
		return combineLatest([this.refreshPhysicians$$.pipe(startWith('')), this.pageNo$$]).pipe(
			switchMap(([_, pageNo]) => this.fetchAllPhysicians(pageNo)),
		);
	}

	private fetchAllPhysicians(pageNo: number): Observable<BaseResponse<Physician[]>> {
		this.loaderSvc.spinnerActivate();
		this.loaderSvc.activate();

		const params = new HttpParams().append('pageNo', pageNo);
		return this.http.get<BaseResponse<Physician[]>>(`${environment.schedulerApiUrl}/doctor`, { params }).pipe(
			map((response) => {
				return {
					...response,
					data: response.data?.map((p) => ({ ...p, fullName: `${p.firstname} ${p.lastname}` })).sort((p1, p2) => p2.id - p1.id),
				};
			}),
			tap(() => {
				this.loaderSvc.deactivate();
				this.loaderSvc.spinnerDeactivate();
			}),
		);
	}

	public getPhysicianByID(physicianID: number): Observable<Physician | undefined> {
		this.loaderSvc.activate();
		return combineLatest([this.refreshPhysicians$$.pipe(startWith(''))]).pipe(
			switchMap(() =>
				this.http.get<BaseResponse<Physician>>(`${environment.schedulerApiUrl}/doctor/${physicianID}`).pipe(
					map((response) => response.data),
					tap(() => this.loaderSvc.deactivate()),
					catchError((e) => {
						return of({} as Physician);
					}),
				),
			),
		);
	}

	public changePhysicianStatus$(requestData: ChangeStatusRequestData[]): Observable<null> {
		this.loaderSvc.activate();
		return this.http.put<BaseResponse<any>>(`${this.doctorUrl}/updatedoctorstatus`, requestData).pipe(
			map((resp) => resp?.data),
			tap(() => {
				this.pageNo$$.next(1);
				this.loaderSvc.deactivate();
			}),
		);
	}

	public addPhysician$(requestData: AddPhysicianRequestData): Observable<Physician> {
		this.loaderSvc.activate();
		return this.http.post<BaseResponse<Physician>>(`${environment.schedulerApiUrl}/doctor`, requestData).pipe(
			map((response) => response.data),
			tap(() => {
				this.pageNo$$.next(1);
				this.loaderSvc.deactivate();
			}),
		);
	}

	public updatePhysician$(requestData: AddPhysicianRequestData): Observable<Physician> {
		this.loaderSvc.activate();
		const { id, ...restData } = requestData;
		return this.http.put<BaseResponse<Physician>>(`${environment.schedulerApiUrl}/doctor/${id}`, restData).pipe(
			map((response) => response.data),
			tap(() => {
				this.pageNo$$.next(1);
				this.loaderSvc.deactivate();
			}),
		);
	}

	public deletePhysician(physicianID: number) {
		this.loaderSvc.activate();
		return this.http.delete<BaseResponse<Boolean>>(`${environment.schedulerApiUrl}/doctor/${physicianID}`).pipe(
			map((response) => response.data),
			tap(() => {
				// this.refreshPhysicians$$.next();
				this.loaderSvc.deactivate();
			}),
		);
	}

	public get allPhysicians$(): Observable<Physician[]> {
		return combineLatest([this.refreshPhysicians$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchAllExams$()));
	}

	private fetchAllExams$(): Observable<Physician[]> {
		this.loaderSvc.activate();
		this.loaderSvc.spinnerActivate();

		return this.http.get<BaseResponse<Physician[]>>(`${environment.schedulerApiUrl}/common/getdoctors`).pipe(
			map((response) => response.data?.map((p) => ({ ...p, fullName: `${p.firstname} ${p.lastname}` })).sort((p1, p2) => p2.id - p1.id)),
			tap(() => {
				this.loaderSvc.deactivate();
				this.loaderSvc.spinnerDeactivate();
			}),
		);
	}
}
