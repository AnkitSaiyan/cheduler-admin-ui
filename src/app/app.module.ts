import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { DesignSystemCoreModule } from 'diflexmo-angular-design';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, ReactiveFormsModule, FormsModule, AppRoutingModule, HttpClientModule, DesignSystemCoreModule],
  bootstrap: [AppComponent],
})
export class AppModule {}
