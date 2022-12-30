import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppointmentsDoughnutChartComponent } from './appointments-doughnut-chart.component';

describe('AppointmentsChartComponent', () => {
  let component: AppointmentsDoughnutChartComponent;
  let fixture: ComponentFixture<AppointmentsDoughnutChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AppointmentsDoughnutChartComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppointmentsDoughnutChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
