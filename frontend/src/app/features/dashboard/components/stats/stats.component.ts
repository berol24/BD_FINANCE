import { Component, Input } from '@angular/core'
import { CommonModule } from '@angular/common'

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats.component.html',
})
export class StatsComponent {
  @Input() title = ''
  @Input() amount = 0
  @Input() icon = 'trend-up'
  @Input() color: 'success' | 'danger' | 'warning' | 'primary' = 'primary'

  get bgClass(): string {
    const colors: Record<string, string> = {
      success: 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20',
      danger: 'bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/20',
      warning: 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/20',
      primary: 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/20',
    }
    return colors[this.color]
  }
}
