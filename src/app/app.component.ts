import { Component, ViewChild, OnInit } from '@angular/core';
import $ from 'jquery';
import { HttpClientService } from './http-client.service';
import { forEach } from '@angular/router/src/utils/collection';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Data Labeling';

  constructor(private _service: HttpClientService) { }

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
  public bbCount = 0;

  labels = [
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

  onChange(event) {
    this.buildings = event.srcElement.files;
    this.imgAmount = Object.keys(this.buildings).length;
    this.showUploader = false;
    this.index = 0;
    this.showBBoxes();
  }

  showBBoxes() {
    const postData = {};
    this.loading = true;
    this._service.postWithFile('http://127.0.0.1:5000/', postData, this.buildings).then(result => {
      this.allDetectedProps = result;
      this.detectedBoundingBoxes = this.allDetectedProps[this.index]['bboxes'];
      this.detectedLabels = this.allDetectedProps[this.index]['labels'];
      this.processCanvas(this.detectedBoundingBoxes, this.detectedLabels);
    });
  }

  private nextImage() {
    this.index++;
    if (this.index >= this.imgAmount) {
      this.showUploader = true;
      this.msg = 'You are done. Upload more!';
      this.index = 0;
    } else {
      this.detectedBoundingBoxes = this.allDetectedProps[this.index]['bboxes'];
      this.detectedLabels = this.allDetectedProps[this.index]['labels'];
      this.processCanvas(this.detectedBoundingBoxes, this.detectedLabels);
    }
  }

  private processCanvas(detectedBoundingBoxes, detectedLabels) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const canvas: any = document.getElementById('imageCanvas');
      const ctx = canvas.getContext('2d');
      const img: any = new Image();
      const labelMapping = {
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
      img.onload = function () {
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
            ctx.fillText(labelMapping[detectedLabels[0][index]], x + 20, y + 20);
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

  private saveToCsv() {
    let csvContent = 'data:text/csv;charset=utf-8,';
    this.boundingBoxes.forEach(function (rowArray) {
      const row = rowArray.join(';');
      csvContent += row + '\r\n';
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', this.imgName + '.csv');
    document.body.appendChild(link);

    link.click();
    this.boundingBoxes = [];
  }

  private saveImage() {
    this.edit = false;
    console.log(this.boundingBoxes);
    console.log('save');
  }

  private editImage() {
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
    this.boundingBoxes.push([this.startX, this.startY, endX, endY]);
    ctx.stroke();
    canvas.style.cursor = 'default';
    this.bbCount++;
    this.createDropDown();
  }

  private createDropDown() {
    // const itm = document.getElementsByClassName('labelDropdown')[0];
    // const clone = itm.cloneNode(true);
    const parent = document.getElementById('dropdown-container');
    const sel: any = document.createElement('select');
    sel.setAttribute('id', 'bbCount' + this.bbCount);
    sel.setAttribute('class', 'labelDropdown');
    $('labelDropdown').on('change', e => this.onDropdownChange(e));
    for (let i = 0; i < 8; i++) {
      const opt: any = document.createElement('option');
      opt.setAttribute('text', this.labels[i].value);
      opt.setAttribute('value', String(this.labels[i].id));
      opt.innerText = this.labels[i].value;
      // opt.setAttribute('onClick', this.onDropdownChange());
      sel.appendChild(opt);
    }
    parent.appendChild(sel);
  }

  public onDropdownChange(e) {
    console.log('test');
  }

}
