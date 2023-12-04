import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, combineLatest, map, Observable, of, startWith, switchMap, takeLast, takeUntil } from 'rxjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as Excel from 'exceljs';
import { Translate } from '../../shared/models/translate.model';
import { ShareDataService } from './share-data.service';
import { DestroyableComponent } from '../../shared/components/destroyable.component';

export type DownloadAsType = 'CSV' | 'XLSX' | 'PDF' | 'PRINT';

export interface DownloadType {
	name: string;
	value: DownloadAsType;
	description: string;
}

@Injectable({
	providedIn: 'root',
})
export class DownloadService extends DestroyableComponent implements OnDestroy {
	private downloadItems: DownloadType[] = [
		{
			name: 'CSV',
			value: 'CSV',
			description: 'Download as CSV',
		},
		{
			name: 'Excel',
			value: 'XLSX',
			description: 'Download as Excel',
		},
		{
			name: 'PDF',
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
		XLSX: (file: string): Blob => new Blob([file], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
	};

	private selectedLang$$ = new BehaviorSubject<string>('');

	constructor(private shareDataSvc: ShareDataService) {
		super();
		this.shareDataSvc
			.getLanguage$()
			.pipe(takeUntil(this.destroy$$))
			.subscribe({
				next: (lang) => this.selectedLang$$.next(lang),
			});
	}

	public override ngOnDestroy() {
		super.ngOnDestroy();
	}

	get fileTypes$(): Observable<DownloadType[]> {
		return combineLatest([this.selectedLang$$.pipe(startWith(''))]).pipe(
			switchMap(([lang]) => {
				return of(this.downloadItems).pipe(
					map((downloadTypeItems) => {
						if (lang) {
							return downloadTypeItems.map((downloadType) => {
								return {
									...downloadType,
									name: Translate[downloadType.name][lang],
								};
							});
						}
						return downloadTypeItems;
					}),
				);
			}),
		);
	}

	public downloadJsonAs(downloadAs: DownloadAsType, headers: string[], data: string[][], filename = 'data'): void {
		switch (downloadAs) {
			case 'CSV':
				this.download(this.generateCSV(headers, data), downloadAs, `${filename}.csv`);
				break;
			case 'PDF':
				this.generatePDF(headers, data, filename);
				break;
			case 'XLSX':
				this.generateExcel(headers, data).then((file) => {
					this.download(file, downloadAs, `${filename}_${new Date().toString()}.xlsx`);
				});
				break;
			case 'PRINT':
				this.printPDF(headers, data);
				break;
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
			data.forEach((row) => (csv += `${row.map((v) => `"${v}"`).join(',')}\n`));
		}

		return csv;
	}

	private generatePDF(headers: string[], data: string[][], filename: string) {
		// eslint-disable-next-line new-cap
		const pdf = new jsPDF();
		autoTable(pdf, {
			head: [headers],
			body: data,
		});

		pdf.save(`${filename}.pdf`);
	}

	private async generateExcel(headers: string[], data: string[][]) {
		const workBook = new Excel.Workbook();

		workBook.created = new Date();
		const workSheet = workBook.addWorksheet();

		const headerIndex = 1;

		headers.forEach((header, index) => {
			workSheet.getRow(headerIndex).getCell(index + 1).value = header;
		});

		// eslint-disable-next-line no-restricted-syntax
		for (const column of workSheet.columns) {
			column.width = 20;
		}

		data.forEach((row) => {
			workSheet.addRow(row);
		});

		return workBook.xlsx.writeBuffer();
	}

	private download(file: any, type: DownloadAsType, filename: string) {
		const anchorElement = document.createElement('a');

		anchorElement.href = URL.createObjectURL(this.href[type](file));
		anchorElement.target = '_blank';
		anchorElement.download = filename;
		anchorElement.classList.add('hidden');

		document.body.appendChild(anchorElement);

		anchorElement.click();

		document.body.removeChild(anchorElement);
	}

	private printPDF(headers: string[], data: string[][]) {
		// eslint-disable-next-line new-cap
		const pdf = new jsPDF();

		autoTable(pdf, {
			head: [headers],
			body: data,
		});

		pdf.autoPrint();
		pdf.output('dataurlnewwindow');
	}
}
