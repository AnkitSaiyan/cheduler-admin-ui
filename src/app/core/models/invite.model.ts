export class UserInvite {
  email: string = '';
  givenName: string = '';
  surName: string = '';
  contextTenantId: string = '';
  roleName: string = '';
  redirect: UserInviteRedirect = { redirectUrl: '' }
}

export class UserInviteRedirect {
  redirectUrl: string = '';
}
