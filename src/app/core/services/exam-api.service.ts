import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { combineLatest, map, Observable, of, startWith, Subject, switchMap, tap } from 'rxjs';
import { BaseResponse } from 'src/app/shared/models/base-response.model';
import { environment } from 'src/environments/environment';
import { CreateExamRequestData, Exam } from '../../shared/models/exam.model';
import { ChangeStatusRequestData, Status } from '../../shared/models/status.model';
import { AvailabilityType } from '../../shared/models/user.model';
import { LoaderService } from './loader.service';

@Injectable({
  providedIn: 'root',
})
export class ExamApiService {
  private refreshExams$$ = new Subject<void>();

  private examUrl = `${environment.serverBaseUrl}/exam`;

  constructor(private http: HttpClient, private loaderSvc: LoaderService) {}

  public get exams$(): Observable<Exam[]> {
    return combineLatest([this.refreshExams$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchExams()));
  }

  private fetchExams(): Observable<Exam[]> {
    this.loaderSvc.spinnerActivate();
    this.loaderSvc.activate();
    return this.http.get<BaseResponse<Exam[]>>(this.examUrl).pipe(
      map((response) => response.data),
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
        this.refreshExams$$.next();
        this.loaderSvc.deactivate();
      }),
    );
  }

  public deleteExam(examID: number) {
    this.loaderSvc.activate();
    return this.http.delete<BaseResponse<Boolean>>(`${this.examUrl}/${examID}`).pipe(
      map((response) => response.data),
      tap(() => {
        this.refreshExams$$.next();
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
        this.refreshExams$$.next();
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
        this.refreshExams$$.next();
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
        this.refreshExams$$.next();
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

    return this.http.get<BaseResponse<Exam[]>>(`${environment.serverBaseUrl}/common/getexams`).pipe(
      map((response) => response.data),
      tap(() => {
        this.loaderSvc.deactivate();
        this.loaderSvc.spinnerDeactivate();
      }),
    );
  }
}
