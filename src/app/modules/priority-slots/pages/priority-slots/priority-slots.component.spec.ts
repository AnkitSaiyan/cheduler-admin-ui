import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrioritySlotsComponent } from './priority-slots.component';

describe('PrioritySlotsComponent', () => {
  let component: PrioritySlotsComponent;
  let fixture: ComponentFixture<PrioritySlotsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PrioritySlotsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrioritySlotsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
