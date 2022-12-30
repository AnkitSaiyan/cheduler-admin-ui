import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'dfm-post-it',
  templateUrl: './post-it.component.html',
  styleUrls: ['./post-it.component.scss'],
})
export class PostItComponent implements OnInit {
  public posts = [
    {
      message: '',
      author: 'Kate Tanner',
      post: 'Cardiologist',
      postDate: new Date().setDate(new Date().getDate() - 3),
      avatar: '',
    },
    {
      message: '',
      author: 'Kate Tanner',
      post: 'Cardiologist',
      postDate: (new Date()).setDate((new Date).getDate() - 3),
      avatar: ''
    },
    {
      message: '',
      author: 'Kate Tanner',
      post: 'Cardiologist',
      postDate: (new Date()).setDate((new Date).getDate() - 3),
      avatar: ''
    },
    {
      message: '',
      author: 'Kate Tanner',
      post: 'Cardiologist',
      postDate: (new Date()).setDate((new Date).getDate() - 3),
      avatar: ''
    },
    {
      message: '',
      author: 'Kate Tanner',
      post: 'Cardiologist',
      postDate: (new Date()).setDate((new Date).getDate() - 3),
      avatar: ''
    },
    {
      message: '',
      author: 'Kate Tanner',
      post: 'Cardiologist',
      postDate: (new Date()).setDate((new Date).getDate() - 3),
      avatar: ''
    },{
      message: '',
      author: 'Kate Tanner',
      post: 'Cardiologist',
      postDate: (new Date()).setDate((new Date).getDate() - 3),
      avatar: ''
    },
    {
      message: '',
      author: 'Kate Tanner',
      post: 'Cardiologist',
      postDate: (new Date()).setDate((new Date).getDate() - 3),
      avatar: ''
    },
    {
      message: '',
      author: 'Kate Tanner',
      post: 'Cardiologist',
      postDate: (new Date()).setDate((new Date).getDate() - 3),
      avatar: ''
    },
  ];

  constructor() {}

  ngOnInit(): void {}
}
