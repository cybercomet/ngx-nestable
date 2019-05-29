import { Component, ViewChildren, QueryList } from '@angular/core';
import { NestableSettings } from '../../lib/src/nestable.models';
import { NestableComponent } from '../../lib';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  @ViewChildren(NestableComponent) 
  public nestables: QueryList<NestableComponent>;  

  public idCount = 30;
  public visibilty = null;

  public options1 = {
    fixedDepth: false,
    group: 1
  } as NestableSettings;

  public options2 = {
    fixedDepth: false,
    group: 2
  } as NestableSettings;

  public list1 = [
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
    { 'id': 14 },
    { 'id': 15 }
  ];

  public list2 = [
    { 'id': 16 },
    {
      'expanded': true,
      'id': 17, 'children': [
        { 'id': 18 },
        { 'id': 19 },
        {
          'expanded': false,
          'id': 20, 'children': [
            { 'id': 21 },
            { 'id': 22 },
            { 'id': 23 }
          ]
        },
        { 'id': 24 },
        { 'id': 25 }
      ]
    },
    { 'id': 26 },
    {
      'id': 27,
      'children': [
        { 'id': 28 }
      ]
    },
    { 'id': 29 },
    { 'id': 30 }
  ];

  constructor() { }

  public pushItem(list) {
    list.push({ id: ++this.idCount });
    return [...list];
  }

  public show({ value }) {
    this.visibilty = value;
    this.nestables.forEach(nestable => nestable[this.visibilty]())
  }

  public toggleFixedDepth(options) {
    options.fixedDepth = !options.fixedDepth;
  }

  public drag(event) {
    console.log(event);
  }

  public drop(event) {
    console.log(event);
  }

  public onDisclosure() {
    this.visibilty = null;
  }
}
