import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TopReferringDoctorsListComponent } from './top-referring-doctors-list.component';

describe('TopRefferingDoctorsListComponent', () => {
	let component: TopReferringDoctorsListComponent;
	let fixture: ComponentFixture<TopReferringDoctorsListComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [TopReferringDoctorsListComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(TopReferringDoctorsListComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
