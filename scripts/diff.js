import {DiffDOM} from 'diff-dom';

export function component() {
    const element = document.createElement('div');
    var dd = new DiffDOM();
  
    element.innerHTML = "Hello world";
  
    return element;
  }

export function testHelloWorld() {
    console.log("Hello World from diff.js")
}