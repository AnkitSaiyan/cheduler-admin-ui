import { Directive, Input, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { PermissionService } from 'src/app/core/services/permission.service';
import { GeneralUserPermission, ReaderPermission } from '../models/permission.model';
import { UserRoleEnum } from '../models/user.model';

@Directive({
	selector: '[dfmPermitted]',
})
export class IsPermittedDirective implements OnInit {
	private elementPermission: string[] = [];

	@Input() set dfmPermitted(permission: string | string[]) {
		this.elementPermission = Array.isArray(permission) ? permission : [permission];
		this.displayTemplate();
	}

	constructor(private templateRef: TemplateRef<unknown>, private vcr: ViewContainerRef, public permissionSvc: PermissionService) {}

	ngOnInit(): void {
		this.displayTemplate();
	}

	private displayTemplate() {
		this.permissionSvc.permissionType$.subscribe({
			next: (permissionType) => {
				this.vcr.clear();

				switch (permissionType) {
					case UserRoleEnum.GeneralUser: {
						if (this.elementPermission.some((permission) => Object.values(GeneralUserPermission).find((value) => value === permission))) {
							this.createEmbeddedView();
						}
						break;
					}
					case UserRoleEnum.Reader: {
						if (this.elementPermission.some((permission) => Object.values(ReaderPermission).find((value) => value === permission))) {
							this.createEmbeddedView();
						}
						break;
					}
					default:
						this.createEmbeddedView();
						break;
				}
			},
		});
	}

	private createEmbeddedView() {
		this.vcr.createEmbeddedView(this.templateRef);
	}
}
