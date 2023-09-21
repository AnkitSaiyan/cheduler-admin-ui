import { ColumnSort } from 'diflexmo-angular-design';
import { isSetEqual } from '@angular/compiler-cli/src/ngtsc/incremental/semantic_graph';
import { ensureOriginalSegmentLinks } from '@angular/compiler-cli/src/ngtsc/sourcemaps/src/source_file';

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
		localStorage.removeItem('isSessionExpired');
		localStorage.setItem('sessionExp', JSON.stringify(new Date(new Date().getTime() + 60 * 60 * 1000).getTime()));
	}

	public static SortArray([...arr]: readonly any[], sort: ColumnSort | undefined, key?: string): any[] {
		switch (sort) {
			case 'Asc':
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
					return a >= b ? -1 : 1;
				});
		}
	}

	public static modifyListData([...list]: any[], item: any, action: 'add' | 'delete' | 'update' | 'approved' | 'cancelled', key?: string, index?: null | number): any[] {
		if (!list.length) {
			return list;
		}

		action = action == 'approved' || action == 'cancelled' ? 'update' : action;

		switch (action) {
			case 'add':
				return [item, ...list];
			case 'delete':
				return list.filter((data) => {
					if (key) {
						return data[key]?.toString() !== item[key]?.toString();
					}
					return data !== item;
				});
			case 'update' || 'approved' || 'cancelled':
				if (typeof index === 'number' && index > -1 && index < list.length) {
					list[index] = item;
					return list;
				}

				return list.map((data) => {
					if (key) {
						if (data[key] === item[key]) {
							return item;
						}
					} else {
						if (data.toString() === item.toString()) {
							return item;
						}
					}
					return data;
				});
		}
	}

	public static removeDuplicateData(list: Array<any>, key: any): Array<any> {
		// const filtered = list.filter(
		// 	(
		// 		(s) => (o) =>
		// 			((k) => !s.has(k) && s.add(k))(key.map((k) => o[k]).join('|'))
		// 	)(new Set()),
		// );

		const filtered = list.filter((val, index, array) => array.findIndex((v) => v[key] == val[key]) == index);
		return filtered;
	}
}
