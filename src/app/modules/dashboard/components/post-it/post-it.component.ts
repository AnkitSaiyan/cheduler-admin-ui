import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, takeUntil } from 'rxjs';
import { DashboardApiService, PostIt } from 'src/app/core/services/dashboard-api.service';
import { DestroyableComponent } from 'src/app/shared/components/destroyable.component';

@Component({
  selector: 'dfm-post-it',
  templateUrl: './post-it.component.html',
  styleUrls: ['./post-it.component.scss'],
})
export class PostItComponent extends DestroyableComponent implements OnInit, OnDestroy {
  postItForm!: FormGroup;
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

  constructor(private dashboardApiService: DashboardApiService, private formBuilder: FormBuilder) {
    super();
    this.posts$$ = new BehaviorSubject<any[]>([]);
    this.filteredPosts$$ = new BehaviorSubject<any[]>([]);
  }

  ngOnInit(): void {
    this.createPostItForm();
    this.dashboardApiService.posts$.pipe(takeUntil(this.destroy$$)).subscribe((posts) => {
      console.log('posts: ', posts);
      this.posts$$.next(posts);
      this.filteredPosts$$.next(posts);
    });
  }

  createPostItForm(){
    this.postItForm = this.formBuilder.group({
      message: ['']
    })
  }
}
