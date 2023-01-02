import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'dfm-top-examinations',
  templateUrl: './top-examinations.component.html',
  styleUrls: ['./top-examinations.component.scss'],
})
export class TopExaminationsComponent implements OnInit {
  public topExaminations: string[] = [
    'Maatname',
    'Levering steunzolen',
    'Anpassing steunzolen',
    'Kinebehandeling',
    'Loopanalyse',
    'Maatname',
    'Levering steunzolen',
    'Anpassing steunzolen',
    'Kinebehandeling',
    'Loopanalyse',
    'X-ray',
  ];

  public ngOnInit(): void {}
}
