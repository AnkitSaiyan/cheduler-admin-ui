import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NotificationService } from 'diflexmo-angular-design';
import { Router } from '@angular/router';
import { takeUntil } from 'rxjs';
import { RouterStateService } from './services/router-state.service';
import { DestroyableComponent } from '../shared/components/destroyable.component';

@Component({
  selector: 'dfm-main',
  templateUrl: './core.component.html',
  styleUrls: ['./core.component.scss'],
})
export class CoreComponent extends DestroyableComponent implements OnInit, OnDestroy {
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
    'Site Management': 'tool-02',
    'Practice Hours': 'clock',
    user: 'user-01',
    exams: 'user-x-01',
  };

  constructor(private notificationSvc: NotificationService, private routerStateSvc: RouterStateService) {
    super();
  }

  public ngOnInit(): void {
    this.routerStateSvc
      .listenForUrlChange$()
      .pipe(takeUntil(this.destroy$$))
      .subscribe((url) => this.updateNavBar(url));
  }

  public override ngOnDestroy() {
    super.ngOnDestroy();
  }

  private updateNavBar(url: string) {
    const currentRouteName = url.split('/')[1];

    if (this.notConfigurationRoutes.includes(currentRouteName)) {
      this.configurationMenuTitle = 'Configuration';
    } else {
      switch (currentRouteName) {
        case 'site-management':
        case 'practice-hours':
          this.configurationMenuTitle = currentRouteName
            .split('-')
            .map((text) => `${text[0].toUpperCase()}${text.slice(1)}`)
            .join(' ');
          break;
        default:
          this.configurationMenuTitle = currentRouteName;
      }
    }

    this.configurationMenuIconName = this.navTitleToIconObj[currentRouteName] ?? 'tool-02';
  }

  public toggleMenu(e: MouseEvent, reset = false) {
    // console.log('in', reset);
    const el = this.configMenu?.nativeElement as HTMLDivElement;
    if (reset) {
      if (!el.className.includes('hidden')) {
        el.classList.add('hidden');
      }
    } else {
      e.stopPropagation();
      e.stopImmediatePropagation();
      el.classList.toggle('hidden');
      // console.log(el.classList);
    }

    const config = this.configMenu?.nativeElement as HTMLDivElement;
    if (!this.notConfigurationRoutes.includes(this.configurationMenuTitle)) {
      // console.log(config);
      config.classList.add('nav-item-selected-bg');
    } else {
      config.classList.remove('nav-item-selected-bg');
    }
  }
}
