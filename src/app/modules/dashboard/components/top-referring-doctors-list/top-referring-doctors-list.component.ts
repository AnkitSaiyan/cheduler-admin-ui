import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, takeUntil } from 'rxjs';
import { DashboardApiService } from 'src/app/core/services/dashboard-api.service';
import { DestroyableComponent } from 'src/app/shared/components/destroyable.component';

@Component({
  selector: 'dfm-top-referring-doctors-list',
  templateUrl: './top-referring-doctors-list.component.html',
  styleUrls: ['./top-referring-doctors-list.component.scss'],
})
export class TopReferringDoctorsListComponent extends DestroyableComponent implements OnInit, OnDestroy{

  private topTenDoctors$$: BehaviorSubject<any[]>;

  public filteredTopTenDoctors$$: BehaviorSubject<any[]>;

  constructor(private dashboardApiService: DashboardApiService){
    super();
    this.topTenDoctors$$ = new BehaviorSubject<any[]>([]);
    this.filteredTopTenDoctors$$ = new BehaviorSubject<any[]>([]);
  }
  public ngOnInit(): void {
    this.dashboardApiService.doctors$.pipe(takeUntil(this.destroy$$)).subscribe((doctor) => {
      this.topTenDoctors$$.next(doctor['doctors']);
      this.filteredTopTenDoctors$$.next(doctor['doctors']);
    });
  }
}
