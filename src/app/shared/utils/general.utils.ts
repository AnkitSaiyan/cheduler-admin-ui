import {DEV_SUBDOMAIN, DEV_TENANT_ID, UAT_TENANT_ID} from "./const";

export class GeneralUtils {
  public static FilterArray([...arr]: readonly any[], filterText: string, key?: string): any[] {
    if (filterText) {
      return [...arr.filter((d) => {
        if (key) {
          return d[key]?.toString()?.toLowerCase()?.includes(filterText.toString()?.toLowerCase());
        }
        return d?.toString()?.toLowerCase().includes(filterText.toString().toLowerCase());
      })];
    } else {
      return arr;
    }
  }

  public static get TenantID(): string {
    const subDomain = window.location.host.split('.')[0];
    const localhost = 'localhost';

    switch (subDomain) {
      case localhost:
      case DEV_SUBDOMAIN:
        return DEV_TENANT_ID;
      default:
        return UAT_TENANT_ID
    }
  }
}
