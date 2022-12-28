import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DesignSystemCoreModule, DesignSystemModule, TableModule} from "diflexmo-angular-design";
import {NgChartsModule} from "ng2-charts";

@NgModule({
  declarations: [],
  imports: [
    CommonModule
  ],
  exports: [
    DesignSystemModule,
    DesignSystemCoreModule,
    TableModule,
    NgChartsModule,
  ]
})
export class SharedModule {
}
