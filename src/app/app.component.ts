import { Component, ViewChild, OnInit } from '@angular/core';
import $ from 'jquery';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'app';

  public buildings = [ ];
  public showUploader = true;
  public isDrawing = false;
  public startX;
  public startY;
  public imgSize;
  public recSize;
  public index = 0;
  public imgAmount;
  public msg;

  constructor() { }

  ngOnInit() {
    $('#imageCanvas').mousedown(e => this.handleMouseDown(e));
  }

  public getImages() {
    this.buildings = document.getElementById('imageImport')['files'];
    this.imgAmount = Object.keys(this.buildings).length;
    this.processCanvas();
    this.showUploader = false;
  }

  public nextImage() {
    this.index++;
    if (this.index >= this.imgAmount) {
      this.showUploader = true;
      this.msg = 'All images have been tagged. Upload more!';
      this.index = 0;
    } else {
      this.processCanvas();
    }
  }

  public processCanvas() {
    const reader = new FileReader();

    reader.onload = function (e) {
      // TODO: Reset Canvas Size
      const canvas: any = document.getElementById('imageCanvas');
      const ctx = canvas.getContext('2d');
      const img: any = new Image();
      img.onload = function () {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        console.log(canvas.width, img.width, 'width');
        console.log(canvas.height, img.height, 'height');
        this.imgSize = canvas.height + ' x ' + canvas.width;
      };
      img.src = e.target['result'];
    };
    reader.readAsDataURL(this.buildings[this.index]);
  }

  public handleMouseDown(e) {
    const canvas: any = document.getElementById('imageCanvas');
    const ctx = canvas.getContext('2d');
    const canvasOffset = $('#imageCanvas').offset();
    const offsetX = canvasOffset.left;
    const offsetY = canvasOffset.top;
    const mouseX = Math.floor(e.clientX - offsetX);
    const mouseY = Math.floor(e.clientY - offsetY);

    // Put your mousedown stuff here
    ctx.strokeStyle = '#F00';
    if (this.isDrawing) {
      this.isDrawing = false;
      ctx.beginPath();
      ctx.rect(this.startX, this.startY, mouseX - this.startX, mouseY - this.startY);
      this.recSize = '(' + this.startX + ',' + this.startY + ')' + ' x ' + '(' + mouseX + ',' + mouseY + ')';
      ctx.stroke();
      canvas.style.cursor = 'default';
    } else {
      this.isDrawing = true;
      this.startX = mouseX;
      this.startY = mouseY;
      canvas.style.cursor = 'default';
    }

  }

}
