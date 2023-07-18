import { ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { FormControl } from '@angular/forms';
import { BehaviorSubject, combineLatest, debounceTime, filter, interval, map, Subject, switchMap, take, takeUntil, tap } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { CheckboxComponent, NotificationType, TableItem } from 'diflexmo-angular-design';
import { NgbDropdown } from '@ng-bootstrap/ng-bootstrap';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { ChangeStatusRequestData, Status, StatusToName } from '../../../../shared/models/status.model';
import { getStatusEnum } from '../../../../shared/utils/getEnums';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { ModalService } from '../../../../core/services/modal.service';
import { ConfirmActionModalComponent, ConfirmActionModalData } from '../../../../shared/components/confirm-action-modal.component';
import { SearchModalComponent, SearchModalData } from '../../../../shared/components/search-modal.component';
import { DownloadAsType, DownloadService } from '../../../../core/services/download.service';
import { RoomsApiService } from '../../../../core/services/rooms-api.service';
import { Room, UpdateRoomPlaceInAgendaRequestData } from '../../../../shared/models/rooms.model';
import { AddRoomModalComponent } from '../add-room-modal/add-room-modal.component';
import { TranslateService } from '@ngx-translate/core';
import { ENG_BE, Statuses, StatusesNL } from '../../../../shared/utils/const';
import { Translate } from '../../../../shared/models/translate.model';
import { ShareDataService } from 'src/app/core/services/share-data.service';
import { Permission } from 'src/app/shared/models/permission.model';
import { PermissionService } from 'src/app/core/services/permission.service';
import { UserRoleEnum } from 'src/app/shared/models/user.model';
import {PaginationData} from "../../../../shared/models/base-response.model";

@Component({
	selector: 'dfm-room-list',
	templateUrl: './room-list.component.html',
	styleUrls: ['./room-list.component.scss'],
})
export class RoomListComponent extends DestroyableComponent implements OnInit, OnDestroy {
	@HostListener('document:click', ['$event']) onClick() {
		this.toggleMenu(true);
	}

	@ViewChild('showMoreButtonIcon') private showMoreBtn!: ElementRef;

	@ViewChild('optionsMenu') private optionMenu!: NgbDropdown;

	@ViewChild('headerCheckBox') private headerCheckbox!: CheckboxComponent;

	@ViewChildren('rowCheckbox') private rowCheckboxes!: QueryList<CheckboxComponent>;

	private rooms$$: BehaviorSubject<Room[]>;

	public filteredRooms$$: BehaviorSubject<Room[]>;

	public clearSelected$$ = new Subject<void>();

	public afterBannerClosed$$ = new BehaviorSubject<{ proceed: boolean; newStatus: Status | null } | null>(null);

	public loading$$ = new BehaviorSubject(true);

	public searchControl = new FormControl('', []);

	public downloadDropdownControl = new FormControl('', []);

	public columns: string[] = ['Name', 'Description', 'PlaceInAgenda', 'Type', 'Status', 'Actions'];

	public downloadItems: any[] = [];

	public selectedRooms: number[] = [];

	public statusType = getStatusEnum();

	public roomPlaceInToIndexMap = new Map<number, number>();

	private selectedLang: string = ENG_BE;

	public statuses = Statuses;

	public readonly Permission = Permission;

	public readonly UserRole = UserRoleEnum;

	public clipboardData: string = '';

	private paginationData: PaginationData | undefined;

	constructor(
		private roomApiSvc: RoomsApiService,
		private notificationSvc: NotificationDataService,
		private router: Router,
		private route: ActivatedRoute,
		private modalSvc: ModalService,
		private downloadSvc: DownloadService,
		private cdr: ChangeDetectorRef,
		private translate: TranslateService,
		private shareDataSvc: ShareDataService,
		public permissionSvc: PermissionService,
	) {
		super();
		this.rooms$$ = new BehaviorSubject<any[]>([]);
		this.filteredRooms$$ = new BehaviorSubject<any[]>([]);
    this.roomApiSvc.pageNo = 1;
	}

	public ngOnInit(): void {
		this.downloadSvc.fileTypes$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (items) => (this.downloadItems = items)
		});

		this.rooms$$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (rooms) => this.handleSearch(this.searchControl.value ?? ''),
		});

		this.roomApiSvc.rooms$
			.pipe(
				tap(() => this.loading$$.next(false)),
				takeUntil(this.destroy$$),
			)
			.subscribe({
				next:
					(roomsBase) => {
						if (this.paginationData && this.paginationData.pageNo < roomsBase.metaData.pagination.pageNo) {
							this.rooms$$.next([...this.rooms$$.value, ...roomsBase.data]);
						} else {
							this.rooms$$.next(roomsBase.data);
						}
						this.paginationData = roomsBase.metaData?.pagination;
						this.mapRoomPlaceInAgenda();
						this.loading$$.next(false);
					},
				error: () => {
					this.rooms$$.next([]);
					this.loading$$.next(false)
				},
			});


      this.route.queryParams.pipe(takeUntil(this.destroy$$)).subscribe(({ search }) => {
				this.searchControl.setValue(search);
				if (search) {
					this.handleSearch(search.toLowerCase());
				} else {
					this.filteredRooms$$.next([...this.rooms$$.value]);
				}
			});

			this.searchControl.valueChanges.pipe(debounceTime(200), takeUntil(this.destroy$$)).subscribe({
				next: (searchText) => {
					this.router.navigate([], { queryParams: { search: searchText }, relativeTo: this.route, queryParamsHandling: 'merge', replaceUrl: true });
				},
			});


		this.downloadDropdownControl.valueChanges
			.pipe(
				filter((value) => !!value),
				takeUntil(this.destroy$$),
			)
			.subscribe({
				next: (value) => {
					if (!this.filteredRooms$$.value.length) {
						this.notificationSvc.showNotification(Translate.NoDataToDownlaod[this.selectedLang], NotificationType.WARNING);
						this.clearDownloadDropdown();
						return;
					}

					this.downloadSvc.downloadJsonAs(
						value as DownloadAsType,
						this.columns.filter((val) => val !== 'Actions'),
						this.filteredRooms$$.value.map((u: Room) => [
							u.name,
							u.description,
							this.roomPlaceInToIndexMap.get(u.placeInAgenda)?.toString(),
							u.type?.toString(),
							Translate[StatusToName[+u.status]][this.selectedLang],
						]),
						'rooms',
					);

					if (value !== 'PRINT') {
						this.notificationSvc.showNotification(Translate.DownloadSuccess(value)[this.selectedLang]);
					}
					this.clearDownloadDropdown();
				}
			});

		this.clearSelected$$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: () => {
				this.selectedRooms = [];
				this.toggleCheckboxes();
			}
		});

		this.afterBannerClosed$$
			.pipe(
				map((value) => {
					if (value?.proceed) {
						return [...this.selectedRooms.map((id) => ({ id: +id, status: value.newStatus as number }))];
					}
					return [];
				}),
				filter((changes) => {
					if (!changes.length) {
						this.clearSelected$$.next();
					}
					return !!changes.length;
				}),
				switchMap((changes) => this.roomApiSvc.changeRoomStatus$(changes)),
				takeUntil(this.destroy$$),
			)
			.subscribe({
				next: (value) => {
					this.notificationSvc.showNotification(Translate.SuccessMessage.StatusChanged[this.selectedLang]);
					this.clearSelected$$.next();
				}
			});

		interval(0)
			.pipe(takeUntil(this.destroy$$))
			.subscribe({
				next: () => this.closeMenus()
			});

		combineLatest([this.shareDataSvc.getLanguage$(), this.permissionSvc.permissionType$])
			.pipe(takeUntil(this.destroy$$))
			.subscribe({
				next: ([lang]) => {
					this.selectedLang = lang;
					this.columns = [
						Translate.Name[lang],
						Translate.Description[lang],
						Translate.PlaceInAgenda[lang],
						Translate.Type[lang],
						Translate.Status[lang],
					];

					if (this.permissionSvc.isPermitted([Permission.UpdateRooms, Permission.DeleteRooms])) {
						this.columns = [...this.columns, Translate.Actions[lang]];
					}

					switch (lang) {
						case ENG_BE:
							this.statuses = Statuses;
							break;
						default:
							this.statuses = StatusesNL;
					}
				}
			});
	}

	public override ngOnDestroy() {
		super.ngOnDestroy();
	}

	public handleCheckboxSelection(roomID: number) {
		// this.toggleMenu(true);

		if (roomID !== -1) {
			const index = this.selectedRooms.indexOf(roomID);

			if (index === -1) {
				this.selectedRooms.push(roomID);
			} else {
				this.selectedRooms.splice(index, 1);
			}

			if (this.selectedRooms.length === this.rooms$$.value.length) {
				this.headerCheckbox.value = true;
			} else if (this.headerCheckbox.value) {
				this.headerCheckbox.value = false;
			}
		} else if (this.selectedRooms.length !== this.rooms$$.value.length) {
			this.selectedRooms = [...this.rooms$$.value.map((room) => +room.id)];
			this.toggleCheckboxes(true);
		} else {
			this.selectedRooms = [];
			this.toggleCheckboxes();
		}
	}

	private handleSearch(searchText: any): void {
		this.filteredRooms$$.next([
			...this.rooms$$.value.filter((room) => {
				let type: any;
				let status: any;
				if (room.type === 'public') type = this.translate.instant('Public');
				if (room.type === 'private') type = this.translate.instant('Private');
				if (room.status === 1) status = this.translate.instant('Active');
				if (room.status === 0) status = this.translate.instant('Inactive');
				return (
					room.name?.toLowerCase()?.includes(searchText) ||
					room.description?.toLowerCase()?.includes(searchText) ||
					type?.toLowerCase()?.includes(searchText) ||
					status?.toLowerCase()?.startsWith(searchText)
				);
			}),
		]);
	}

	public changeStatus(changes: ChangeStatusRequestData[]) {
		this.roomApiSvc
			.changeRoomStatus$(changes)
			.pipe(takeUntil(this.destroy$$))
			.subscribe(() => this.notificationSvc.showNotification(Translate.SuccessMessage.StatusChanged[this.selectedLang]));
	}

	public deleteRoom(id: number) {
		const dialogRef = this.modalSvc.open(ConfirmActionModalComponent, {
			data: {
				titleText: 'Confirmation',
				bodyText: 'AreYouSureYouWantThisRoom',
				confirmButtonText: 'Delete',
				cancelButtonText: 'Cancel',
			} as ConfirmActionModalData,
		});

		dialogRef.closed
			.pipe(
				filter((res: boolean) => res),
				switchMap(() => this.roomApiSvc.deleteRoom(id)),
				take(1),
			)
			.subscribe(() => {
				this.notificationSvc.showNotification(Translate.SuccessMessage.RoomsDeleted[this.selectedLang]);
			});
	}

	public handleConfirmation(e: { proceed: boolean; newStatus: Status | null }) {
		this.afterBannerClosed$$.next(e);
	}

	public copyToClipboard() {
		try {
			let dataString = `${this.columns.filter((value) => value !== 'Actions').join('\t')}\n`;

			if (!this.filteredRooms$$.value.length) {
				this.notificationSvc.showNotification(Translate.NoDataToDownlaod[this.selectedLang], NotificationType.DANGER);
				this.clipboardData = '';
				return;
			}

			this.filteredRooms$$.value.forEach((room: Room) => {
				dataString += `${room.name}\t${room.description}\t${room.placeInAgenda}\t ${room.type}\t ${StatusToName[+room.status]}\n`;
			});

			this.clipboardData = dataString;

			this.cdr.detectChanges();
			this.notificationSvc.showNotification(Translate.SuccessMessage.CopyToClipboard[this.selectedLang]);
		} catch (e) {
			this.notificationSvc.showNotification(Translate.ErrorMessage.CopyToClipboard[this.selectedLang], NotificationType.DANGER);
			this.clipboardData = '';
		}
	}

	public navigateToViewRoom(e: TableItem) {
		if (e?.id) {
			this.router.navigate([`./${e.id}/view`], { relativeTo: this.route, queryParamsHandling: 'preserve' });
		}
	}

	public toggleMenu(reset = false) {
		const icon = document.querySelector('.rm-li-plus-btn-icon');

		if (icon) {
			if (reset) {
				icon.classList.add('rotate-z-0');
				icon.classList.remove('rotate-z-45');
			} else {
				icon.classList.toggle('rotate-z-45');
				icon.classList.toggle('rotate-z-0');
			}
		}
	}

	public openSearchModal() {
		this.toggleMenu();

		const modalRef = this.modalSvc.open(SearchModalComponent, {
			options: { fullscreen: true },
			data: {
				items: [
					...this.rooms$$.value.map(({ id, name, description }) => ({
						name,
						description,
						key: `${name} ${description}`,
						value: id,
					})),
				],
				placeHolder: 'Search by Room Name, Description',
			} as SearchModalData,
		});

		modalRef.closed.pipe(take(1)).subscribe((result) => this.filterRooms(result));
	}

	private filterRooms(result: { name: string; value: string }[]) {
		if (!result?.length) {
			this.filteredRooms$$.next([...this.rooms$$.value]);
			return;
		}

		const ids = new Set<number>();
		result.forEach((item) => ids.add(+item.value));
		this.filteredRooms$$.next([...this.rooms$$.value.filter((room: Room) => ids.has(+room.id))]);
	}

	public async openAddRoomModal(roomDetails?: Room) {
		this.modalSvc.open(AddRoomModalComponent, {
			data: {
				edit: !!roomDetails?.id,
				roomID: roomDetails?.id,
				placeInAgendaIndex: roomDetails ? this.roomPlaceInToIndexMap.get(+roomDetails.placeInAgenda) : this.rooms$$.value.length + 1,
			},
			options: {
				size: 'lg',
				centered: true,
				backdropClass: 'modal-backdrop-remove-mv',
			},
		});
	}

	private closeMenus() {
		if (window.innerWidth >= 680) {
			if (this.optionMenu && this.optionMenu.isOpen()) {
				this.optionMenu.close();
				this.toggleMenu(true);
			}
		}
	}

	private toggleCheckboxes(select = false) {
		if (this.rowCheckboxes) {
			this.rowCheckboxes.forEach((checkbox) => {
				if (select) {
					// eslint-disable-next-line no-param-reassign
					checkbox.value = true;
				} else if (checkbox.value) {
					// eslint-disable-next-line no-param-reassign
					checkbox.value = false;
				}
			});
		}

		if (this.headerCheckbox) {
			if (!select) {
				// eslint-disable-next-line @typescript-eslint/no-unused-expressions
				const { headerCheckbox } = this;
				headerCheckbox.value = false;
			}
		}
	}

	public drop(event: CdkDragDrop<Room[]>) {
		moveItemInArray(this.rooms$$.value, event.previousIndex, event.currentIndex);
		if (event.previousIndex !== event.currentIndex) {
			this.updatePlaceInAgenda(event.currentIndex, event.previousIndex);
		}
	}

	private updatePlaceInAgenda(currentIndex: number, previousIndex: number) {
		const [start, end] = currentIndex < previousIndex ? [currentIndex, previousIndex] : [previousIndex, currentIndex];

		const requestData: UpdateRoomPlaceInAgendaRequestData[] = [];
		const rooms = this.rooms$$.value;

		let smallestPlaceInAgenda: number = rooms[currentIndex].placeInAgenda;

		for (let i = start; i < end; i++) {
			if (rooms[i + 1].placeInAgenda < rooms[i].placeInAgenda) {
				smallestPlaceInAgenda = rooms[i].placeInAgenda;
				rooms[i].placeInAgenda = rooms[i + 1].placeInAgenda;
				rooms[i + 1].placeInAgenda = smallestPlaceInAgenda;
			} else if (smallestPlaceInAgenda < rooms[i].placeInAgenda) {
				const temp = rooms[i].placeInAgenda;
				rooms[i].placeInAgenda = smallestPlaceInAgenda;
				smallestPlaceInAgenda = temp;

				if (i + 2 === end) {
					rooms[i + 2].placeInAgenda = rooms[i + 1].placeInAgenda;
					rooms[i + 1].placeInAgenda = smallestPlaceInAgenda;
				}
			}

			requestData.push({
				id: rooms[i].id,
				placeInAgenda: rooms[i].placeInAgenda,
			});
		}

		requestData.push({
			id: rooms[end].id,
			placeInAgenda: rooms[end].placeInAgenda,
		});

		this.loading$$.next(true);

		this.roomApiSvc
			.updatePlaceInAgenda$(requestData)
			.pipe(takeUntil(this.destroy$$))
			.subscribe(
				(res) => {
					this.loading$$.next(false);
				},
				() => this.loading$$.next(false),
			);
	}

	private mapRoomPlaceInAgenda() {
		this.roomPlaceInToIndexMap.clear();

		this.rooms$$.value.forEach((room, index) => {
			this.roomPlaceInToIndexMap.set(+room.placeInAgenda, index + 1);
		});
	}
	private clearDownloadDropdown() {
		const timeout = setTimeout(() => {
			this.downloadDropdownControl.setValue('');
			clearTimeout(timeout);
		}, 0);
	}

	public onScroll(e: any) {
		if (this.paginationData?.pageCount && this.paginationData?.pageNo && this.paginationData.pageCount > this.paginationData.pageNo) {
			this.roomApiSvc.pageNo = this.roomApiSvc.pageNo + 1;
		}
	}
}
