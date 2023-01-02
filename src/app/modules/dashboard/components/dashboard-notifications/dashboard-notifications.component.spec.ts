import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardNotificationsComponent } from './dashboard-notifications.component';

describe('NotificationsComponent', () => {
  let component: DashboardNotificationsComponent;
  let fixture: ComponentFixture<DashboardNotificationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DashboardNotificationsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardNotificationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
