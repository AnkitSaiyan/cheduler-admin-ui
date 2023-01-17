import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewAbsenceComponent } from './view-absence.component';

describe('ViewAbsenceComponent', () => {
  let component: ViewAbsenceComponent;
  let fixture: ComponentFixture<ViewAbsenceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ViewAbsenceComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewAbsenceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
