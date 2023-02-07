import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { combineLatest, map, Observable, of, startWith, Subject, switchMap, tap } from 'rxjs';
import { BaseResponse } from 'src/app/shared/models/base-response.model';
import { environment } from 'src/environments/environment';
import { CreateExamRequestData, Exam } from '../../shared/models/exam.model';
import { Status } from '../../shared/models/status';
import { AvailabilityType } from '../../shared/models/user.model';

@Injectable({
  providedIn: 'root',
})
export class ExamApiService {
  private exams: Exam[] = [
    {
      id: 1,
      name: 'test',
      expensive: 10,
      info: 'test',
      assistantCount: 1,
      radiologistCount: 1,
      nursingCount: 1,
      secretaryCount: 1,
      availabilityType: AvailabilityType.Available,
      status: Status.Active,
      usersList: [],
      roomsForExam: [],
      uncombinables: [],
      practiceAvailability: [],
    },
    {
      id: 2,
      name: 'Exam 1',
      expensive: 10,
      info: 'test',
      assistantCount: 2,
      radiologistCount: 2,
      nursingCount: 1,
      secretaryCount: 1,
      availabilityType: AvailabilityType.Available,
      status: Status.Inactive,
      usersList: [],
      roomsForExam: [],
      uncombinables: [],
      practiceAvailability: [],
    },
    {
      id: 3,
      name: 'Exam 2',
      expensive: 10,
      info: 'test',
      assistantCount: 2,
      radiologistCount: 2,
      nursingCount: 1,
      secretaryCount: 1,
      availabilityType: AvailabilityType.Unavailable,
      status: Status.Inactive,
      usersList: [],
      roomsForExam: [],
      uncombinables: [],
      practiceAvailability: [],
    },
    {
      id: 4,
      name: 'Exam 3',
      expensive: 10,
      info: 'test',
      assistantCount: 2,
      radiologistCount: 2,
      nursingCount: 1,
      secretaryCount: 1,
      availabilityType: AvailabilityType.Unavailable,
      status: Status.Active,
      usersList: [],
      roomsForExam: [],
      uncombinables: [],
      practiceAvailability: [],
    },
    {
      id: 5,
      name: 'Exam 4',
      expensive: 10,
      info: 'test',
      assistantCount: 2,
      radiologistCount: 2,
      nursingCount: 1,
      secretaryCount: 1,
      availabilityType: AvailabilityType.Unavailable,
      status: Status.Active,
      usersList: [],
      roomsForExam: [],
      uncombinables: [],
      practiceAvailability: [],
    },
    {
      id: 6,
      name: 'Exam 5',
      expensive: 10,
      info: 'test',
      assistantCount: 2,
      radiologistCount: 2,
      nursingCount: 1,
      secretaryCount: 1,
      availabilityType: AvailabilityType.Available,
      status: Status.Active,
      usersList: [],
      roomsForExam: [],
      uncombinables: [],
      practiceAvailability: [],
    },
    {
      id: 7,
      name: 'sugar',
      expensive: 10,
      info: 'test',
      assistantCount: 2,
      radiologistCount: 2,
      nursingCount: 1,
      secretaryCount: 1,
      availabilityType: AvailabilityType.Unavailable,
      status: Status.Inactive,
      usersList: [],
      roomsForExam: [],
      uncombinables: [],
      practiceAvailability: [],
    },
    {
      id: 8,
      name: 'esr',
      expensive: 10,
      info: 'test',
      assistantCount: 2,
      radiologistCount: 2,
      nursingCount: 1,
      secretaryCount: 1,
      availabilityType: AvailabilityType.Available,
      status: Status.Inactive,
      usersList: [],
      roomsForExam: [],
      uncombinables: [],
      practiceAvailability: [],
    },
  ];

  private refreshExams$$ = new Subject<void>();

  constructor(private http: HttpClient) {}

  public get exams$(): Observable<Exam[]> {
    return combineLatest([this.refreshExams$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchAllExams()));
  }

  private fetchAllExams(): Observable<Exam[]> {
    return this.http.get<BaseResponse<Exam[]>>(`${environment.serverBaseUrl}/exam?pageNo=1`).pipe(map((response) => response.data));
  }

  public changeExamStatus$(changes: { id: number | string; newStatus: Status | null }[]): Observable<boolean> {
    if (!changes.length) {
      return of(false);
    }

    let changed = false;
    changes.forEach((change) => {
      const index = this.exams.findIndex((exam) => exam.id === +change.id);
      if (index !== -1 && change.newStatus !== null) {
        this.exams[index] = {
          ...this.exams[index],
          status: change.newStatus,
        };

        if (!changed) {
          changed = true;
        }
      }
    });

    this.refreshExams$$.next();

    return of(true);
  }

  public deleteExam(examID: number) {
    console.log('examID: ', examID);
    // const index = this.exams.findIndex((exam) => exam.id === +examID);
    // if (index !== -1) {
    //   this.exams.splice(index, 1);
    //   this.refreshExams$$.next();
    // }

    return this.http.delete<BaseResponse<Boolean>>(`${environment.serverBaseUrl}/exam/${examID}`).pipe(
      map((response) => response.data),
      tap(() => {
        this.refreshExams$$.next();
      }),
    );
  }

  public getExamByID(examID: number): Observable<Exam | undefined> {
    console.log("examId", examID)
    // return combineLatest([this.refreshExams$$.pipe(startWith(''))]).pipe(switchMap(() => of(this.exams.find((exam) => +exam.id === +examID))));
    let queryParams = new HttpParams();
    queryParams = queryParams.append("id", examID);
    return this.http.get<BaseResponse<Exam>>(`${environment.serverBaseUrl}/exam`, {params: queryParams}).pipe(
      map(response => response.data)
    )
  }

  // public createExam$(requestData: CreateExamRequestData): Observable<string> {
  //   if (requestData.id) {
  //     const index = this.exams.findIndex((exam) => exam.id === requestData.id);
  //     if (index !== -1) {
  //       this.exams[index] = {
  //         ...this.exams[index],
  //         ...requestData,
  //         practiceAvailability: requestData.practiceAvailability?.length ? requestData.practiceAvailability : this.exams[index].practiceAvailability,
  //       };
  //     }
  //   } else {
  //     this.exams.push({
  //       ...requestData,
  //       id: Math.random(),
  //       availabilityType: AvailabilityType.Available,
  //       status: Status.Active,
  //       info: requestData.info ?? '',
  //     });
  //   }

  //   return of('Created');
  // }

  public createExam$(requestData: CreateExamRequestData): Observable<CreateExamRequestData> {
    return this.http
      .post<BaseResponse<CreateExamRequestData>>(`${environment.serverBaseUrl}/exam`, requestData)
      .pipe(map((response) => response.data));
  }

  public updateExam$(requestData: CreateExamRequestData): Observable<CreateExamRequestData> {
    const { id, ...restData } = requestData;
    return this.http
      .put<BaseResponse<CreateExamRequestData>>(`${environment.serverBaseUrl}/exam/${id}`, restData)
      .pipe(map((response) => response.data),
        tap(()=>{this.refreshExams$$.next()})
      )
  }
}
