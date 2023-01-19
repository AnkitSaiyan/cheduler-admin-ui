import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { NotificationService } from 'diflexmo-angular-design';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'dfm-main',
  templateUrl: './core.component.html',
  styleUrls: ['./core.component.scss'],
})
export class CoreComponent implements OnInit {
  @ViewChild('configurationMenu') private configMenu!: ElementRef;

  @ViewChild('configuration') private configBtn!: ElementRef;

  @HostListener('document:click', ['$event']) onClick(e: MouseEvent) {
    this.toggleMenu(e, true);
  }

  @HostListener('document:scroll') onScroll(e: Event): void {
    console.log(e);
  }

  @HostListener('scroll') onScrollHost(e: Event): void {
    console.log(e);
  }

  public configurationMenuTitle = 'Configuration';

  public configurationMenuIconName = 'tool-02';

  public notConfigurationRoutes = ['dashboard', 'appointment', 'absence', ''];

  public navTitleToIconObj = {
    staff: 'user-01',
    room: 'building-01',
    physician: 'medical-circle',
    'site-management': 'tool-02',
    'practice-hours': 'clock',
    user: 'user-01',
    exams: 'user-x-01',
  };

  constructor(private notificationSvc: NotificationService, private router: Router) {}

  public ngOnInit(): void {
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      const { snapshot } = this.router.routerState;
      const currentRouteName = snapshot.url.split('/')[1];

      if (this.notConfigurationRoutes.includes(currentRouteName)) {
        this.configurationMenuTitle = 'Configuration';
      } else {
        this.configurationMenuTitle = currentRouteName;
      }

      this.configurationMenuIconName = this.navTitleToIconObj[currentRouteName] ?? 'tool-02';
    });
  }

  public toggleMenu(e: MouseEvent, reset = false) {
    console.log('in', reset);
    const el = this.configMenu?.nativeElement as HTMLDivElement;
    if (reset) {
      if (!el.className.includes('hidden')) {
        el.classList.add('hidden');
      }
    } else {
      e.stopPropagation();
      e.stopImmediatePropagation();
      el.classList.toggle('hidden');
      console.log(el.classList);
    }

    const config = this.configMenu?.nativeElement as HTMLDivElement;
    if (!this.notConfigurationRoutes.includes(this.configurationMenuTitle)) {
      console.log(config);
      config.classList.add('nav-item-selected-bg');
    } else {
      config.classList.remove('nav-item-selected-bg');
    }
  }
}
