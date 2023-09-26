import { Pipe, PipeTransform } from "@angular/core";
import { map, Observable } from "rxjs";
import { TranslateService } from "@ngx-translate/core";

@Pipe({
    name: 'dfmMultiDropdownPlaceholderName',
    pure: false,
})
export class MultiDropdownPlaceholderNamePipe implements PipeTransform {
    constructor(private translate: TranslateService) {}
    transform(length: number, key: string): Observable<string> {
        if (!+length) {
            return this.translate.get(key);
        }
        return this.translate.get('Selected').pipe(map((translation) => `${length} ${translation}`));
    }
}