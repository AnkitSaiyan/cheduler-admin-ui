export class UserProperties {
  id: string = '';
  displayName: string = '';
  givenName: string = '';
  surname: string = '';
  email: string = '';
  isExternal: boolean = false;
  properties: Record<string, string> = {};
}
