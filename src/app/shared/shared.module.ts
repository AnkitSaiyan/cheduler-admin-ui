import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DesignSystemCoreModule, DesignSystemModule, TableModule} from "diflexmo-angular-design";

@NgModule({
  declarations: [],
  imports: [
    CommonModule
  ],
  exports: [
    DesignSystemModule,
    DesignSystemCoreModule,
    TableModule
  ]
})
export class SharedModule {
}
