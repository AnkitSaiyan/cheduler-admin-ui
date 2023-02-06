import { Pipe, PipeTransform } from '@angular/core';
import { AppointmentStatus } from '../models/status';

@Pipe({
  name: 'approvalTypeName',
})
export class ApprovalTypeNamePipe implements PipeTransform {
  private approvalTypes = {
    0: 'Pending',
    1: 'Approved',
    2: 'Cancelled',
  };

  public transform(approvalType: AppointmentStatus): string {
    switch (approvalType) {
      case AppointmentStatus.Approved:
      case AppointmentStatus.Cancelled:
      case AppointmentStatus.Pending:
        return this.approvalTypes[approvalType];
      default:
        return '';
    }
  }
}
