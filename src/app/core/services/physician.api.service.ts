import { Injectable } from '@angular/core';
import { combineLatest, Observable, of, startWith, Subject, switchMap } from 'rxjs';
import { Status } from '../../shared/models/status';
import { AddPhysicianRequestData, Physician } from '../../shared/models/physician.model';

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

  constructor() {}

  public get physicians$(): Observable<Physician[]> {
    return combineLatest([this.refreshPhysicians$$.pipe(startWith(''))]).pipe(switchMap(() => of(this.physicians)));
  }

  public getPhysicianByID(physicianID: number): Observable<Physician | undefined> {
    return combineLatest([this.refreshPhysicians$$.pipe(startWith(''))]).pipe(
      switchMap(() => of(this.physicians.find((physician) => +physician.id === +physicianID))),
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

  public upsertPhysician$(requestData: AddPhysicianRequestData): Observable<string> {
    if (!requestData) {
      return of('');
    }

    if (requestData?.id) {
      const index = this.physicians.findIndex((physician) => physician.id === requestData.id);
      if (index !== -1) {
        this.physicians[index] = {
          ...this.physicians[index],
          id: requestData.id,
          firstname: requestData.firstname,
          lastname: requestData.lastname,
          email: requestData.email,
          rizivNumber: requestData.rizivNumber,
          gsm: requestData?.gsm,
          telephone: requestData.telephone,
          address: requestData.address,
          notifyDoctor: requestData.notifyDoctor,
          status: this.physicians[index].status,
        };
      }
    } else {
      this.physicians.push({
        id: Math.random(),
        firstname: requestData.firstname,
        lastname: requestData.lastname,
        email: requestData.email,
        rizivNumber: requestData.rizivNumber,
        gsm: requestData?.gsm,
        telephone: requestData.telephone,
        address: requestData.address,
        notifyDoctor: requestData.notifyDoctor,
        status: Status.Active,
      });
    }

    this.refreshPhysicians$$.next();

    return of('created');
  }

  public deletePhysician(physicianID: number) {
    const index = this.physicians.findIndex((physician) => physician.id === +physicianID);
    if (index !== -1) {
      this.physicians.splice(index, 1);
      this.refreshPhysicians$$.next();
    }
  }
}
