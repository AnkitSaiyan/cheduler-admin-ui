import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RoomsComponent } from './pages/rooms.component';
import { RoomListComponent } from './components/room-list/room-list.component';
import { ROOM_ID } from '../../shared/utils/const';
import { ViewRoomComponent } from './components/view-room/view-room.component';

const roomRoutes: Routes = [
  {
    path: '',
    component: RoomsComponent,
    children: [
      {
        path: '',
        component: RoomListComponent,
      },
      {
        path: `:${ROOM_ID}/view`,
        component: ViewRoomComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(roomRoutes)],
  exports: [RouterModule],
})
export class RoomsRoutingModule {}
