import {Pipe, PipeTransform} from "@angular/core";
import {DateTimeUtils} from "../utils/date-time.utils";

@Pipe({
    name: 'dfmUtcToLocal'
})
export class UtcToLocalPipe implements PipeTransform {
    public transform(utcDateTimeString: string, timeOnly = false): string {
        if (!utcDateTimeString) {
            return utcDateTimeString;
        }
        
        if (timeOnly) {
            return DateTimeUtils.UTCTimeToLocalTimeString(utcDateTimeString);
        }

        return DateTimeUtils.UTCDateToLocalDate(new Date(utcDateTimeString)).toString();
    }
}