import { Directive, Input, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { PermissionService } from 'src/app/core/services/permission.service';
import { GeneralUserPermission, ReaderPermission } from '../models/permission.model';
import { UserRoleEnum } from '../models/user.model';

@Directive({
  selector: '[dfmPermitted]',
})
export class IsPermittedDirective implements OnInit {
  private elementPermission: string | null = null;

  @Input() set dfmPermitted(permission: string) {
    this.elementPermission = permission;
    this.displayTemplate();
  }

  constructor(private templateRef: TemplateRef<unknown>, private vcr: ViewContainerRef, private permissionSvc: PermissionService) {}

  ngOnInit(): void {
    this.displayTemplate();
  }

  private displayTemplate() {
    this.vcr.clear();
    const permission: string = this.elementPermission!;
    switch (this.permissionSvc.permissionType$$.value) {
      case UserRoleEnum.GeneralUser: {
        if (Object.values(GeneralUserPermission).find((value) => value === permission)) {
          this.createEmbeddedView();
        }
        break;
      }
      case UserRoleEnum.Reader: {
        if (Object.values(ReaderPermission).find((value) => value === permission)) {
          this.createEmbeddedView();
        }
        break;
      }
      default:
        this.createEmbeddedView();
        break;
    }
  }

  private createEmbeddedView() {
    this.vcr.createEmbeddedView(this.templateRef);
  }
}

