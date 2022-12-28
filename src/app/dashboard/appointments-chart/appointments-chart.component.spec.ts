import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppointmentsChartComponent } from './appointments-chart.component';

describe('AppointmentsChartComponent', () => {
  let component: AppointmentsChartComponent;
  let fixture: ComponentFixture<AppointmentsChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AppointmentsChartComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppointmentsChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
