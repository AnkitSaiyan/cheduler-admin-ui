import { AbstractControl } from '@angular/forms';

export function toggleControlError(control: AbstractControl | null | undefined, errorName: string, set = true) {
  if (set) {
    if (!control?.hasError(errorName)) {
      console.log('in set error', control)
      control?.setErrors({ [errorName]: true });
      console.log('in set error after error set', control)
    }
  } else if (control?.hasError(errorName)) {
    control?.setErrors(null);
  }
}
