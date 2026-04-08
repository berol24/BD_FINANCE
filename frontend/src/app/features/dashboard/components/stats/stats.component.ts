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
      success: 'bg-emerald-600 shadow-lg shadow-emerald-900/20',
      danger: 'bg-slate-700 shadow-lg shadow-slate-900/20',
      warning: 'bg-slate-600 shadow-lg shadow-slate-900/20',
      primary: 'bg-slate-700 shadow-lg shadow-slate-900/20',
    }
    return colors[this.color]
  }
}
