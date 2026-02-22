import { Pipe, PipeTransform } from '@angular/core'
import { I18nService } from '../services/i18n.service'

@Pipe({
  name: 'i18n',
  standalone: true,
})
export class I18nPipe implements PipeTransform {
  constructor(private i18nService: I18nService) {}

  transform(key: string, params?: any): string {
    return this.i18nService.translate(key, params)
  }
}
