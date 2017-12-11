import { Injectable } from "@angular/core";
import { Http, Headers, Response, Request, RequestMethod, URLSearchParams, RequestOptions } from "@angular/http";
import { Observable } from 'rxjs/Rx';
declare var $: any;

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

    let headers = new Headers();
    let formData: FormData = new FormData();
    formData.append('image', files[0], files[0].name);

    if (postData !== "" && postData !== undefined && postData !== null) {
      for (var property in postData) {
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
          this.responseData = res.json();
          resolve(this.responseData);
        },
        error => {
          reject(error);
        }
        );
    });
    return returnReponse;
  }
}
