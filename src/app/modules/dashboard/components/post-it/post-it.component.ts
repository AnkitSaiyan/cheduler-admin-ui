import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, filter, switchMap, take, takeUntil } from 'rxjs';
import { DashboardApiService, PostIt } from 'src/app/core/services/dashboard-api.service';
import { ModalService } from 'src/app/core/services/modal.service';
import { NotificationDataService } from 'src/app/core/services/notification-data.service';
import { ShareDataService } from 'src/app/core/services/share-data.service';
import { ConfirmActionModalComponent, ConfirmActionModalData } from 'src/app/shared/components/confirm-action-modal.component';
import { DestroyableComponent } from 'src/app/shared/components/destroyable.component';
import { Translate } from 'src/app/shared/models/translate.model';
import { DUTCH_BE, ENG_BE, Statuses, StatusesNL } from '../../../../shared/utils/const';
import { AddPostComponent } from './add-post/add-post.component';
import { ViewPostComponent } from './view-post/view-post.component';

@Component({
  selector: 'dfm-post-it',
  templateUrl: './post-it.component.html',
  styleUrls: ['./post-it.component.scss'],
})
export class PostItComponent extends DestroyableComponent implements OnInit, OnDestroy {
  // public posts: any[] = [];
  // public posts = [
  //   {
  //     message: '',
  //     author: 'Kate Tanner',
  //     post: 'Cardiologist',
  //     postDate: new Date().setDate(new Date().getDate() - 3),
  //     avatar: '',
  //   },
  //   {
  //     message: '',
  //     author: 'Kate Tanner',
  //     post: 'Cardiologist',
  //     postDate: (new Date()).setDate((new Date).getDate() - 3),
  //     avatar: ''
  //   },
  //   {
  //     message: '',
  //     author: 'Kate Tanner',
  //     post: 'Cardiologist',
  //     postDate: (new Date()).setDate((new Date).getDate() - 3),
  //     avatar: ''
  //   },
  //   {
  //     message: '',
  //     author: 'Kate Tanner',
  //     post: 'Cardiologist',
  //     postDate: (new Date()).setDate((new Date).getDate() - 3),
  //     avatar: ''
  //   },
  //   {
  //     message: '',
  //     author: 'Kate Tanner',
  //     post: 'Cardiologist',
  //     postDate: (new Date()).setDate((new Date).getDate() - 3),
  //     avatar: ''
  //   },
  //   {
  //     message: '',
  //     author: 'Kate Tanner',
  //     post: 'Cardiologist',
  //     postDate: (new Date()).setDate((new Date).getDate() - 3),
  //     avatar: ''
  //   },{
  //     message: '',
  //     author: 'Kate Tanner',
  //     post: 'Cardiologist',
  //     postDate: (new Date()).setDate((new Date).getDate() - 3),
  //     avatar: ''
  //   },
  //   {
  //     message: '',
  //     author: 'Kate Tanner',
  //     post: 'Cardiologist',
  //     postDate: (new Date()).setDate((new Date).getDate() - 3),
  //     avatar: ''
  //   },
  //   {
  //     message: '',
  //     author: 'Kate Tanner',
  //     post: 'Cardiologist',
  //     postDate: (new Date()).setDate((new Date).getDate() - 3),
  //     avatar: ''
  //   },
  // ];

  public filteredPosts$$: BehaviorSubject<any[]>;
  private selectedLang: string = ENG_BE;
  public statuses = Statuses;

  postData!: PostIt[];

  constructor(
    private dashboardApiService: DashboardApiService,
    private formBuilder: FormBuilder,
    private modalSvc: ModalService,
    private notificationSvc: NotificationDataService,
    private ref: ChangeDetectorRef,
    private shareDataSvc: ShareDataService,
  ) {
    super();
    this.filteredPosts$$ = new BehaviorSubject<any[]>([]);
  }

  ngOnInit(): void {
    this.dashboardApiService.postItData$$.pipe(takeUntil(this.destroy$$)).subscribe((posts) => {
      this.filteredPosts$$.next(posts);
      this.postData = posts;
    });
    this.shareDataSvc
      .getLanguage$()
      .pipe(takeUntil(this.destroy$$))
      .subscribe((lang) => {
        this.selectedLang = lang;
        // eslint-disable-next-line default-case
        switch (lang) {
          case ENG_BE:
            this.statuses = Statuses;
            break;
          case DUTCH_BE:
            this.statuses = StatusesNL;
            break;
        }
      });
  }

  public addPost() {
    const dialogRef = this.modalSvc.open(AddPostComponent, {
      data: {
        titleText: 'Post It',
        confirmButtonText: 'Add',
        cancelButtonText: 'Cancel',
      } as ConfirmActionModalData,
    });

    dialogRef.closed
      .pipe(
        switchMap((message: string) => this.dashboardApiService.addPost(message)),
        take(1),
      )
      .subscribe((response) => {
        if (response) {
          this.notificationSvc.showNotification(Translate.SuccessMessage.PostAddedSuccessfully[this.selectedLang]);
          // this.filteredPosts$$.next([]);
          // this.ngOnInit();
        }
      });
  }

  public reomvePost(id: number) {
    const dialogRef = this.modalSvc.open(ConfirmActionModalComponent, {
      data: {
        titleText: 'Confirmation',
        bodyText: 'AreYouSureYouWantToDeleteThisPost',
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
      } as ConfirmActionModalData,
    });

    dialogRef.closed
      .pipe(
        filter((value) => !!value),
        switchMap(() => this.dashboardApiService.deletePost([id])),
        take(1),
      )
      .subscribe((response) => {
        if (response) {
          this.notificationSvc.showNotification(Translate.SuccessMessage.PostDeletedSuccessfully[this.selectedLang]);
          this.ngOnInit();
        }
      });
  }

  public openViewPostModal() {
    const dialogRef = this.modalSvc.open(ViewPostComponent, {
      data: {
        titleText: 'Post it',
        postData: this.postData,
      },
      options: {
        size: 'xl',
        centered: true,
        backdropClass: 'modal-backdrop-remove-mv',
        keyboard: false,
      },
    });

    dialogRef.closed
      .pipe(
        switchMap((messsage: string) => this.dashboardApiService.addPost(messsage)),
        take(1),
      )
      .subscribe((response) => {
        if (response) {
          this.notificationSvc.showNotification(Translate.SuccessMessage.PostAddedSuccessfully[this.selectedLang]);
        }
      });
  }
}
