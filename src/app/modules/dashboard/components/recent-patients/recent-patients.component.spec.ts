import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecentPatientsComponent } from './recent-patients.component';

describe('RecentPatientsComponent', () => {
  let component: RecentPatientsComponent;
  let fixture: ComponentFixture<RecentPatientsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RecentPatientsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecentPatientsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
