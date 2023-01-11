import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PhysicianListComponent } from './physician-list.component';

describe('PhysicianListComponent', () => {
  let component: PhysicianListComponent;
  let fixture: ComponentFixture<PhysicianListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PhysicianListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PhysicianListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
