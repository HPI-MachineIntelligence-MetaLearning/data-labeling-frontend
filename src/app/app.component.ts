import { Component, ViewChild, OnInit, ComponentFactoryResolver } from '@angular/core';
import $ from 'jquery';
import { HttpClientService } from './http-client.service';
import { forEach } from '@angular/router/src/utils/collection';

import { Http, Headers, Response, Request, RequestMethod, URLSearchParams, RequestOptions } from '@angular/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Data Labeling';

  constructor(private _service: HttpClientService, private resolver: ComponentFactoryResolver, private http: Http) {
    this.http = http;
   }

  // TODO: Save alle Bounding Boxes in Json

  private buildings = [ ];
  private showUploader = true;
  private startX;
  private startY;
  private imgSize;
  private recSize;
  private index = 0;
  private imgAmount;
  private msg;
  private boundingBoxes = [];
  private imgName = '';
  private imgData;
  private detectedBoundingBoxes;
  private detectedLabels;
  private allDetectedProps;
  public loading = false;
  private edit = false;
  public bbCount = -1;

  private labels = [
    { id: 0, value: 'other' },
    { id: 1, value: 'berlinerdom' },
    { id: 2, value: 'brandenburgertor' },
    { id: 3, value: 'fernsehturm' },
    { id: 4, value: 'funkturm' },
    { id: 5, value: 'reichstag' },
    { id: 6, value: 'rotesrathaus' },
    { id: 7, value: 'siegessaeule' },
    { id: 8, value: 'none' }
  ];

  private labelMapping = {
    0: 'other',
    1: 'berlinerdom',
    2: 'brandenburgertor',
    3: 'fernsehturm',
    4: 'funkturm',
    5: 'reichstag',
    6: 'rotesrathaus',
    7: 'siegessaeule',
    8: 'none'
  };

  onChange(event) {
    this.buildings = event.srcElement.files;
    this.imgAmount = Object.keys(this.buildings).length;
    this.showUploader = false;
    this.index = 0;
    this.initBBoxes();
  }

  initBBoxes() {
    const postData = {};
    this.loading = true;
    this._service.postWithFile('http://127.0.0.1:5000/', postData, this.buildings).then(result => {
    this.getBboxes();
    });
  }

  getBboxes() {
    return new Promise((resolve, reject) => {
      this.http.get('http://127.0.0.1:5000/', {
        headers: new Headers(),
      }).subscribe(
        res => {
          if (res['_body'] === 'No items in queue.') {
            setTimeout(() => {
              this.getBboxes();
            }, 1000);
          } else {
            this.loadBboxes(res.json());
            resolve(res.json());
          }
        },
        error => {
          reject(error);
        }
        );
    });
  }

  loadBboxes(boxes) {
    this.allDetectedProps = boxes;
    this.detectedBoundingBoxes = this.allDetectedProps['bboxes'];
    this.detectedLabels = this.allDetectedProps['labels'];
    this.processCanvas(this.detectedBoundingBoxes, this.detectedLabels);
    this.buildBoudingBoxArray();
  }

  buildBoudingBoxArray() {
    this.boundingBoxes = [];
    this.detectedBoundingBoxes[0].forEach((box, index) => {
      this.boundingBoxes.push([box[0], box[1], box[2], box[3], this.labelMapping[this.detectedLabels[0][index]]]);
    });
  }

  private nextImage() {
    this.index++;
    if (this.index >= this.imgAmount) {
      this.showUploader = true;
      this.msg = 'You are done. Upload more!';
      this.index = 0;
    } else {
      this.getBboxes();
    }
  }

  private processCanvas(detectedBoundingBoxes, detectedLabels) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const canvas: any = document.getElementById('imageCanvas');
      const ctx = canvas.getContext('2d');
      const img: any = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        if (detectedBoundingBoxes.length !== 0) {
          detectedBoundingBoxes[0].forEach((item, index) => {
            ctx.beginPath();
            const y = detectedBoundingBoxes[0][index][0];
            const x = detectedBoundingBoxes[0][index][1];
            const height = detectedBoundingBoxes[0][index][2];
            const width = detectedBoundingBoxes[0][index][3];
            ctx.rect(x, y, width, height);
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = 'red';
            ctx.stroke();
            ctx.fillStyle = 'red';
            ctx.font = 'bold 12px Arial';
            ctx.fillText(this.labelMapping[detectedLabels[0][index]], x + 20, y + 20);
          });
        }
      };
      img.src = e.target['result'];
    };
    this.loading = false;
    this.imgName = this.buildings[this.index]['name'];
    reader.readAsDataURL(this.buildings[this.index]);
  }

  private resetImage() {
    this.processCanvas(this.detectedBoundingBoxes, this.detectedLabels);
  }

  private saveImage() {
    const jsonData = this.buildJson();
    this.edit = false;
    const parent = document.getElementById('dropdown-container');
    while (parent.firstChild) {
      parent.removeChild(parent.firstChild);
    }
    console.log(jsonData);
    const data = {
      'annotation': jsonData,
      'name': this.imgName
    };
    return new Promise((resolve, reject) => {
      this.http.post('http://127.0.0.1:5000/save_output', data, {
        headers: new Headers(),
      }).subscribe(
        res => {
          console.log(res, 'res');
          this.bbCount = -1;
          this.boundingBoxes = [];
          $('#imageCanvas').unbind('mouseup');
          $('#imageCanvas').unbind('mousedown');
          this.nextImage();
        },
        error => {
          reject(error);
        }
        );
    });
  }

  private editImage() {
    this.boundingBoxes = [];
    this.bbCount = -1;
    this.boundingBoxes = [];
    const parent = document.getElementById('dropdown-container');
    while (parent.firstChild) {
      parent.removeChild(parent.firstChild);
    }
    $('#imageCanvas').unbind('mouseup');
    $('#imageCanvas').unbind('mousedown');
    this.edit = true;
    this.processCanvas([], []);
    $('#imageCanvas').mousedown(e => this.handleMouseDown(e));
    $('#imageCanvas').mouseup(e => this.handleMouseUp(e));
  }

  private handleMouseDown(e) {
    const canvas: any = document.getElementById('imageCanvas');
    const ctx = canvas.getContext('2d');
    const canvasOffset = $('#imageCanvas').offset();
    const offsetX = canvasOffset.left;
    const offsetY = canvasOffset.top;
    const mouseX = Math.floor(e.clientX - offsetX);
    const mouseY = Math.floor(e.clientY - offsetY);
    this.startX = mouseX;
    this.startY = mouseY;
  }

  private handleMouseUp(e) {
    const canvasOffset = $('#imageCanvas').offset();
    const canvas: any = document.getElementById('imageCanvas');
    const ctx = canvas.getContext('2d');
    const offsetX = canvasOffset.left;
    const offsetY = canvasOffset.top;
    const endX = Math.floor(e.clientX - offsetX);
    const endY = Math.floor(e.clientY - offsetY);
    this.drawBoundingBox(ctx, canvas, this.startX, this.startY, endX - this.startX, endY - this.startY);
  }

  private drawBoundingBox(ctx, canvas, startX, startY, endX, endY) {
    ctx.strokeStyle = '#F00';
    ctx.beginPath();
    ctx.rect(startX, startY, endX, endY);
    this.boundingBoxes.push([this.startX, this.startY, endX, endY, 'other']);
    ctx.stroke();
    canvas.style.cursor = 'default';
    this.bbCount++;
    this.createDropDown();
  }

  private createDropDown() {
    const parent = document.getElementById('dropdown-container');
    const title: any = document.createElement('label');
    title.innerHTML = 'Bounding Box ' + this.bbCount;
    const sel: any = document.createElement('select');
    sel.setAttribute('id', 'bbCount#' + this.bbCount);
    sel.setAttribute('class', 'labelDropdown');
    for (let i = 0; i < 8; i++) {
      const opt: any = document.createElement('option');
      opt.setAttribute('text', this.labels[i].value);
      opt.setAttribute('value', String(this.labels[i].value));
      opt.innerText = this.labels[i].value;
      sel.appendChild(opt);
    }
    parent.appendChild(title);
    parent.appendChild(sel);
    document.getElementById('bbCount#' + this.bbCount).addEventListener('change', e => this.onDropdownChange(e));
  }

  public onDropdownChange(e) {
    const id = e.target.id;
    const elem: any = document.getElementById(id);
    const label = elem.value;
    const count = id.split('#');
    if (this.boundingBoxes[count[1]].length > 4) {
      this.boundingBoxes[count[1]].splice(-1, 1);
    }
    this.boundingBoxes[count[1]].push(label);
  }

  public buildJson() {
    const bbJson = [];
    this.boundingBoxes.forEach((box) => {
      bbJson.push({
        'name': box[4],
        'bndbox': {
          'xmin': box[0],
          'xmax': box[1],
          'ymin': box[2],
          'ymax': box[3]
        }
      });
    });
    return bbJson;
  }
}
