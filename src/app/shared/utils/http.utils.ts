import { HttpHeaders } from '@angular/common/http';

export class HttpUtils {
	public static GetHeader(...headerValues: Array<Array<string>>): HttpHeaders {
		let headers = new HttpHeaders();

		if (!headerValues?.length) {
			return headers;
		}

		headerValues.forEach((headerValue) => {
			if (headerValue?.length !== 2) {
				return;
			}
			headers = headers.append(headerValue[0], headerValue[1]);
		});
		headers = headers.append('Content-Type', 'Application/json');

		return headers;
	}
}
