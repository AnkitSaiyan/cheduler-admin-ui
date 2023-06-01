import {ColumnSort} from "diflexmo-angular-design";

export class GeneralUtils {
	public static FilterArray([...arr]: readonly any[], filterText: string, key?: string): any[] {
		if (filterText) {
			return [
				...arr.filter((d) => {
					if (key) {
						return d[key]?.toString()?.toLowerCase()?.includes(filterText.toString()?.toLowerCase());
					}
					return d?.toString()?.toLowerCase().includes(filterText.toString().toLowerCase());
				}),
			];
		} else {
			return arr;
		}
	}

	public static saveSessionExpTime(): void {
		localStorage.setItem('sessionExp', JSON.stringify(new Date(new Date().getTime() + 60 * 60 * 1000).getTime()));
	}

	public static SortArray([...arr]: readonly any[], sort: ColumnSort | undefined, key?: string): any[] {
		switch (sort) {
			case "Asc":
				return arr.sort((a, b) => {
					if (key) {
						return a[key] <= b[key] ? -1 : 1;
					}
					return a <= b ? -1 : 1;
				});
			default:
				return arr.sort((a, b) => {
					if (key) {
						return a[key] >= b[key] ? -1 : 1;
					}
					return a >=	 b ? -1 : 1;
				});
		}
	}
}







