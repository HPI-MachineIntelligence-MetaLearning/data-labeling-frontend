import { Component, ViewChild, OnInit } from '@angular/core';
import $ from 'jquery';
import { HttpClientService } from './http-client.service';
import { forEach } from '@angular/router/src/utils/collection';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
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
  private boundingBoxes = [[]];
  private imgName = '';
  private imgData;
  private detectedBoundingBoxes;
  private detectedLabels;

  ngOnInit() {
    $('#imageCanvas').mousedown(e => this.handleMouseDown(e));
    $('#imageCanvas').mouseup(e => this.handleMouseUp(e));
  }

  onChange(event) {
    this.buildings = event.srcElement.files;
    this.imgAmount = Object.keys(this.buildings).length;
    this.showUploader = false;
    this.index = 0;
    this.showBBoxes();
  }

  showBBoxes() {
    const postData = {}; // Put your form data variable. This is only example.
    this._service.postWithFile('http://127.0.0.1:5000/', postData, this.buildings, this.index).then(result => {
      console.log(result);
      this.detectedBoundingBoxes = result['bboxes'];
      this.detectedLabels = result['labels'];
      this.processCanvas(this.detectedBoundingBoxes, this.detectedLabels);
    });
  }

  private nextImage() {
    // this.saveToCsv();
    this.index++;
    if (this.index >= this.imgAmount) {
      this.showUploader = true;
      this.msg = 'All images have been tagged. Upload more!';
      this.index = 0;
    } else {
      this.showBBoxes();
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
        detectedBoundingBoxes[0].forEach((item, index) => {
          ctx.beginPath();
          const x = detectedBoundingBoxes[0][index][0];
          const y = detectedBoundingBoxes[0][index][1];
          const height = detectedBoundingBoxes[0][index][2];
          const width = detectedBoundingBoxes[0][index][3];
          ctx.rect(x, y, height, width);
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = 'red';
          ctx.stroke();
          ctx.fillStyle = 'red';
          ctx.font = 'bold 12px Arial';
          ctx.fillText(labelMapping[detectedLabels[0][index]], x + 20, y + 20);
        });
      };
      img.src = e.target['result'];
    };
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
    this.boundingBoxes = [[]];
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
    this.drawBoundingBox(ctx, canvas, this.startX, this.startY, endX, endY);
  }

  private drawBoundingBox(ctx, canvas, startX, startY, endX, endY) {
    ctx.strokeStyle = '#F00';
    ctx.beginPath();
    ctx.rect(startX, startY, endX, endY);
    this.boundingBoxes.push([this.startX, this.startY, endX, endY]);
    ctx.stroke();
    canvas.style.cursor = 'default';
  }

}
