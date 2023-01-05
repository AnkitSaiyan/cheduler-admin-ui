// import { Pipe, PipeTransform } from '@angular/core';
//
// @Pipe({
//   name: 'groupByKey',
// })
// export class GroupByKeyPipe implements PipeTransform {
//   public transform(arr: any[], key: string): { [key: any]: any[] } | {} {
//     const groupedByKey = {};
//
//     if (!arr || arr.length) {
//       return groupedByKey;
//     }
//
//     arr.forEach((obj) => {
//       if (obj.hasOwnProperty(key)) {
//         delete obj[key];
//
//         groupedByKey[key] = {
//           [key]: { ...obj },
//         };
//       }
//     });
//
//     return groupedByKey;
//   }
// }
