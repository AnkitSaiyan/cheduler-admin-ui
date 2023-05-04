import {Injectable} from "@angular/core";
import {GeneralUtils} from "../../shared/utils/general.utils";
import {MsalService} from "@azure/msal-angular";

@Injectable({
    providedIn: 'root'
})
export class TenantService {
    constructor(private msalService: MsalService) {
    }

    public get currentTenant(): string {
        const user = this.msalService.instance.getActiveAccount();
        const tenants = ((user?.idTokenClaims as any).extension_Tenants as string).split(',');

        let currentTenantId = GeneralUtils.TenantID;

        const tenantIds = tenants ?? [];

        if (!tenantIds.find((tenantId) => currentTenantId === tenantId)) {
            currentTenantId = tenants[0] as string;
        }

        return currentTenantId;
    }
}


