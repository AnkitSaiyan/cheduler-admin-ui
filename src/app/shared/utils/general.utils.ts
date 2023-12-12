import { ColumnSort } from 'diflexmo-angular-design';

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
		}
		return arr;
	}

	public static saveSessionExpTime(): void {
		localStorage.removeItem('isSessionExpired');
		localStorage.setItem('sessionExp', JSON.stringify(new Date(new Date().getTime() + 60 * 60 * 1000).getTime()));
	}

	public static SortArray([...arr]: readonly any[], sort: ColumnSort | undefined, key?: string): any[] {
		if (key === 'startedAt' || key === 'endedAt') {
			return this.sortDate(arr, sort, key);
		}
		const compareFunction = (a: any, b: any) => {
			const compareResult = key ? a[key] - b[key] : a - b;
			return sort === 'Asc' ? compareResult : -compareResult;
		};
		return arr.slice().sort(compareFunction);
	}

	public static modifyListData(
		[...list]: any[],
		item: any,
		action: 'add' | 'delete' | 'update' | 'approved' | 'cancelled',
		key?: string,
		index?: null | number,
	): any[] {
		if (!list.length) {
			return list;
		}
		const perform = action === 'approved' || action === 'cancelled' ? 'update' : action;
		switch (perform) {
			case 'add':
				return [item, ...list];

			case 'delete':
				return this.deleteItem(list, item, key);

			case 'update':
				return this.updateItem(list, item, key, index);

			default:
				return list;
		}
	}

	private static deleteItem(list: any[], item: any, key?: string): any[] {
		return list.filter((data) => this.isNotMatching(data, item, key));
	}

	private static updateItem(list: any[], item: any, key?: string, index?: null | number): any[] {
		if (typeof index === 'number' && index > -1 && index < list.length) {
			return [...list.slice(0, index), item, ...list.slice(index + 1)];
		}
		return list.map((data) => (this.isMatching(data, item, key) ? item : data));
	}

	private static isNotMatching(data: any, item: any, key?: string): boolean {
		return key ? data[key]?.toString() !== item[key]?.toString() : data !== item;
	}

	private static isMatching(data: any, item: any, key?: string): boolean {
		return key ? data[key] === item[key] : data.toString() === item.toString();
	}

	public static removeDuplicateData(list: Array<any>, key: any): Array<any> {
		if (!list.length) return list;
		const filtered = list.filter((val, index, array) => array.findIndex((v) => v[key] === val[key]) === index);
		return filtered;
	}

	private static sortDate([...arr]: readonly any[], sort: ColumnSort | undefined, key: string): any[] {
		const trueData: any[] = [];
		const falseData: any[] = [];
		arr.forEach((val) => {
			if (val[key]) {
				trueData.push(val);
			} else {
				falseData.push(val);
			}
		});
		if (sort === 'Asc') {
			trueData.sort((a: any, b: any) => (new Date(a[key]) < new Date(b[key]) ? -1 : 1));
		} else {
			trueData.sort((a: any, b: any) => (new Date(b[key]) < new Date(a[key]) ? -1 : 1));
		}
		return [...trueData, ...falseData];
	}
}
