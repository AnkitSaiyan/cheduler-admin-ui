import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnavailableHallPeriodsComponent } from './unavailable-hall-periods.component';

describe('UnavailableHallPeriodsComponent', () => {
  let component: UnavailableHallPeriodsComponent;
  let fixture: ComponentFixture<UnavailableHallPeriodsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UnavailableHallPeriodsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UnavailableHallPeriodsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
