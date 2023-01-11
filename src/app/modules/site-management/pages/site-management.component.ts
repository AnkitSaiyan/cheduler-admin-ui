import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { DestroyableComponent } from '../../../shared/components/destroyable.component';
import { User } from '../../../shared/models/user.model';
import { WeekdayModel } from '../../../shared/models/weekday.model';

@Component({
  selector: 'dfm-site-management',
  templateUrl: './site-management.component.html',
  styleUrls: ['./site-management.component.scss'],
})
export class SiteManagementComponent extends DestroyableComponent implements OnInit, OnDestroy {
  public addStaffForm!: FormGroup;

  public exams$$ = new BehaviorSubject<any[]>([]);

  public generalUserTypes$$ = new BehaviorSubject<any[]>([]);

  public staffDetails$$ = new BehaviorSubject<User | undefined>(undefined);

  public loading$$ = new BehaviorSubject(false);

  public weekday = WeekdayModel;

  public comingFromRoute = '';

  public staffID!: number;

  public edit = false;

  constructor() {
    super();
  }

  public ngOnInit(): void {}

  public override ngOnDestroy() {
    super.ngOnDestroy();
  }
}
