import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PhysicianViewComponent } from './physician-view.component';

describe('PhysicianViewComponent', () => {
  let component: PhysicianViewComponent;
  let fixture: ComponentFixture<PhysicianViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PhysicianViewComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PhysicianViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
