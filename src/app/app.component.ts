import { Component, ViewChild, OnInit } from '@angular/core';
import $ from 'jquery';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Data Labeling';

  private buildings = [ ];
  private showUploader = true;
  private startX;
  private startY;
  private imgSize;
  private recSize;
  private index = 0;
  private imgAmount;
  private msg;
  private boundingBoxes = [['img', 'UpperLeftX', 'UpperLeftY', 'LowerRightX', 'LowerRightY']];
  private imgName = '';

  constructor() { }

  ngOnInit() {
    $('#imageCanvas').mousedown(e => this.handleMouseDown(e));
    $('#imageCanvas').mouseup(e => this.handleMouseUp(e));
  }

  private getImages() {
    this.buildings = document.getElementById('imageImport')['files'];
    this.imgAmount = Object.keys(this.buildings).length;
    this.processCanvas();
    this.showUploader = false;
  }

  private nextImage() {
    this.index++;
    if (this.index >= this.imgAmount) {
      this.showUploader = true;
      this.msg = 'All images have been tagged. Upload more!';
      this.index = 0;
    } else {
      this.processCanvas();
    }
  }

  private processCanvas() {
    const reader = new FileReader();

    reader.onload = function (e) {
      const canvas: any = document.getElementById('imageCanvas');
      const ctx = canvas.getContext('2d');
      const img: any = new Image();
      img.onload = function () {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
      };
      img.src = e.target['result'];
    };
    this.imgName = this.buildings[this.index]['name'];
    reader.readAsDataURL(this.buildings[this.index]);
  }

  private resetImage() {
    this.processCanvas();
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
    link.setAttribute('download', 'boundingBoxes.csv');
    document.body.appendChild(link);

    link.click();
    this.boundingBoxes = [['img', 'UpperLeftX', 'UpperLeftY', 'LowerRightX', 'LowerRightY']];
    this.nextImage();
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
    ctx.rect(startX, startY, endX - this.startX, endY - startY);
    this.boundingBoxes.push([this.imgName, this.startX, this.startY, endX, endY]);
    ctx.stroke();
    canvas.style.cursor = 'default';
  }

}
