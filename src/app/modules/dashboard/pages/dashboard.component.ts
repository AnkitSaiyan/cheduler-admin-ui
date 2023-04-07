import {Component} from '@angular/core';

@Component({
    selector: 'dfm-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent {
    public handleClick() {
        document.querySelector('#top')?.scrollIntoView({block: 'start', behavior: 'smooth'});
    }
}
