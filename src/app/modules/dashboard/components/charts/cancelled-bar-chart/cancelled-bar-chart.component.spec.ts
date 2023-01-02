import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CancelledBarChartComponent } from './cancelled-bar-chart.component';

describe('CancelledBarChartComponent', () => {
  let component: CancelledBarChartComponent;
  let fixture: ComponentFixture<CancelledBarChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CancelledBarChartComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CancelledBarChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
