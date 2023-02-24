import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewPrioritySlotsComponent } from './view-priority-slots.component';

describe('ViewPrioritySlotsComponent', () => {
  let component: ViewPrioritySlotsComponent;
  let fixture: ComponentFixture<ViewPrioritySlotsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ViewPrioritySlotsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewPrioritySlotsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
