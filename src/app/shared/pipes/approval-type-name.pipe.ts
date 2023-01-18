import { Pipe, PipeTransform } from '@angular/core';
import { ApprovalType } from '../models/appointment.model';

@Pipe({
  name: 'approvalTypeName',
})
export class ApprovalTypeNamePipe implements PipeTransform {
  private approvalTypes = {
    0: 'Pending',
    1: 'Approved',
    2: 'Cancelled',
  };

  public transform(approvalType: ApprovalType): string {
    switch (approvalType) {
      case ApprovalType.Approved:
      case ApprovalType.Cancelled:
      case ApprovalType.Pending:
        return this.approvalTypes[approvalType];
      default:
        return '';
    }
  }
}
