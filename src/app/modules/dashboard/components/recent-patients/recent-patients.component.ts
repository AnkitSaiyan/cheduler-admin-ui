import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, takeUntil } from 'rxjs';
import { DashboardApiService } from 'src/app/core/services/dashboard-api.service';
import { DestroyableComponent } from 'src/app/shared/components/destroyable.component';

@Component({
  selector: 'dfm-recent-patients',
  templateUrl: './recent-patients.component.html',
  styleUrls: ['./recent-patients.component.scss'],
})
export class RecentPatientsComponent extends DestroyableComponent implements OnInit, OnDestroy {
  public columns: string[] = ['Patient Name', 'Email ID', 'Doctor', 'Appointment Date', 'Actions'];

  // public recentPatients: any = [
  //   {
  //     patientName: 'Maaike',
  //     emailId: 'maaike@diflexmo.be',
  //     doctor: 'Hannibal Smith',
  //     appointmentDate: new Date(),
  //     avatar: '',
  //   },
  //   {
  //     patientName: 'Maaike',
  //     emailId: 'maaike@diflexmo.be',
  //     doctor: 'Bannie Smith',
  //     appointmentDate: new Date(),
  //     avatar: '',
  //   },
  //   {
  //     patientName: 'Maaike',
  //     emailId: 'maaike@diflexmo.be',
  //     doctor: 'Kate Smith',
  //     appointmentDate: new Date(),
  //     avatar: '',
  //   },
  //   {
  //     patientName: 'Maaike',
  //     emailId: 'maaike@diflexmo.be',
  //     doctor: 'Hannibal Smith',
  //     appointmentDate: new Date(),
  //     avatar: '',
  //   },
  //   {
  //     patientName: 'Maaike',
  //     emailId: 'maaike@diflexmo.be',
  //     doctor: 'Hannibal Smith',
  //     appointmentDate: new Date(),
  //     avatar: '',
  //   },
  //   {
  //     patientName: 'Maaike',
  //     emailId: 'maaike@diflexmo.be',
  //     doctor: 'Hannibal Smith',
  //     appointmentDate: new Date(),
  //     avatar: '',
  //   },
  //   {
  //     patientName: 'Maaike',
  //     emailId: 'maaike@diflexmo.be',
  //     doctor: 'Hannibal Smith',
  //     appointmentDate: new Date(),
  //     avatar: '',
  //   },
  // ];

  public downloadItems: any[] = [
    {
      name: 'Excel',
      value: 'xls',
      description: 'Download as Excel'
    },
    {
      name: 'PDF',
      value: 'pdf',
      description: 'Download as PDF'
    },
    {
      name: 'CSV',
      value: 'csv',
      description: 'Download as CSV'
    },
    {
      name: 'Print',
      value: 'print',
      description: 'Print appointments'
    }
  ];

  private recentPatients$$: BehaviorSubject<any[]>;

  public filteredRecentPatients$$: BehaviorSubject<any[]>;

  constructor(private dashboardApiService: DashboardApiService) {
    super();
    this.recentPatients$$ = new BehaviorSubject<any[]>([]);
    this.filteredRecentPatients$$ = new BehaviorSubject<any[]>([]);
  }
  public ngOnInit(): void {
            
    this.dashboardApiService.recentPatient$.pipe(takeUntil(this.destroy$$)).subscribe((recentPatient) => {
      console.log('101 rercent patients: ', recentPatient);
      this.recentPatients$$.next(recentPatient);
      this.filteredRecentPatients$$.next(recentPatient);
    });
  }
}
