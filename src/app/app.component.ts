import { Component, ElementRef, Renderer2 } from '@angular/core';
import { NestableSettings } from '../../lib/src/nestable.models';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  public idCount = 13;
  public options = {
    fixedDepth: false
  } as NestableSettings;
  public list = [
    { 'id': 1 },
    {
      'expanded': true,
      'id': 2, 'children': [
        { 'id': 3 },
        { 'id': 4 },
        {
          'expanded': false,
          'id': 5, 'children': [
            { 'id': 6 },
            { 'id': 7 },
            { 'id': 8 }
          ]
        },
        { 'id': 9 },
        { 'id': 10 }
      ]
    },
    { 'id': 11 },
    {
      'id': 12,
      'children': [
        { 'id': 13 }
      ]
    },
    { 'id': 13 },
    { 'id': 14 },
    { 'id': 15 },
    { 'id': 16 },
    { 'id': 17 },
    { 'id': 18 },
    { 'id': 13 },
    { 'id': 19 },
    { 'id': 20 },
    { 'id': 21 },
    { 'id': 22 },
    { 'id': 23 },
    { 'id': 24 },
    { 'id': 25 },
    { 'id': 26 },
    { 'id': 27 },
    { 'id': 28 },
    { 'id': 29 },
    { 'id': 30 },
    { 'id': 31 },
    { 'id': 32 },
    { 'id': 33 },
    { 'id': 34 },
    { 'id': 35 },
    { 'id': 36 },
    { 'id': 37 },
    { 'id': 38 },
    { 'id': 39 },
    { 'id': 40 },
    { 'id': 41 },
    { 'id': 42 },
    { 'id': 43 },
    { 'id': 44 },
    { 'id': 45 },
    { 'id': 46 },
    { 'id': 47 },
    { 'id': 48 },
    { 'id': 49 },
    { 'id': 50 },
    { 'id': 51 },
    { 'id': 52 },
    { 'id': 53 },
  ];

  constructor(
    private el: ElementRef,
    private renderer: Renderer2
  ) {
    this.renderer.listen(this.el.nativeElement, 'listUpdated', e => {
      this.list = e.detail.list;
    });
  }

  public pushItem() {
    this.list.push({ id: ++this.idCount });
    this.list = [...this.list];
  }

  public toggleFixedDepth() {
    this.options.fixedDepth = !this.options.fixedDepth;
  }
}
