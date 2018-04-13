<p align="center">
  <img height="200px" width="200px" style="text-align: center;" src="https://cybercomet.github.io/ngx-nestable/assets/ngx_nestable.svg">
  <h1 align="center">Angular Nestable List</h1>
</p>

# ngx-nestable
Nestable list for Angular4 and beyond. This is a Angular adaptation of Jquery [Nestable](https://dbushell.com/Nestable/) library.
[Demo](https://cybercomet.github.io/ngx-nestable)

## Features
* Drag and Drop
* Sorting
* Events (drag, drop, over, out) // TODO
* Nesting
* Touch support // TODO

## Instalation
```
npm i ngx-nestable --save
```

## Implementation

app.module.ts

```ts
import { NestableModule } from 'ngx-nestable';

@NgModule({
  imports: [NestableModule],
  bootstrap: [AppComponent]
})
export class AppModule {}
```

app.component.ts
```ts
  public options = {
    fixedDepth: true
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
    { 'id': 11 }
  ];
```

app.html
```html
  <ngx-nestable [(list)]="list" [options]="options" [template]="itemTemplate">
  </ngx-nestable>
  
  <ng-template #itemTemplate let-row>
    <button mat-icon-button [ngxNestableDragHandle]="row">
      <mat-icon>drag_handle</mat-icon>
    </button>
    
    <button mat-icon-button *ngIf="row.item.children && row.item.children.length; else empty_item" [ngxNestableExpandCollapse]="row">
      <mat-icon>{{row.item.$$expanded ? 'keyboard_arrow_down' : 'keyboard_arrow_right'}}
      </mat-icon>
    </button>
    
    <div>Item: {{row.item.id}}</div>
  </ng-template>

  <ng-template #empty_item>
    <span style="width: 40px"></span>
  </ng-template>
```

## API

  ### Inputs

  | Name| Type| Default|Descirption|
  | :-------------: |:-------------:| :-----:|:--------------|
  | list| Array|   | Items which will be displayed in tree
  | template| TemplateRef|    | HTML template for tree item. Inside this template you can place directives (ngxNestableDragHandle and ngxNestableExpandCollapse). That will describe the custom look and position of these elements. Otherwise, the default functions are applied.

  #### options

  | Name| Type| Default|Descirption|
  | :-------------: |:-------------:| :-----:|:--------------|
  | fixedDepth      | boolean |false | Constaint items to keep their initial depth
  | maxDepth      | number|   5 | Maximum nested depth
  | threshold | number     |    20 | Distance in px after which horizontal movement (nesting) is applied. Also gives padding to the tree. 
  | disableDrag| boolean|    false| Disable/enable drag event
  | template| TemplateRef|    | HTML template for tree item. Inside this template you can place directives (ngxNestableDragHandle and ngxNestableExpandCollapse). That will describe the custom look and position of these elements, otherwise the default functions are applied.

  ### Outputs

  | Name| Type |Descirption|
  | :-------------: |:-------------:| :-----|
  | drag| void| Emits event when item drag is started  
  | drop| void| Emits event when item is dropped
  |disclosure|void| Emits event when item expand/collapse state is changed

## Authors

* **Petar Markov** - *Initial work* - [Speculees](https://github.com/speculees)
* **Mihajlo Grubjesic** - *Initial work* - [Comi89](https://github.com/comi89)
* **Zlatomir Darabuc** - *Initial work* - [zlaayaa](https://github.com/zlaayaa)

## License

This project is licensed under the MIT License - see the [LICENSE.md](https://opensource.org/licenses/MIT) file for details

## Acknowledgments

* [Nestable](https://github.com/dbushell/Nestable)
