import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppointmentsBarChartComponent } from './appointments-bar-chart.component';

describe('AppointmentsBarChartComponent', () => {
  let component: AppointmentsBarChartComponent;
  let fixture: ComponentFixture<AppointmentsBarChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AppointmentsBarChartComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppointmentsBarChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
