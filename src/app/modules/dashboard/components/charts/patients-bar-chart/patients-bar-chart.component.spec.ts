import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientsBarChartComponent } from './patients-bar-chart.component';

describe('PatientsBarChartComponent', () => {
  let component: PatientsBarChartComponent;
  let fixture: ComponentFixture<PatientsBarChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PatientsBarChartComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientsBarChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
