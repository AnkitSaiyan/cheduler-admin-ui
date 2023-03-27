import { Component, OnInit } from '@angular/core';
import { Tooltip } from 'bootstrap';
import { TranslateService } from '@ngx-translate/core';
import defaultLanguage from '../assets/i18n/nl-BE.json';
// import dutchLangauge from '../assets/i18n/nl-BE.json';

@Component({
  selector: 'dfm-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  constructor(public translate: TranslateService) {
    translate.addLangs(['en-BE', 'nl-BE']);
    translate.setTranslation('nl-BE', defaultLanguage);
    translate.setDefaultLang('nl-BE');
  }

  ngOnInit(): void {
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltipTriggerList.forEach((e) => new Tooltip(e));
  }

  // changeLanguage(value) {
  //   // eslint-disable-next-line eqeqeq
  //   if (value == 'en-BE') {
  //     this.translate.setTranslation(value, defaultLanguage);
  //     this.translate.setDefaultLang(value);
  //     // eslint-disable-next-line eqeqeq
  //   } else if (value == 'nl-BE') {
  //     this.translate.setTranslation(value, dutchLangauge);
  //     this.translate.setDefaultLang(value);
  //   }
  // }
}
