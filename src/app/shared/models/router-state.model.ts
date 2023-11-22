import { Params } from '@angular/router';

export interface RouterState {
	params: Params;
	queryParams: Params;
	url: string;
	data: any;
}
