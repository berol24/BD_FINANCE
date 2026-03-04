import { Component } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { PwaButtonComponent } from './app-pwa-button.component'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, PwaButtonComponent],
  template: `
    <app-pwa-button></app-pwa-button>
    <router-outlet></router-outlet>
  `,
})
export class AppComponent {}
