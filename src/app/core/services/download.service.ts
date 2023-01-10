import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DownloadService {
  private downloadItems = [
    {
      name: 'CSV',
      value: 'csv',
      description: 'Download as CSV',
    },
    {
      name: 'Excel',
      value: 'xls',
      description: 'Download as Excel',
    },
    {
      name: 'Pdf',
      value: 'pdf',
      description: 'Download as PDF',
    },
    {
      name: 'Print',
      value: 'print',
      description: 'Print appointments',
    },
  ];

  constructor() {}

  get fileTypes$(): Observable<any[]> {
    return of(this.downloadItems);
  }
}
