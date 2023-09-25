import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { BaseResponse } from 'src/app/shared/models/base-response.model';
import { BodyPart } from 'src/app/shared/models/body-part.model';
import { BodyType } from 'src/app/shared/utils/const';
import { environment } from 'src/environments/environment';

@Injectable({
	providedIn: 'root',
})
export class BodyPartService {
	constructor(private http: HttpClient) {}

	private bodyPart = new Map<number | BodyType, BodyPart | BodyPart[]>();

	public allBodyPart$(): Observable<BodyPart[]> {
		return this.http.get<BaseResponse<BodyPart[]>>(`${environment.schedulerApiUrl}/common/getbodyparts`).pipe(
			map((response) => response.data),
			tap(this.setBodyPart.bind(this)),
		);
	}

	public get maleBodyPart(): BodyPart[] {
		return this.bodyPart.get(BodyType.Male) as BodyPart[];
	}

	public get femaleBodyPart(): BodyPart[] {
		return this.bodyPart.get(BodyType.Female) as BodyPart[];
	}

	public get commonBodyPart(): BodyPart[] {
		return this.bodyPart.get(BodyType.Common) as BodyPart[];
	}

	public getBodyPartById(id: number): BodyPart {
		return this.bodyPart.get(id) as BodyPart;
	}
	public getBodyPartByType(type: BodyType): BodyPart[] {
		return this.bodyPart.get(type) as BodyPart[];
	}

	private setBodyPart(bodyParts: BodyPart[]) {
		this.bodyPart.set(BodyType.Common, bodyParts),
			this.bodyPart.set(BodyType.Male, []),
			this.bodyPart.set(BodyType.Female, []),
			bodyParts.forEach((bodyPart) => {
				this.bodyPart.set(bodyPart.id, bodyPart);
				if (bodyPart.isMale) {
					this.bodyPart.set(BodyType.Male, [...(this.bodyPart.get(BodyType.Male) as BodyPart[]), bodyPart]);
				}
				if (bodyPart.isFemale) {
					this.bodyPart.set(BodyType.Female, [...(this.bodyPart.get(BodyType.Female) as BodyPart[]), bodyPart]);
				}
			});
	}
}

