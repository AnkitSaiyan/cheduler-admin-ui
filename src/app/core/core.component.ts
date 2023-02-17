import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  NavigationItem,
  NavigationItemEvent,
  NavigationProfileData,
  NavigationProfileLink,
  NotificationService,
  SelectItem,
} from 'diflexmo-angular-design';
import { takeUntil } from 'rxjs';
import { RouterStateService } from './services/router-state.service';
import { DestroyableComponent } from '../shared/components/destroyable.component';

@Component({
  selector: 'dfm-main',
  templateUrl: './core.component.html',
  styleUrls: ['./core.component.scss'],
})
export class CoreComponent extends DestroyableComponent implements OnInit, OnDestroy {
  // @ViewChild('configurationMenu') private configMenu!: ElementRef;
  //
  // @ViewChild('configuration') private configBtn!: ElementRef;

  // @HostListener('document:click', ['$event']) onClick(e: MouseEvent) {
  //   this.toggleMenu(e, true);
  // }

  // @HostListener('document:scroll') onScroll(e: Event): void {
  //   console.log(e);
  // }
  //
  // @HostListener('scroll') onScrollHost(e: Event): void {
  //   console.log(e);
  // }

  // public configurationMenuTitle = 'Configuration';
  //
  // public configurationMenuIconName = 'tool-02';
  //
  // public notConfigurationRoutes = ['dashboard', 'appointment', 'absence', ''];
  //
  // public navTitleToIconObj = {
  //   staff: 'user-01',
  //   room: 'building-01',
  //   physician: 'medical-circle',
  //   'Site Management': 'tool-02',
  //   'Practice Hours': 'clock',
  //   user: 'user-01',
  //   exams: 'user-x-01',
  // };

  public navigationItems: NavigationItem[] = [
    new NavigationItem('Dashboard', 'home-03', '/dashboard', true),
    new NavigationItem('Appointment', 'file-06', '/appointment', false),
    new NavigationItem('Absence', 'user-01', '/absence', false),
    new NavigationItem('Configuration', 'tool-02', undefined, false, [
      new NavigationItem('User', 'clock', '/user', false),
      new NavigationItem('Rooms', 'building-01', '/room', false),
      new NavigationItem('Staff', 'user-01', '/staff', false),
      new NavigationItem('Physician', 'medical-circle', '/physician', false),
      new NavigationItem('Site Management', 'tool-02', '/site-management', false),
      new NavigationItem('Practice Hours', 'clock', '/practice-hours', false),
    ]),
  ];

  public notifications: NavigationItemEvent[] = [
    new NavigationItemEvent('1', new Date(), 'Test notification 1'),
    new NavigationItemEvent('2', new Date(), 'Test notification 2'),
    new NavigationItemEvent('3', new Date(), 'Test notification 3'),
  ];

  public messages: NavigationItemEvent[] = [
    new NavigationItemEvent('1', new Date(), 'Test Message 1'),
    new NavigationItemEvent('2', new Date(), 'Test Message 2'),
    new NavigationItemEvent('3', new Date(), 'Test Message 3'),
  ];

  public currentTenant: string = 'EN';

  public tenants: SelectItem[] = [
    { name: 'EN', value: 'EN' },
    { name: 'NL', value: 'NL' },
  ];

  public profileData: NavigationProfileData = {
    user: {
      name: 'Profile',
      email: 'test@dfm.com',
      avatar: '',
    },
    links: [new NavigationProfileLink('Test Link', './', '', true)],
  };

  constructor(private notificationSvc: NotificationService, private routerStateSvc: RouterStateService) {
    super();
  }

  public ngOnInit(): void {
    // this.routerStateSvc
    //   .listenForUrlChange$()
    //   .pipe(takeUntil(this.destroy$$))
    //   .subscribe((url) => this.updateNavBar(url));
  }

  public override ngOnDestroy() {
    super.ngOnDestroy();
  }

  private updateNavBar(url: string) {
    // const currentRouteName = url.split('/')[1];
    // if (this.notConfigurationRoutes.includes(currentRouteName)) {
    //   this.configurationMenuTitle = 'Configuration';
    // } else {
    //   switch (currentRouteName) {
    //     case 'site-management':
    //     case 'practice-hours':
    //       this.configurationMenuTitle = currentRouteName
    //         .split('-')
    //         .map((text) => `${text[0].toUpperCase()}${text.slice(1)}`)
    //         .join(' ');
    //       break;
    //     default:
    //       this.configurationMenuTitle = currentRouteName;
    //   }
    // }
    // this.configurationMenuIconName = this.navTitleToIconObj[currentRouteName] ?? 'tool-02';
  }

  // public toggleMenu(e: MouseEvent, reset = false) {
  //   // console.log('in', reset);
  //   const el = this.configMenu?.nativeElement as HTMLDivElement;
  //   if (reset) {
  //     if (!el.className.includes('hidden')) {
  //       el.classList.add('hidden');
  //     }
  //   } else {
  //     e.stopPropagation();
  //     e.stopImmediatePropagation();
  //     el.classList.toggle('hidden');
  //     // console.log(el.classList);
  //   }
  //
  //   const config = this.configMenu?.nativeElement as HTMLDivElement;
  //   if (!this.notConfigurationRoutes.includes(this.configurationMenuTitle)) {
  //     // console.log(config);
  //     config.classList.add('nav-item-selected-bg');
  //   } else {
  //     config.classList.remove('nav-item-selected-bg');
  //   }
  // }
}
