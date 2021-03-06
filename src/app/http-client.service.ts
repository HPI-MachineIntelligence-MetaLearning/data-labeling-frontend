import { Injectable } from '@angular/core';
import { Http, Headers, Response, Request, RequestMethod, URLSearchParams, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import $ from 'jquery';

@Injectable()
export class HttpClientService {
  requestUrl: string;
  responseData: any;
  handleError: any;

  constructor(private http: Http,
  ) {
    this.http = http;
  }

  postWithFile(url: string, postData: any, files: File[]) {

    const headers = new Headers();
    const formData: FormData = new FormData();

    Array.from(files).forEach(file => {
      formData.append('image', file, file['name']);
    });

    if (postData !== '' && postData !== undefined && postData !== null) {
      for (const property in postData) {
        if (postData.hasOwnProperty(property)) {
          formData.append(property, postData[property]);
        }
      }
    }
    const returnReponse = new Promise((resolve, reject) => {
      this.http.post(url, formData, {
        headers: headers
      }).subscribe(
        res => {
          // this.responseData = res.json();
          resolve(res);
        },
        error => {
          reject(error);
        }
        );
    });
    return returnReponse;
  }
}
