import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, map, Observable, startWith, Subject, switchMap, tap, timer } from 'rxjs';
import { BaseResponse } from 'src/app/shared/models/base-response.model';
import { environment } from 'src/environments/environment';
import { AsyncValidatorFn, AbstractControl } from '@angular/forms';
import { CreateExamRequestData, Exam } from '../../shared/models/exam.model';
import { ChangeStatusRequestData } from '../../shared/models/status.model';
import { LoaderService } from './loader.service';

@Injectable({
	providedIn: 'root',
})
export class ExamApiService {
	private refreshExams$$ = new Subject<void>();

	private pageNo$$ = new BehaviorSubject<number>(1);

	private examUrl = `${environment.schedulerApiUrl}/exam`;

	constructor(private http: HttpClient, private loaderSvc: LoaderService) {}

	public set pageNo(pageNo: number) {
		this.pageNo$$.next(pageNo);
	}

	public get pageNo(): number {
		return this.pageNo$$.value;
	}

	public get exams$(): Observable<BaseResponse<Exam[]>> {
		return combineLatest([this.pageNo$$, this.refreshExams$$.pipe(startWith(''))]).pipe(switchMap(([pageNo]) => this.fetchExams(pageNo)));
	}

	private fetchExams(pageNo: number): Observable<BaseResponse<Exam[]>> {
		this.loaderSvc.spinnerActivate();
		this.loaderSvc.activate();

		const params = new HttpParams().append('pageNo', pageNo);
		return this.http.get<BaseResponse<Exam[]>>(this.examUrl, { params }).pipe(
			tap(() => {
				this.loaderSvc.deactivate();
				this.loaderSvc.spinnerDeactivate();
			}),
		);
	}

	public changeExamStatus$(requestData: ChangeStatusRequestData[]): Observable<boolean> {
		this.loaderSvc.activate();
		return this.http.put<BaseResponse<any>>(`${this.examUrl}/updateexamstatus`, requestData).pipe(
			map((resp) => resp?.data),
			tap(() => {
				this.pageNo$$.next(1);
				this.loaderSvc.deactivate();
			}),
		);
	}

	public deleteExam(examID: number) {
		this.loaderSvc.activate();
		return this.http.delete<BaseResponse<boolean>>(`${this.examUrl}/${examID}`).pipe(
			map((response) => response.data),
			tap(() => {
				this.loaderSvc.deactivate();
			}),
		);
	}

	public getExamByID(examID: number): Observable<Exam | undefined> {
		this.loaderSvc.activate();
		this.loaderSvc.spinnerActivate();
		return this.http.get<BaseResponse<Exam>>(`${this.examUrl}/${examID}`).pipe(
			map((response) => response.data),
			tap(() => {
				this.loaderSvc.deactivate();
				this.loaderSvc.spinnerDeactivate();
			}),
		);
	}

	public createExam$(requestData: CreateExamRequestData): Observable<Exam> {
		this.loaderSvc.activate();
		return this.http.post<BaseResponse<Exam>>(`${this.examUrl}`, requestData).pipe(
			map((response) => response?.data),
			tap(() => {
				this.pageNo$$.next(1);
				this.loaderSvc.deactivate();
			}),
		);
	}

	public updateExam$(requestData: CreateExamRequestData): Observable<Exam> {
		this.loaderSvc.activate();
		const { id, ...restData } = requestData;
		return this.http.put<BaseResponse<Exam>>(`${this.examUrl}/${id}`, restData).pipe(
			map((response) => response.data),
			tap(() => {
				this.pageNo$$.next(1);
				this.loaderSvc.deactivate();
			}),
		);
	}

	public get allExams$(): Observable<Exam[]> {
		return combineLatest([this.refreshExams$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchAllExams$()));
	}

	private fetchAllExams$(): Observable<Exam[]> {
		this.loaderSvc.activate();
		this.loaderSvc.spinnerActivate();

		return this.http.get<BaseResponse<Exam[]>>(`${environment.schedulerApiUrl}/common/getexams`).pipe(
			map((response) => response.data),
			tap(() => {
				this.loaderSvc.deactivate();
				this.loaderSvc.spinnerDeactivate();
			}),
		);
	}

	private searchExam(value: string, id: number) {
		return timer(1000).pipe(
			switchMap(() => {
				let queryParams = new HttpParams();
				queryParams = queryParams.append('examName', value);
				queryParams = queryParams.append('examId', id);
				return this.http.get<any>(`${this.examUrl}/isexamexist`, { params: queryParams });
			}),
		);
	}

	public examValidator(id): AsyncValidatorFn {
		return (control: AbstractControl): Observable<any> => {
			return this.searchExam(control.value, id).pipe(
				map((res) => {
					if (res.data === '') {
						return { userNameExists: true };
					}
					return null;
				}),
			);
		};
	}
}
