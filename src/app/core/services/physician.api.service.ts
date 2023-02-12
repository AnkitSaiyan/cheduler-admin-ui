import { Injectable } from '@angular/core';
import { catchError, combineLatest, map, Observable, of, startWith, Subject, switchMap, tap } from 'rxjs';
import { Status } from '../../shared/models/status';
import { AddPhysicianRequestData, Physician } from '../../shared/models/physician.model';
import { HttpClient } from '@angular/common/http';
import { BaseResponse } from 'src/app/shared/models/base-response.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PhysicianApiService {
  private physicians: Physician[] = [
    {
      id: 1,
      firstname: 'Maaike',
      lastname: 'Benooit',
      email: 'maaike@dfm.com',
      address: 'Belgium',
      rizivNumber: '89SK98',
      telephone: 9878786757,
      gsm: 'GSM879',
      notifyDoctor: true,
      count: 0,
      status: Status.Active,
    },
    {
      id: 2,
      firstname: 'Maaike',
      lastname: 'Benooit',
      email: 'maaike@dfm.com',
      address: 'Belgium',
      rizivNumber: '89SK98',
      telephone: 9878786757,
      gsm: 'GSM879',
      notifyDoctor: true,
      count: 0,
      status: Status.Active,
    },
    {
      id: 3,
      firstname: 'Maaike',
      lastname: 'Benooit',
      email: 'maaike@dfm.com',
      address: 'Belgium',
      rizivNumber: '89SK98',
      telephone: 9878786757,
      gsm: 'GSM879',
      notifyDoctor: true,
      count: 0,
      status: Status.Active,
    },
    {
      id: 4,
      firstname: 'Maaike',
      lastname: 'Benooit',
      email: 'maaike@dfm.com',
      address: 'Belgium',
      rizivNumber: '89SK98',
      telephone: 9878786757,
      gsm: 'GSM879',
      notifyDoctor: true,
      count: 0,
      status: Status.Inactive,
    },
    {
      id: 5,
      firstname: 'Maaike',
      lastname: 'Benooit',
      email: 'maaike@dfm.com',
      address: 'Belgium',
      rizivNumber: '89SK98',
      telephone: 9878786757,
      gsm: 'GSM879',
      notifyDoctor: true,
      count: 0,
      status: Status.Active,
    },
    {
      id: 6,
      firstname: 'Maaike',
      lastname: 'Benooit',
      email: 'maaike@dfm.com',
      address: 'Belgium',
      rizivNumber: '89SK98',
      telephone: 9878786757,
      gsm: 'GSM879',
      notifyDoctor: true,
      count: 0,
      status: Status.Inactive,
    },
    {
      id: 7,
      firstname: 'Maaike',
      lastname: 'Benooit',
      email: 'maaike@dfm.com',
      address: 'Belgium',
      rizivNumber: '89SK98',
      telephone: 9878786757,
      gsm: 'GSM879',
      notifyDoctor: true,
      count: 0,
      status: Status.Active,
    },
    {
      id: 8,
      firstname: 'Maaike',
      lastname: 'Benooit',
      email: 'maaike@dfm.com',
      address: 'Belgium',
      rizivNumber: '89SK98',
      telephone: 9878786757,
      gsm: 'GSM879',
      notifyDoctor: true,
      count: 0,
      status: Status.Inactive,
    },
    {
      id: 9,
      firstname: 'Maaike',
      lastname: 'Benooit',
      email: 'maaike@dfm.com',
      address: 'Belgium',
      rizivNumber: '89SK98',
      telephone: 9878786757,
      gsm: 'GSM879',
      notifyDoctor: true,
      count: 0,
      status: Status.Active,
    },
    {
      id: 10,
      firstname: 'Maaike',
      lastname: 'Benooit',
      email: 'maaike@dfm.com',
      address: 'Belgium',
      rizivNumber: '89SK98',
      telephone: 9878786757,
      gsm: 'GSM879',
      notifyDoctor: true,
      count: 0,
      status: Status.Active,
    },
  ];

  private refreshPhysicians$$ = new Subject<void>();

  constructor(private http: HttpClient) {}

  public get physicians$(): Observable<Physician[]> {
    return combineLatest([this.refreshPhysicians$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchAllPhysicians()));
  }

  private fetchAllPhysicians(): Observable<any[]> {
    return this.http.get<BaseResponse<any[]>>(`${environment.serverBaseUrl}/doctor`).pipe(map((response) => response.data));
  }

  public getPhysicianByID(physicianID: number): Observable<Physician | undefined> {
      return combineLatest([this.refreshPhysicians$$.pipe(startWith(''))]).pipe(
        switchMap(() =>
          this.http.get<BaseResponse<Physician>>(`${environment.serverBaseUrl}/doctor/${physicianID}`).pipe(
            map((response) => response.data),
            catchError((e) => {
              console.log('error', e);
              return of({} as Physician);
            }),
          ),
        ),
      );
  }

  public changePhysicianStatus$(changes: { id: number | string; newStatus: Status | null }[]): Observable<boolean> {
    if (!changes.length) {
      return of(false);
    }

    let changed = false;
    changes.forEach((change) => {
      const index = this.physicians.findIndex((physician) => physician.id === +change.id);
      if (index !== -1 && change.newStatus !== null) {
        this.physicians[index] = {
          ...this.physicians[index],
          status: change.newStatus,
        };

        if (!changed) {
          changed = true;
        }
      }
    });

    this.refreshPhysicians$$.next();

    return of(true);
  }

  // public upsertPhysician$(requestData: AddPhysicianRequestData): Observable<string> {
  //   if (!requestData) {
  //     return of('');
  //   }

  //   if (requestData?.id) {
  //     const index = this.physicians.findIndex((physician) => physician.id === requestData.id);
  //     if (index !== -1) {
  //       this.physicians[index] = {
  //         ...this.physicians[index],
  //         id: requestData.id,
  //         firstname: requestData.firstname,
  //         lastname: requestData.lastname,
  //         email: requestData.email,
  //         rizivNumber: requestData.rizivNumber,
  //         gsm: requestData?.gsm,
  //         telephone: requestData.telephone,
  //         address: requestData.address,
  //         notifyDoctor: requestData.notifyDoctor,
  //         status: Status.Active,
  //       };
  //     }
  //   } else {
  //     this.physicians.push({
  //       id: Math.random(),
  //       firstname: requestData.firstname,
  //       lastname: requestData.lastname,
  //       email: requestData.email,
  //       rizivNumber: requestData.rizivNumber,
  //       gsm: requestData?.gsm,
  //       telephone: requestData.telephone,
  //       address: requestData.address,
  //       notifyDoctor: requestData.notifyDoctor,
  //       status: Status.Active,
  //     });
  //   }

  //   this.refreshPhysicians$$.next();

  //   return of('created');
  // }

  public addPhysician$(requestData: AddPhysicianRequestData): Observable<AddPhysicianRequestData>{
    return this.http.post<BaseResponse<Physician>>(`${environment.serverBaseUrl}/doctor`, requestData).pipe(
      map(response => response.data),
      tap(()=>{this.refreshPhysicians$$.next()})
    )
  }

  public updatePhysician$(requestData: AddPhysicianRequestData): Observable<AddPhysicianRequestData>{
    const {id, ...restData} = requestData;
    return this.http.put<BaseResponse<Physician>>(`${environment.serverBaseUrl}/doctor/${id}`, restData).pipe(
      map(response => response.data),
      tap(()=>{this.refreshPhysicians$$.next()})
    )
  }

  public deletePhysician(physicianID: number) {
    // const index = this.physicians.findIndex((physician) => physician.id === +physicianID);
    // if (index !== -1) {
    //   this.physicians.splice(index, 1);
    //   this.refreshPhysicians$$.next();
    // }

    return this.http.delete<BaseResponse<Boolean>>(`${environment.serverBaseUrl}/doctor/${physicianID}`).pipe(
      map(response => response.data),
      tap(()=>{this.refreshPhysicians$$.next()})
    )
  }
}
