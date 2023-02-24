import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListPrioritySlotsComponent } from './list-priority-slots.component';

describe('ListPrioritySlotsComponent', () => {
  let component: ListPrioritySlotsComponent;
  let fixture: ComponentFixture<ListPrioritySlotsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListPrioritySlotsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListPrioritySlotsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
