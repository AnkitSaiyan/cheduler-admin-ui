import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsultationsDoughnutChartComponent } from './consultations-doughnut-chart.component';

describe('ConsultationsDoughnutChartComponent', () => {
  let component: ConsultationsDoughnutChartComponent;
  let fixture: ComponentFixture<ConsultationsDoughnutChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConsultationsDoughnutChartComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConsultationsDoughnutChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
