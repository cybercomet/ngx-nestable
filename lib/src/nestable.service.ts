import { Injectable } from '@angular/core';
import { _traverseChildren } from './nestable.helper';

@Injectable({
  providedIn: 'root'
})
export class NestableService {

  private _ID = 0;

  constructor() { }

  public generateID() { return ++this._ID; }
}
