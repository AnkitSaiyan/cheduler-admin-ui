import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { StaffApiService } from '../../../../core/services/staff-api.service';
import { User } from '../../../../shared/models/user.model';

@Component({
  selector: 'dfm-staff-view',
  templateUrl: './staff-view.component.html',
  styleUrls: ['./staff-view.component.scss'],
})
export class StaffViewComponent implements OnInit {
  public staffDetails$!: Observable<User>;

  constructor(private staffApiSvc: StaffApiService, router: Router) {}

  ngOnInit(): void {}
}
