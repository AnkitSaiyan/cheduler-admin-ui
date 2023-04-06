import { AfterViewInit, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { NavigationItem, NavigationItemEvent, NavigationProfileData, NavigationProfileLink, SelectItem } from 'diflexmo-angular-design';
import { TranslateService } from '@ngx-translate/core';
import { DestroyableComponent } from '../shared/components/destroyable.component';
import { DUTCH_BE, ENG_BE } from '../shared/utils/const';
import englishLanguage from '../../assets/i18n/en-BE.json';
import dutchLangauge from '../../assets/i18n/nl-BE.json';
import { ShareDataService } from './services/share-data.service';
import { DashboardApiService } from './services/dashboard-api.service';
import { LoaderService } from './services/loader.service';
import { BehaviorSubject, combineLatest, Subject, takeUntil } from 'rxjs';
import { MsalGuardConfiguration, MsalService, MSAL_GUARD_CONFIG } from '@azure/msal-angular';
import { InteractionType } from '@azure/msal-browser';
import { UserApiService } from './services/user-api.service';
import { Translate } from '../shared/models/translate.model';
import { PermissionService } from './services/permission.service';
import { UserRoleEnum } from '../shared/models/user.model';
import {DateTimeUtils} from "../shared/utils/date-time.utils";

@Component({
  selector: 'dfm-main',
  templateUrl: './core.component.html',
  styleUrls: ['./core.component.scss'],
})
export class CoreComponent extends DestroyableComponent implements OnInit, OnDestroy, AfterViewInit {
  private navigationItems: NavigationItem[] = [
    new NavigationItem('Dashboard', 'home-03', '/dashboard', false),
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
      new NavigationItem('E-mail Template', 'mail-05', '/email-template', false),
      new NavigationItem('Site Management', 'tool-01', '/site-management', false),
    ]),
  ];

  private readerNavigationItems: NavigationItem[] = [
    new NavigationItem('Dashboard', 'home-03', '/dashboard', false),
    new NavigationItem('Appointment', 'file-06', '/appointment', false),
    new NavigationItem('Absence', 'user-x-01', '/absence', false),
    new NavigationItem('Configuration', 'tool-02', undefined, false, [
      new NavigationItem('User', 'user-circle', '/user', false),
      new NavigationItem('Rooms', 'building-01', '/room', false),
      new NavigationItem('Staff', 'user-01', '/staff', false),
      new NavigationItem('Physician', 'medical-circle', '/physician', false),
      new NavigationItem('Exam', 'microscope', '/exam', false),
      new NavigationItem('Priority Slots', 'calendar-date', '/priority-slots', false),
      new NavigationItem('E-mail Template', 'mail-05', '/email-template', false),
    ]),
  ];

  private navigationItemsNL: NavigationItem[] = [
    new NavigationItem('Dashboard', 'home-03', '/dashboard', false),
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
      new NavigationItem('E-mail Sjabloon', 'mail-05', '/email-template', false),
      new NavigationItem('Site Beheer', 'tool-01', '/site-management', false),
    ]),
  ];

  private readerNavigationItemsNL: NavigationItem[] = [
    new NavigationItem('Dashboard', 'home-03', '/dashboard', false),
    new NavigationItem('Afspraak', 'file-06', '/appointment', false),
    new NavigationItem('Afwezigheid', 'user-x-01', '/absence', false),
    new NavigationItem('Configuratie', 'tool-02', undefined, false, [
      new NavigationItem('Gebruiker', 'user-circle', '/user', false),
      new NavigationItem('Zalen', 'building-01', '/room', false),
      new NavigationItem('Medewerkers', 'user-01', '/staff', false),
      new NavigationItem('Dokter', 'medical-circle', '/physician', false),
      new NavigationItem('Onderzoek', 'microscope', '/exam', false),
      new NavigationItem('Prioritaire slots', 'calendar-date', '/priority-slots', false),
      new NavigationItem('E-mail Sjabloon', 'mail-05', '/email-template', false),
    ]),
  ];

  public notifications: NavigationItemEvent[] = [];

  public messages: NavigationItemEvent[] = [];

  public currentTenant$$ = new BehaviorSubject<string>('nl-BE');

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

  public isLoaderActive$$ = new Subject<boolean>();

  public navItems: NavigationItem[] = [];

  constructor(
    @Inject(MSAL_GUARD_CONFIG) private msalGuardConfig: MsalGuardConfiguration,
    private translateService: TranslateService,
    public dataShareService: ShareDataService,
    private dashboardApiService: DashboardApiService,
    public loaderService: LoaderService,
    private cdr: ChangeDetectorRef,
    private authService: MsalService,
    private userApiSvc: UserApiService,
    private permissionSvc: PermissionService,
  ) {
    super();
  }

  public ngOnInit(): void {
    // translation changes should go here
    combineLatest([this.currentTenant$$, this.permissionSvc.permissionType$])
      .pipe(takeUntil(this.destroy$$))
      .subscribe({
        next: ([lang, permissionType]) => {
          this.profileData.user.name = Translate.Profile[lang];
          // eslint-disable-next-line default-case
          switch (lang) {
            case ENG_BE: {
              if (permissionType === UserRoleEnum.Reader) {
                this.navItems = [...this.readerNavigationItems];
                break;
              }
              this.navItems = [...this.navigationItems];
              break;
            }
            case DUTCH_BE: {
              if (permissionType === UserRoleEnum.Reader) {
                this.navItems = [...this.readerNavigationItemsNL];
                break;
              }
              this.navItems = [...this.navigationItemsNL];
              break;
            }
          }
        }
      });

    this.dataShareService
      .getLanguage$()
      .pipe(takeUntil(this.destroy$$))
      .subscribe({
        next: (language: string) => this.currentTenant$$.next(language)
      });

    this.dashboardApiService.notificationData$$.pipe(takeUntil(this.destroy$$)).subscribe({
      next: (res) => {
        this.notifications = [];
        res.forEach((element, index) => {
          this.notifications.push(new NavigationItemEvent(index + 1, DateTimeUtils.UTCToLocalDateString(element?.date), element?.title, element?.message));
        });
      }
    });

    this.dashboardApiService.postItData$$.pipe(takeUntil(this.destroy$$)).subscribe({
      next: (res) => {
        this.messages = [];
        res.forEach((element, index) => {
          this.messages.push(new NavigationItemEvent(index + 1, DateTimeUtils.UTCToLocalDateString(element?.createdAt), element?.message));
        });
      }
    });
  }

  public ngAfterViewInit(): void {
    this.loaderService.isActive$.pipe(takeUntil(this.destroy$$)).subscribe({
      next: (value) => {
        this.isLoaderActive$$.next(value);
        this.cdr.detectChanges();
      }
    });
  }

  public override ngOnDestroy() {
    super.ngOnDestroy();
  }

  public onLanguageChange(lang: string) {
    // eslint-disable-next-line eqeqeq
    this.dataShareService.setLanguage(lang);
    if (lang == ENG_BE) {
      this.translateService.setTranslation(lang, englishLanguage);
      this.translateService.setDefaultLang(lang);
      // eslint-disable-next-line eqeqeq
    } else if (lang == DUTCH_BE) {
      this.translateService.setTranslation(lang, dutchLangauge);
      this.translateService.setDefaultLang(lang);
    }
  }

  public logout() {
    if (this.msalGuardConfig.interactionType === InteractionType.Popup) {
      this.authService.logoutPopup({
        mainWindowRedirectUri: '/',
      });
    } else {
      this.authService.logoutRedirect();
    }
    this.userApiSvc.removeUser();
  }
}
