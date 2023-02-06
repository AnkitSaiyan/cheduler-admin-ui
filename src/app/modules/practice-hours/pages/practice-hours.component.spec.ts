import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PracticeHoursComponent } from './practice-hours.component';

describe('PracticeHoursComponent', () => {
  let component: PracticeHoursComponent;
  let fixture: ComponentFixture<PracticeHoursComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PracticeHoursComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PracticeHoursComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
