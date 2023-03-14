import { AbstractControl } from '@angular/forms';

export function toggleControlError(control: AbstractControl | null | undefined, errorName: string, set = true) {
  if (set) {
    if (!control?.hasError(errorName)) {

      control?.setErrors({ [errorName]: true });

    }
  } else if (control?.hasError(errorName)) {
    control?.setErrors(null);
  }
}
