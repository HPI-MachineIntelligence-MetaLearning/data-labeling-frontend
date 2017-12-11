import { Component, ViewChild, OnInit } from '@angular/core';
import $ from 'jquery';
import { HttpClientService } from './http-client.service';

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

  ngOnInit() {
    $('#imageCanvas').mousedown(e => this.handleMouseDown(e));
    $('#imageCanvas').mouseup(e => this.handleMouseUp(e));
  }

  onChange(event) {
    const file = event.srcElement.files;
    const postData = { }; // Put your form data variable. This is only example.
    this._service.postWithFile('http://127.0.0.1:5000/', postData, file).then(result => {
      this.detectedBoundingBoxes = result['bboxes'];
      this.getImages(this.detectedBoundingBoxes);
    });
  }

  private getImages(detectedBoundingBoxes) {
    this.buildings = document.getElementById('imageImport')['files'];
    this.imgAmount = Object.keys(this.buildings).length;
    this.processCanvas(detectedBoundingBoxes);
    this.showUploader = false;
  }

  private nextImage() {
    this.saveToCsv();
    this.index++;
    if (this.index >= this.imgAmount) {
      this.showUploader = true;
      this.msg = 'All images have been tagged. Upload more!';
      this.index = 0;
    } else {
      this.processCanvas(this.detectedBoundingBoxes);
    }
  }

  private processCanvas(detectedBoundingBoxes) {
    const reader = new FileReader();

    reader.onload = function (e) {
      const canvas: any = document.getElementById('imageCanvas');
      const ctx = canvas.getContext('2d');
      const img: any = new Image();
      img.onload = function () {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        ctx.beginPath();
        ctx.rect(detectedBoundingBoxes[0][0], detectedBoundingBoxes[0][1],
          detectedBoundingBoxes[0][2] - detectedBoundingBoxes[0][0],
          detectedBoundingBoxes[0][3] - detectedBoundingBoxes[0][1]);
        // ctx.rect(188, 50, 200, 100);
        ctx.fillStyle = 'yellow';
        ctx.fill();
        ctx.lineWidth = 7;
        ctx.strokeStyle = 'black';
        ctx.stroke();
      };
      img.src = e.target['result'];
    };
    this.imgName = this.buildings[this.index]['name'];
    reader.readAsDataURL(this.buildings[this.index]);
    // this.drawBBoxes();
  }

  private drawBBoxes() {
    const canvas: any = document.getElementById('imageCanvas');
    const ctx = canvas.getContext('2d');
    this.detectedBoundingBoxes.forEach(function(bbox) {
      console.log(bbox[0]);
      console.log(bbox[0][0], bbox[0][1], bbox[0][2], bbox[0][3]);
      console.log(canvas, ctx);
      ctx.strokeStyle = '#F00';
      ctx.beginPath();
      ctx.rect(bbox[0][0], bbox[0][1], bbox[0][2] - bbox[0][0], bbox[0][3] - bbox[0][1]);
      ctx.stroke();
      canvas.style.cursor = 'default';
    });

    const c: any = document.getElementById('imageCanvas');
    const context = c.getContext('2d');

    context.beginPath();
    context.rect(188, 50, 200, 100);
    context.fillStyle = 'yellow';
    context.fill();
    context.lineWidth = 7;
    context.strokeStyle = 'black';
    context.stroke();
  }

  private resetImage() {
    this.processCanvas(this.detectedBoundingBoxes);
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
    ctx.rect(startX, startY, endX - startX, endY - startY);
    this.boundingBoxes.push([this.startX, this.startY, endX, endY]);
    ctx.stroke();
    canvas.style.cursor = 'default';
  }

}
