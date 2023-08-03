import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentViewModalComponent } from './document-view-modal.component';

describe('DocumentViewModalComponent', () => {
  let component: DocumentViewModalComponent;
  let fixture: ComponentFixture<DocumentViewModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DocumentViewModalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentViewModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
