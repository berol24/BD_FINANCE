import { Injectable } from '@angular/core'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

@Injectable({
  providedIn: 'root',
})
export class PdfService {
  generateTransactionReport(
    userName: string,
    userEmail: string,
    startDate: string,
    endDate: string,
    transactions: any[],
    totalRecettes: number,
    totalDepenses: number,
    solde: number
  ): void {
    const canvas = document.createElement('canvas')
    canvas.width = 800
    canvas.height = 600
    const ctx = canvas.getContext('2d')!

    // Title
    ctx.font = 'bold 24px Arial'
    ctx.fillStyle = '#1a202c'
    ctx.fillText('Relevé de Transactions', 50, 40)

    // User info
    ctx.font = '12px Arial'
    ctx.fillStyle = '#4a5568'
    ctx.fillText(`Utilisateur: ${userName}`, 50, 70)
    ctx.fillText(`Email: ${userEmail}`, 50, 90)
    ctx.fillText(`Période: ${startDate} à ${endDate}`, 50, 110)

    // Summary
    ctx.font = 'bold 14px Arial'
    ctx.fillStyle = '#1a202c'
    ctx.fillText('Synthèse', 50, 150)

    ctx.font = '12px Arial'
    ctx.fillStyle = '#48bb78'
    ctx.fillText(`Recettes: ${totalRecettes.toFixed(2)} €`, 50, 175)

    ctx.fillStyle = '#f56565'
    ctx.fillText(`Dépenses: ${totalDepenses.toFixed(2)} €`, 50, 195)

    ctx.fillStyle = '#4299e1'
    ctx.fillText(`Solde: ${solde.toFixed(2)} €`, 50, 215)

    // Transactions
    ctx.font = 'bold 12px Arial'
    ctx.fillStyle = '#1a202c'
    ctx.fillText('Transactions (dernières 10)', 50, 260)

    let yPosition = 285
    const limitedTransactions = transactions.slice(0, 10)

    limitedTransactions.forEach((t) => {
      ctx.font = '10px Arial'
      ctx.fillStyle = '#4a5568'
      const type = t.type === 'recette' ? '+' : '-'
      const amount = t.quantite * t.prix_unitaire
      ctx.fillText(`${type} ${t.designation}: ${amount.toFixed(2)} €`, 50, yPosition)
      yPosition += 15

      if (yPosition > 550) {
        return
      }
    })

    // Footer
    ctx.font = '10px Arial'
    ctx.fillStyle = '#a0aec0'
    ctx.fillText(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 50, 580)

    // Download
    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = `releve-${startDate}-${endDate}.png`
    link.click()
  }

