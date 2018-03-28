import { Component, ElementRef, Renderer2 } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  public idCount = 13;
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
    { 'id': 12 }
  ];

  constructor(
    private el: ElementRef,
    private renderer: Renderer2
  ) {
    this.renderer.listen(this.el.nativeElement, 'listUpdated', e => {
      this.list = e.detail;
    });
  }

  public pushItem() {
    this.list.push({ id: ++this.idCount });
    this.list = [...this.list];
  }
}
