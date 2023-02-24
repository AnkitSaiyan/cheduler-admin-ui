import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddPrioritySlotsComponent } from './add-priority-slots.component';

describe('AddPrioritySlotsComponent', () => {
  let component: AddPrioritySlotsComponent;
  let fixture: ComponentFixture<AddPrioritySlotsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddPrioritySlotsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddPrioritySlotsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
