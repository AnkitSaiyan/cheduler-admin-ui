import {Pipe, PipeTransform} from "@angular/core";
import {AppointmentStatus} from "../models/status.model";
import {UserRoleEnum} from "../models/user.model";

@Pipe({
  name: 'roleName',
})
export class RoleNamePipe implements PipeTransform {
  private roles = {
    'admin': 'Admin',
    'reader': 'Reader',
    'general_user': 'General User',
  };

  public transform(userRole: UserRoleEnum): string {
    switch (userRole) {
      case UserRoleEnum.Admin:
      case UserRoleEnum.GeneralUser:
      case UserRoleEnum.Reader:
        return this.roles[userRole];
      default:
        return '';
    }
  }
}
