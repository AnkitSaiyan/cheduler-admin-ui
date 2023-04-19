import {Pipe, PipeTransform} from "@angular/core";
import {DateTimeUtils} from "../utils/date-time.utils";

@Pipe({
    name: 'dfmUtcToLocal'
})
export class UtcToLocalPipe implements PipeTransform {
    public transform(utcDateString: string): string {
        if (!utcDateString) {
            return utcDateString;
        }

        return DateTimeUtils.UTCDateToLocalDate(new Date(utcDateString)).toString();
    }
}