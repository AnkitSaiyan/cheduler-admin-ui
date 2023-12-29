import { Injectable } from '@angular/core';
import { MsalService } from '@azure/msal-angular';

@Injectable({
	providedIn: 'root',
})
export class TenantService {
	constructor(private msalService: MsalService) {}
}
