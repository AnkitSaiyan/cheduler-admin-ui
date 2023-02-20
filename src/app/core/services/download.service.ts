import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export type DownloadAsType = 'CSV' | 'XLS' | 'PDF' | 'PRINT';

export interface DownloadType {
  name: string;
  value: DownloadAsType;
  description: string;
}

@Injectable({
  providedIn: 'root',
})
export class DownloadService {
  private downloadItems: DownloadType[] = [
    {
      name: 'CSV',
      value: 'CSV',
      description: 'Download as CSV',
    },
    {
      name: 'Excel',
      value: 'XLS',
      description: 'Download as Excel',
    },
    {
      name: 'Pdf',
      value: 'PDF',
      description: 'Download as PDF',
    },
    {
      name: 'Print',
      value: 'PRINT',
      description: 'Print appointments',
    },
  ];

  private href = {
    CSV: (textFile: string): Blob => new Blob([textFile], { type: 'data:text/csv;charset=utf-8' }),
    // XLS: (file: string) => `data:application/vnd.openxmlformats-ficedocument.spreadsheetml.sheet, ${encodeURIComponent(file)}`,
  };

  constructor() {}

  get fileTypes$(): Observable<any[]> {
    return of(this.downloadItems);
  }

  public downloadJsonAs(downloadAs: DownloadAsType, headers: string[], data: string[][], filename = 'data'): void {
    switch (downloadAs) {
      case 'CSV':
        this.download(this.generateCSV(headers, data), downloadAs, `${filename}.csv`);
        break;
      // case 'XLS':
      //   this.download(this.generateCSV(headers, data), downloadAs, `${filename}.xls`);
      //   break;
      default:
        break;
    }
  }

  private generateCSV(headers: string[], data: string[][]): string {
    let csv: string = '';

    if (!headers.length) {
      return '';
    }

    headers.forEach((title, index) => {
      if (title && title.length) {
        csv += `${title[0]}${title.slice(1)}`;
      }

      if (index < headers.length - 1) {
        csv += ',';
      }
    });

    csv += '\n';

    if (data.length) {
      data.forEach((row) => (csv += `${row.join(',')}\n`));
    }

    return csv;
  }

  private download(file: string, type: DownloadAsType, filename: string) {
    const anchorElement = document.createElement('a');

    anchorElement.href = URL.createObjectURL(this.href[type](file));
    anchorElement.target = '_blank';
    anchorElement.download = filename;
    anchorElement.classList.add('hidden');

    document.body.appendChild(anchorElement);

    anchorElement.click();

    document.body.removeChild(anchorElement);
  }
}
