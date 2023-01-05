import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientConsultationsLineChartComponent } from './patient-consultations-line-chart.component';

describe('PatientConsultantionsLineChartComponent', () => {
  let component: PatientConsultationsLineChartComponent;
  let fixture: ComponentFixture<PatientConsultationsLineChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PatientConsultationsLineChartComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientConsultationsLineChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