  /**
   * Génère un PDF avec jsPDF et le télécharge directement
   */
  async generateSimplePdfReport(
    userName: string,
    userEmail: string,
    startDate: string,
    endDate: string,
    transactions: any[],
    totalRecettes: number,
    totalDepenses: number,
    solde: number,
    categoriesAmount: any[] = []
  ): Promise<void> {
    try {
      // SVG Icons en base64
      const logoSvg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2310b981'%3E%3Crect x='2' y='6' width='20' height='12' rx='2'/%3E%3Ccircle cx='12' cy='12' r='3'/%3E%3Cpath d='M6 10h.01M6 14h.01M18 10h.01M18 14h.01'/%3E%3C/svg%3E`
      const arrowUpSvg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2310b981'%3E%3Cpath d='M12 5l-7 7h5v8h4v-8h5z'/%3E%3C/svg%3E`
      const arrowDownSvg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ef4444'%3E%3Cpath d='M12 19l7-7h-5V4h-4v8H5z'/%3E%3C/svg%3E`
      const balanceSvg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%233b82f6'%3E%3Cline x1='12' y1='2' x2='12' y2='22' stroke='%233b82f6' stroke-width='2'/%3E%3Cpath d='M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' stroke='%233b82f6' stroke-width='2' fill='none'/%3E%3C/svg%3E`

      // Créer du contenu HTML professionnel optimisé pour PDF
      const htmlContent = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #1f2937; line-height: 1.5;">
          <!-- Page 1: Header + Synthèse -->
          <div style="page-break-after: avoid; padding: 20px 25px; background: white;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 25px; border-radius: 8px; margin-bottom: 25px; box-shadow: 0 8px 20px rgba(0,0,0,0.1); page-break-after: avoid;">
              <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 15px;">
                <img src="${logoSvg}" width="36" height="36" style="filter: brightness(0) invert(1);" />
                <h1 style="margin: 0; font-size: 28px; font-weight: bold;">BD Finance</h1>
              </div>
              <h2 style="margin: 0; font-size: 20px; opacity: 0.95;">Relevé de Transactions</h2>
            </div>

            <!-- User Info Card -->
            <div style="background: white; padding: 18px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); border-left: 4px solid #10b981; page-break-after: avoid;">
              <h3 style="margin: 0 0 12px 0; color: #1f2937; font-size: 14px; font-weight: 600;">Informations</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px;">
                <div>
                  <p style="margin: 0 0 4px 0; color: #6b7280; font-weight: 600; text-transform: uppercase;">Nom</p>
                  <p style="margin: 0; color: #1f2937; font-weight: 500;">${userName}</p>
                </div>
                <div>
                  <p style="margin: 0 0 4px 0; color: #6b7280; font-weight: 600; text-transform: uppercase;">Email</p>
                  <p style="margin: 0; color: #1f2937; font-weight: 500;">${userEmail}</p>
                </div>
                <div>
                  <p style="margin: 0 0 4px 0; color: #6b7280; font-weight: 600; text-transform: uppercase;">Période</p>
                  <p style="margin: 0; color: #1f2937; font-weight: 500;">${startDate} à ${endDate}</p>
                </div>
                <div>
                  <p style="margin: 0 0 4px 0; color: #6b7280; font-weight: 600; text-transform: uppercase;">Date</p>
                  <p style="margin: 0; color: #1f2937; font-weight: 500;">${new Date().toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
            </div>

            <!-- Summary Cards -->
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 25px; page-break-after: avoid;">
              <!-- Recettes -->
              <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 16px; border-radius: 8px; border-top: 3px solid #10b981; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                  <img src="${arrowUpSvg}" width="28" height="28" />
                  <span style="color: #6b7280; font-size: 11px; font-weight: 600; text-transform: uppercase;">Recettes</span>
                </div>
                <p style="margin: 0; color: #10b981; font-size: 24px; font-weight: bold;">+${totalRecettes.toFixed(2)} €</p>
                <p style="margin: 6px 0 0 0; color: #6b7280; font-size: 11px;">Revenus</p>
              </div>

              <!-- Dépenses -->
              <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); padding: 16px; border-radius: 8px; border-top: 3px solid #ef4444; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                  <img src="${arrowDownSvg}" width="28" height="28" />
                  <span style="color: #6b7280; font-size: 11px; font-weight: 600; text-transform: uppercase;">Dépenses</span>
                </div>
                <p style="margin: 0; color: #ef4444; font-size: 24px; font-weight: bold;">-${totalDepenses.toFixed(2)} €</p>
                <p style="margin: 6px 0 0 0; color: #6b7280; font-size: 11px;">Charges</p>
              </div>

              <!-- Solde -->
              <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); padding: 16px; border-radius: 8px; border-top: 3px solid #3b82f6; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                  <img src="${balanceSvg}" width="28" height="28" />
                  <span style="color: #6b7280; font-size: 11px; font-weight: 600; text-transform: uppercase;">Solde</span>
                </div>
                <p style="margin: 0; color: #3b82f6; font-size: 24px; font-weight: bold;">${(totalRecettes - totalDepenses).toFixed(2)} €</p>
                <p style="margin: 6px 0 0 0; color: #6b7280; font-size: 11px;">Bilan net</p>
              </div>
            </div>
          </div>

          <!-- Page 2+: Transactions Table (paginated) -->
          <div style="padding: 20px 25px; background: white;">
            <h3 style="margin: 0 0 16px 0; color: #1f2937; font-size: 16px; font-weight: 600; page-break-after: avoid;">Transactions Détaillées</h3>
            
            <table style="width: 100%; border-collapse: collapse; page-break-inside: avoid;">
              <thead style="position: relative;">
                <tr style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border-bottom: 2px solid #d1d5db;">
                  <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #374151; font-size: 12px; text-transform: uppercase;">Date</th>
                  <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #374151; font-size: 12px; text-transform: uppercase;">Désignation</th>
                  <th style="padding: 12px 8px; text-align: center; font-weight: 600; color: #374151; font-size: 12px; text-transform: uppercase;">Qté</th>
                  <th style="padding: 12px 8px; text-align: right; font-weight: 600; color: #374151; font-size: 12px; text-transform: uppercase;">P.U.</th>
                  <th style="padding: 12px 8px; text-align: right; font-weight: 600; color: #374151; font-size: 12px; text-transform: uppercase;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${transactions
                  .slice(0, 100)
                  .map(
                    (t, index) => `
                  <tr style="border-bottom: 1px solid #f3f4f6; background: ${index % 2 === 0 ? '#ffffff' : '#f9fafb'}; page-break-inside: avoid;">
                    <td style="padding: 10px 8px; color: #4b5563; font-size: 12px;">${new Date(t.date).toLocaleDateString('fr-FR')}</td>
                    <td style="padding: 10px 8px; color: #1f2937; font-size: 12px; font-weight: 500; word-break: break-word;">${t.designation}</td>
                    <td style="padding: 10px 8px; color: #6b7280; font-size: 12px; text-align: center;">${t.quantite}</td>
                    <td style="padding: 10px 8px; color: #6b7280; font-size: 12px; text-align: right; white-space: nowrap;">${t.prix_unitaire.toFixed(2)} €</td>
                    <td style="padding: 10px 8px; color: #1f2937; font-weight: 600; text-align: right; font-size: 12px; white-space: nowrap;">${(t.quantite * t.prix_unitaire).toFixed(2)} €</td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
          </div>

          <!-- Categories Summary Table -->
          ${categoriesAmount.length > 0 ? `
          <div style="padding: 20px 25px; background: white; page-break-inside: avoid;">
            <h3 style="margin: 0 0 16px 0; color: #1f2937; font-size: 16px; font-weight: 600; page-break-after: avoid;">Résumé par Catégorie (Période: ${startDate} à ${endDate})</h3>
            
            <table style="width: 100%; border-collapse: collapse; page-break-inside: avoid;">
              <thead style="position: relative;">
                <tr style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border-bottom: 2px solid #d1d5db;">
                  <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #374151; font-size: 12px; text-transform: uppercase;">Catégorie</th>
                  <th style="padding: 12px 8px; text-align: right; font-weight: 600; color: #374151; font-size: 12px; text-transform: uppercase;">Montant</th>
                  <th style="padding: 12px 8px; text-align: right; font-weight: 600; color: #374151; font-size: 12px; text-transform: uppercase;">% Total</th>
                </tr>
              </thead>
              <tbody>
                ${categoriesAmount
                  .map((cat, index) => {
                    const total = categoriesAmount.reduce((sum, c) => sum + c.montant, 0)
                    return `
                  <tr style="border-bottom: 1px solid #f3f4f6; background: ${index % 2 === 0 ? '#ffffff' : '#f9fafb'}; page-break-inside: avoid;">
                    <td style="padding: 10px 8px; color: #1f2937; font-size: 12px; font-weight: 500;">
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 12px; height: 12px; border-radius: 3px; background-color: ${cat.couleur};"></div>
                        ${cat.nom}
                      </div>
                    </td>
                    <td style="padding: 10px 8px; color: #1f2937; font-weight: 600; text-align: right; font-size: 12px; white-space: nowrap;">${cat.montant.toFixed(2)} €</td>
                    <td style="padding: 10px 8px; color: #6b7280; text-align: right; font-size: 12px; white-space: nowrap;">${((cat.montant / total) * 100).toFixed(1)}%</td>
                  </tr>
                `
                  })
                  .join('')}
                <tr style="background: linear-gradient(135deg, #f0fdf4 0%, #f0fdf4 100%); border-top: 2px solid #10b981; page-break-inside: avoid;">
                  <td style="padding: 12px 8px; color: #1f2937; font-size: 12px; font-weight: bold;">TOTAL</td>
                  <td style="padding: 12px 8px; color: #1f2937; font-weight: bold; text-align: right; font-size: 12px; white-space: nowrap;">${categoriesAmount.reduce((sum, cat) => sum + cat.montant, 0).toFixed(2)} €</td>
                  <td style="padding: 12px 8px; color: #1f2937; text-align: right; font-size: 12px; font-weight: bold;">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
          ` : ''}

          <!-- Footer sur chaque page -->
          <div style="margin-top: 35px; padding: 20px 0; border-top: 3px solid #10b981; color: #6b7280; page-break-inside: avoid;">
            <!-- Ligne supérieure avec infos -->
            <!-- Ligne de séparation -->            
            <!-- Information basique du footer -->
            <div style="text-align: center; font-size: 10px;">
              <p style="margin: 0 0 4px 0; color: #9ca3af;">Rapport généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')} • Utilisateur: ${userName}</p>
              <p style="margin: 0; color: #d1d5db;">© 2026 BD Finance. Tous droits réservés | Confidentiel | Pour usage autorisé uniquement</p>
            </div>
          </div>
        </div>
      `

      // Créer un conteneur temporaire optimisé pour PDF
      const element = document.createElement('div')
      element.innerHTML = htmlContent
      element.style.position = 'absolute'
      element.style.left = '-9999px'
      element.style.width = '210mm'
      element.style.backgroundColor = 'white'
      element.style.color = '#000'
      document.body.appendChild(element)

      // Convertir en canvas avec meilleurs paramètres
      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        useCORS: true,
        backgroundColor: '#ffffff',
        allowTaint: true,
        windowHeight: element.scrollHeight,
      })

      // Créer le PDF avec gestion optimisée des pages
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgData = canvas.toDataURL('image/png')
      const imgWidth = 210
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0

      // Première page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= 297

      // Pages supplémentaires
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= 297
      }

      // Télécharger le PDF
      pdf.save(`releve-${userName}-${startDate}-${endDate}.pdf`)

      // Nettoyer
      document.body.removeChild(element)
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error)
    }
  }
}
