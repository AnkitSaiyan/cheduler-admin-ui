import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, takeUntil } from 'rxjs';
import { AbsenceApiService } from 'src/app/core/services/absence-api.service';
import { DestroyableComponent } from 'src/app/shared/components/destroyable.component';

@Component({
  selector: 'dfm-employee-absences',
  templateUrl: './employee-absences.component.html',
  styleUrls: ['./employee-absences.component.scss'],
})
export class EmployeeAbsencesComponent extends DestroyableComponent implements OnInit, OnDestroy {

  
  private absences$$: BehaviorSubject<any[]>;

  public filteredAppointments$$: BehaviorSubject<any[]>;
  // public employeeAbsences = [
  //   {
  //     name: 'Templeton Pack',
  //     post: 'Radiologist',
  //     fromDate: (new Date).setDate((new Date().getDate() - 2)),
  //     toDate: (new Date).setDate((new Date().getDate() - 1)),
  //     avatar: '',
  //   },
  //   {
  //     name: 'Kate Tanner',
  //     post: 'Cardiologist',
  //     fromDate: (new Date).setDate((new Date().getDate() - 2)),
  //     toDate: (new Date).setDate((new Date().getDate() - 1)),
  //     avatar: '',
  //   },
  //   {
  //     name: 'Dori Doreau',
  //     post: 'Physician',
  //     fromDate: (new Date).setDate((new Date().getDate() - 2)),
  //     toDate: (new Date).setDate((new Date().getDate() - 1)),
  //     avatar: '',
  //   },
  //   {
  //     name: 'Dr. Bonnie Barstow',
  //     post: 'Surgeon',
  //     fromDate: (new Date).setDate((new Date().getDate() - 2)),
  //     toDate: (new Date).setDate((new Date().getDate() - 1)),
  //     avatar: '',
  //   },
  //   {
  //     name: 'Templeton Pack',
  //     post: 'Cardiologist',
  //     fromDate: (new Date).setDate((new Date().getDate() - 2)),
  //     toDate: (new Date).setDate((new Date().getDate() - 1)),
  //     avatar: '',
  //   },
  //   {
  //     name: 'Templeton Pack',
  //     post: 'Cardiologist',
  //     fromDate: (new Date).setDate((new Date().getDate() - 2)),
  //     toDate: (new Date).setDate((new Date().getDate() - 1)),
  //     avatar: '',
  //   },
  //   {
  //     name: 'Templeton Pack',
  //     post: 'Cardiologist',
  //     fromDate: (new Date).setDate((new Date().getDate() - 2)),
  //     toDate: (new Date).setDate((new Date().getDate() - 1)),
  //     avatar: '',
  //   },
  //   {
  //     name: 'Templeton Pack',
  //     post: 'Cardiologist',
  //     fromDate: (new Date).setDate((new Date().getDate() - 2)),
  //     toDate: (new Date).setDate((new Date().getDate() - 1)),
  //     avatar: '',
  //   },
  //   {
  //     name: 'Templeton Pack',
  //     post: 'Cardiologist',
  //     fromDate: (new Date).setDate((new Date().getDate() - 2)),
  //     toDate: (new Date).setDate((new Date().getDate() - 1)),
  //     avatar: '',
  //   },
  // ];

  constructor(private absenceApiService: AbsenceApiService) {
    super();
    this.absences$$ = new BehaviorSubject<any[]>([]);
    this.filteredAppointments$$ = new BehaviorSubject<any[]>([]);
  }

  async ngOnInit(): Promise<void> {
    this.absenceApiService.absences$.pipe(takeUntil(this.destroy$$)).subscribe((employeeAbsences) => {
      console.log('employeeAbsences: ', employeeAbsences);
      this.absences$$.next(employeeAbsences);
      this.filteredAppointments$$.next(employeeAbsences);
    });
  }

  
  public override ngOnDestroy() {
    super.ngOnDestroy();
  }
}
