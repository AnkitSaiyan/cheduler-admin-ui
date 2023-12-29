import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TopExaminationsComponent } from './top-examinations.component';

describe('TopExaminationsComponent', () => {
	let component: TopExaminationsComponent;
	let fixture: ComponentFixture<TopExaminationsComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [TopExaminationsComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(TopExaminationsComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
