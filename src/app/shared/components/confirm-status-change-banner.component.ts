import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ShareDataService } from 'src/app/core/services/share-data.service';
import { AppointmentStatus, Status } from '../models/status.model';
import { ENG_BE } from '../utils/const';

@Component({
	selector: 'dfm-confirm-status-change-banner',
	template: `
		<div
			*ngIf="display"
			class="confirm-banner dfm-gap-16 dfm-px-32 dfm-py-12 shadow-lg"
			(click)="$event.preventDefault(); $event.stopImmediatePropagation()"
		>
			<div class="hidden align-items-center justify-content-between dfm-gap-16">
				<h5 class="modal-title">{{ 'Confirmation' | translate }}</h5>
				<dfm-button-icon color="tertiary-gray" icon="x-close" (click)="$event.stopPropagation(); handleClick(false)"></dfm-button-icon>
			</div>

			<div class="w-full">
				<span class="font-weight-medium">{{ 'AreYouSureWantToChangeStatus' | translate }}</span>
			</div>

			<div class="d-flex align-items-center dfm-gap-16 w-fit">
				<div class="flex-1 dropdown-wrapper">
					<dfm-input-dropdown
						(click)="$event.stopPropagation()"
						#statusDropdown
						[items]="statuses"
						[showDescription]="false"
						placeholder="{{ 'Status' | translate }}"
						size="md"
						[formControl]="statusDropdownControl"
					></dfm-input-dropdown>
				</div>

				<div class="d-flex flex-row dfm-gap-16 align-items-center">
					<dfm-button color="secondary" size="md" (click)="$event.stopPropagation(); handleClick(false)">{{ 'Cancel' | translate }} </dfm-button>
					<dfm-button
						color="primary"
						size="md"
						(click)="$event.stopPropagation(); handleClick(true)"
						[disabled]="statusDropdownControl.value === null"
					>
						{{ 'Proceed' | translate }}
					</dfm-button>
				</div>
			</div>
		</div>
	`,
	styles: [
		`
			.confirm-banner {
				transition: all 1000ms ease-in-out;
				background: white;
				display: flex;
				align-items: center;
				justify-content: space-between;
				position: absolute;
				left: 0;
				right: 0;
				bottom: 0;
				z-index: 999999;
				border-top-right-radius: 20px;
				border-top-left-radius: 20px;
				.dropdown-wrapper {
					width: 160px;
				}
			}

			@media (max-width: 680px) {
				.confirm-banner {
					transition: all ease 200ms;
					flex-direction: column;
					justify-content: start !important;

					& > div,
					div:last-child {
						flex: 1;
						width: 100%;
					}

					div:first-child {
						display: flex;
					}

					div:last-child {
						transition: all ease 200ms;
						flex-direction: column;
						margin-bottom: 8px;

						div:first-child {
							margin-right: auto;
						}

						div:last-child {
							transition: all ease 200ms;

							dfm-button {
								height: 44px;
							}
						}
					}
				}
			}
		`,
	],
})
export class ConfirmStatusChangeBannerComponent implements OnInit {
	@Input() public display;

	@Input() public statusType: 'status' | 'appointment' = 'status';

	@Output() private confirmationEvent = new EventEmitter<{ proceed: boolean; newStatus: number | null }>();

	public statusDropdownControl = new FormControl(null, []);

	public statuses!: any[];

	constructor(private dataShareService: ShareDataService) {}

	public ngOnInit() {
		switch (this.statusType) {
			case 'appointment':
				this.statuses = [
					{
						name: 'Pending',
						value: AppointmentStatus.Pending,
					},
					{
						name: 'Approved',
						value: AppointmentStatus.Approved,
					},
					{
						name: 'Cancelled',
						value: AppointmentStatus.Cancelled,
					},
				] as any[];
				break;
			case 'status':
				this.statuses = [
					{
						name: 'Active',
						value: Status.Active,
					},
					{
						name: 'Inactive',
						value: Status.Inactive,
					},
				] as any[];
				break;
			default:
				this.statuses = [];
		}

		this.handleSubscription();
	}

	private handleSubscription() {
		this.dataShareService.getLanguage$().subscribe({
			next: (language: string) => {
				switch (this.statusType) {
					case 'appointment':
						this.statuses = [
							{
								name: language === ENG_BE ? 'Pending' : 'In afwachting',
								value: AppointmentStatus.Pending,
							},
							{
								name: language === ENG_BE ? 'Approved' : 'Goedgekeurd',
								value: AppointmentStatus.Approved,
							},
							{
								name: language === ENG_BE ? 'Cancelled' : 'Geannuleerd',
								value: AppointmentStatus.Cancelled,
							},
						] as any[];
						break;
					case 'status':
						this.statuses = [
							{
								name: language === ENG_BE ? 'Active' : 'Actief',
								value: Status.Active,
							},
							{
								name: language === ENG_BE ? 'Inactive' : 'Inactief',
								value: Status.Inactive,
							},
						] as any[];
						break;
					default:
						this.statuses = [];
				}
			},
		});
	}

	public handleClick(proceed: boolean) {
		if (!proceed) {
			this.confirmationEvent.emit({ proceed, newStatus: null });
		} else if (this.statusDropdownControl.value !== null) {
			this.confirmationEvent.emit({ proceed, newStatus: this.statusDropdownControl.value });
		}

		this.statusDropdownControl.setValue(null, { emitEvent: false });
	}
}
