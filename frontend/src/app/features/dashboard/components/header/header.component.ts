import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { User } from '../../../../core/services/auth.service'
import { PwaService } from '../../../../core/services/pwa.service'

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
})
export class HeaderComponent implements OnInit {
  @Input() user: User | null = null
  @Output() logout = new EventEmitter<void>()

  canInstall = false

  constructor(private pwaService: PwaService) {}

  ngOnInit(): void {
    this.pwaService.onCanInstallChange((can) => {
      this.canInstall = can
    })
  }

  onLogout(): void {
    this.logout.emit()
  }

  async onInstall(): Promise<void> {
    await this.pwaService.install()
  }
}
