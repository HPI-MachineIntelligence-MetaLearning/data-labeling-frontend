import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { MatButtonModule, MatCheckboxModule } from '@angular/material';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import $ from 'jquery';
import { HttpClientService } from './http-client.service';
import { RouterModule, Routes, ActivatedRoute } from '@angular/router';

import { HttpModule } from '@angular/http';
import { LoadingModule } from 'ngx-loading';


import { AppComponent } from './app.component';


@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    MatButtonModule,
    MatCheckboxModule,
    NoopAnimationsModule,
    HttpModule,
    LoadingModule
  ],
  providers: [HttpClientService],
  bootstrap: [AppComponent]
})
export class AppModule { }
