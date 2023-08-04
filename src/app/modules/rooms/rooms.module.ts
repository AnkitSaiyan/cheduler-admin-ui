import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RoomsRoutingModule } from './rooms-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { RoomListComponent } from './components/room-list/room-list.component';
import { RoomsComponent } from './pages/rooms.component';
import { AddRoomModalComponent } from './components/add-room-modal/add-room-modal.component';
import { ViewRoomComponent } from './components/view-room/view-room.component';
import {InfiniteScrollModule} from "ngx-infinite-scroll";

@NgModule({
  declarations: [RoomsComponent, RoomListComponent, AddRoomModalComponent, ViewRoomComponent],
    imports: [CommonModule, RoomsRoutingModule, SharedModule, ReactiveFormsModule, InfiniteScrollModule],
})
export class RoomsModule {}
