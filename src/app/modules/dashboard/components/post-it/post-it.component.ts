import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, filter, switchMap, take, takeUntil } from 'rxjs';
import { DashboardApiService, PostIt } from 'src/app/core/services/dashboard-api.service';
import { ModalService } from 'src/app/core/services/modal.service';
import { NotificationDataService } from 'src/app/core/services/notification-data.service';
import { ConfirmActionModalComponent, DialogData } from 'src/app/shared/components/confirm-action-modal.component';
import { DestroyableComponent } from 'src/app/shared/components/destroyable.component';
import { AddPostComponent } from './add-post/add-post.component';

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

  private posts$$: BehaviorSubject<any[]>;

  public filteredPosts$$: BehaviorSubject<any[]>;

  constructor(private dashboardApiService: DashboardApiService, private formBuilder: FormBuilder, private modalSvc: ModalService, private notificationSvc: NotificationDataService) {
    super();
    this.posts$$ = new BehaviorSubject<any[]>([]);
    this.filteredPosts$$ = new BehaviorSubject<any[]>([]);
  }

  ngOnInit(): void {
    this.dashboardApiService.posts$.pipe(takeUntil(this.destroy$$)).subscribe((posts) => {
      console.log('posts: ', posts);
      this.posts$$.next(posts);
      this.filteredPosts$$.next(posts);
    });
  }

  public addPost() {
    const dialogRef = this.modalSvc.open(AddPostComponent, {
      data: {
        titleText: 'Post it',
        confirmButtonText: 'Add',
        cancelButtonText: 'Cancel',
      } as DialogData,
    });

    dialogRef.closed
      .pipe(
        switchMap((response: string)=>this.dashboardApiService.addPost({message: response})),
        take(1),
      )
      .subscribe((response)=>{
          if (response) {
            this.notificationSvc.showNotification('Post Added successfully');
          }
        });
  }

  public reomvePost(id: number) {
    console.log('id: ', id);
    const dialogRef = this.modalSvc.open(ConfirmActionModalComponent, {
      data: {
        titleText: 'Confirmation',
        bodyText: 'Are you sure you want to delete this Post?',
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
      } as DialogData,
    });

    dialogRef.closed
      .pipe(
        switchMap(()=>this.dashboardApiService.deletePost(id)),
        take(1),
      )
      .subscribe((response)=>{
          console.log('response: ', response);
          if (response) {
            this.notificationSvc.showNotification('Post deleted successfully');
          }
        });
  }
}
