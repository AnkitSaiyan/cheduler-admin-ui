export enum HttpStatusCodes {
	OK = 200,
	BAD_REQUEST = 400,
	UNAUTHORIZED = 401,
	FORBIDDEN = 403,
	NOT_FOUND = 404,
	NOT_ACCEPTABLE = 406,
	CONFLICT = 409,
	UNPROCESSABLE_ENTITY = 422,
	INTERNAL_SERVER_ERROR = 500,
	UNDER_MAINTENANCE = 503,
}

export type HttpStatusName =
	| 'OK'
	| 'BAD_REQUEST'
	| 'UNAUTHORIZED'
	| 'FORBIDDEN'
	| 'NOT_FOUND'
	| 'NOT_ACCEPTABLE'
	| 'CONFLICT'
	| 'UNPROCESSABLE_ENTITY'
	| 'INTERNAL_SERVER_ERROR'
	| 'UNDER_MAINTENANCE';

export interface BaseResponse<T> {
	statusCode: HttpStatusCodes;
	statusText: HttpStatusName;
	message: string;
	metaData: MetaData;
	data: T;
}

export interface PaginationData {
	pageNo: number;
	pageSize: number;
	lastDataLength: number;
}
export interface MetaData {
	pagination: PaginationData;
}
