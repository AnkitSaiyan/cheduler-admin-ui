import { UserType } from '../models/user.model';

export function getUserTypeEnum(): typeof UserType {
  return UserType;
}
