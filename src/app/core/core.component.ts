import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { NavigationItem, NavigationItemEvent, NavigationProfileData, NavigationProfileLink, SelectItem } from 'diflexmo-angular-design';
import { TranslateService } from '@ngx-translate/core';
import { DestroyableComponent } from '../shared/components/destroyable.component';
import { DUTCH_BE, ENG_BE } from '../shared/utils/const';
import defaultLanguage from '../../assets/i18n/en-BE.json';
import dutchLangauge from '../../assets/i18n/nl-BE.json';
import { ShareDataService } from './services/share-data.service';
import { DashboardApiService } from './services/dashboard-api.service';

@Component({
  selector: 'dfm-main',
  templateUrl: './core.component.html',
  styleUrls: ['./core.component.scss'],
})
export class CoreComponent extends DestroyableComponent implements OnInit, OnDestroy {
  public navigationItems: NavigationItem[] = [
    new NavigationItem('Dashboard', 'home-03', '/dashboard', true),
    new NavigationItem('Appointment', 'file-06', '/appointment', false),
    new NavigationItem('Absence', 'user-x-01', '/absence', false),
    new NavigationItem('Configuration', 'tool-02', undefined, false, [
      new NavigationItem('User', 'user-circle', '/user', false),
      new NavigationItem('Rooms', 'building-01', '/room', false),
      new NavigationItem('Staff', 'user-01', '/staff', false),
      new NavigationItem('Physician', 'medical-circle', '/physician', false),
      new NavigationItem('Exam', 'microscope', '/exam', false),
      new NavigationItem('Practice Hours', 'clock', '/practice-hours', false),
      new NavigationItem('Priority Slots', 'calendar-date', '/priority-slots', false),
      new NavigationItem('Site Management', 'tool-01', '/site-management', false),
    ]),
  ];

  public navigationItemsNL: NavigationItem[] = [
    new NavigationItem('Dashboard', 'home-03', '/dashboard', true),
    new NavigationItem('Afspraak', 'file-06', '/appointment', false),
    new NavigationItem('Afwezigheid', 'user-x-01', '/absence', false),
    new NavigationItem('Configuratie', 'tool-02', undefined, false, [
      new NavigationItem('Gebruiker', 'user-circle', '/user', false),
      new NavigationItem('Zalen', 'building-01', '/room', false),
      new NavigationItem('Medewerkers', 'user-01', '/staff', false),
      new NavigationItem('Dokter', 'medical-circle', '/physician', false),
      new NavigationItem('Onderzoek', 'microscope', '/exam', false),
      new NavigationItem('Uren praktijk', 'clock', '/practice-hours', false),
      new NavigationItem('Prioritaire slots', 'calendar-date', '/priority-slots', false),
      new NavigationItem('Site Beheer', 'tool-01', '/site-management', false),
    ]),
  ];

  public notifications: NavigationItemEvent[] = [
    // new NavigationItemEvent('1', new Date(), 'Test notification 1'),
    // new NavigationItemEvent('2', new Date(), 'Test notification 2'),
    // new NavigationItemEvent('3', new Date(), 'Test notification 3'),
  ];

  public messages: NavigationItemEvent[] = [
    // new NavigationItemEvent('1', new Date(), 'Test Message 1'),
    // new NavigationItemEvent('2', new Date(), 'Test Message 2'),
    // new NavigationItemEvent('3', new Date(), 'Test Message 3'),
  ];

  public currentTenant: string = 'en-BE';

  public languages: SelectItem[] = [
    { name: 'EN', value: ENG_BE },
    { name: 'NL', value: DUTCH_BE },
  ];

  public profileData: NavigationProfileData = {
    user: {
      name: 'Profile',
      email: 'test@dfm.com',
      avatar: '',
    },
    links: [new NavigationProfileLink('Test Link', './', '', true)],
  };

  isDutchLanguage: boolean = false;

  constructor(
    private translateService: TranslateService,
    private dataShareService: ShareDataService,
    private dashboardApiService: DashboardApiService,
  ) {
    super();
  }

  public ngOnInit(): void {
    this.dataShareService.getLanguage$().subscribe((language: string) => {
      this.profileData.user.name = language === ENG_BE ? 'Profile' : 'Profiel';
    });
    this.dashboardApiService.notificationData$$.subscribe((res) => {
      this.notifications = [];
      res.forEach((element) => {
        this.notifications.push(new NavigationItemEvent('1', new Date(element?.date), element?.message, element?.title, element?.subTitle));
      });
    });

    this.dashboardApiService.postItData$$.subscribe((res) => {
      this.messages = [];
      res.forEach((element) => {
        this.messages.push(new NavigationItemEvent('1', new Date(element?.createdAt), element?.message));
      });
    });
  }

  public override ngOnDestroy() {
    super.ngOnDestroy();
  }

  public onLanguageChange(lang: string) {
    // eslint-disable-next-line eqeqeq
    this.dataShareService.setLanguage(lang);
    if (lang == ENG_BE) {
      this.isDutchLanguage = false;
      this.translateService.setTranslation(lang, defaultLanguage);
      this.translateService.setDefaultLang(lang);
      // eslint-disable-next-line eqeqeq
    } else if (lang == DUTCH_BE) {
      this.isDutchLanguage = true;
      this.translateService.setTranslation(lang, dutchLangauge);
      this.translateService.setDefaultLang(lang);
    }
  }
}
