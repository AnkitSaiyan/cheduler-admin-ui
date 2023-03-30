export class User {
  mail: string = '';
  givenName: string = '';
  surname: string = '';
  email: string = '';
  displayName: string = '';
  id: string = '';
  properties: Record<string, string> = {};
  tenantIds: string[] = [];

  constructor(mail: string, givenName: string, id: string, surname: string, displayName: string, email: string, properties: Record<string, string>, tenantIds: string[]) {
    this.mail = mail;
    this.givenName = givenName;
    this.id = id;
    this.properties = properties;
    this.tenantIds = tenantIds;
    this.surname = surname;
    this.displayName = displayName;
    this.email = email;
  }
}
