import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Router, RouterLink } from '@angular/router'

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './landing.component.html',
})
export class LandingComponent {
  constructor(private router: Router) {}

  navigateTo(path: string): void {
    this.router.navigate([path])
  }
}
