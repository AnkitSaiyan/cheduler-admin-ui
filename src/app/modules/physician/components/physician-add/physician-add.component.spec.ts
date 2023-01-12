import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PhysicianAddComponent } from './physician-add.component';

describe('AddPhysicianComponent', () => {
  let component: PhysicianAddComponent;
  let fixture: ComponentFixture<PhysicianAddComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PhysicianAddComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PhysicianAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
