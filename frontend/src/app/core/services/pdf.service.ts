import { Injectable } from '@angular/core'

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
    ctx.fillText('BD Finance - Gestion intelligente de vos finances', 50, 595)

    // Download
    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = `releve-${startDate}-${endDate}.png`
    link.click()
  }

  /**
   * Génère un PDF via une bibliothèque simple (compatible sans dépendance externe)
   */
  generateSimplePdfReport(
    userName: string,
    userEmail: string,
    startDate: string,
    endDate: string,
    transactions: any[],
    totalRecettes: number,
    totalDepenses: number,
    solde: number
  ): void {
    // Créer du contenu HTML pour l'impression
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Relevé Financier</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; color: #1a202c; }
            h1 { color: #0ea5e9; margin-bottom: 5px; }
            .info { margin: 20px 0; font-size: 14px; }
            .summary { margin: 30px 0; padding: 15px; background: #f7fafc; border-left: 4px solid #0ea5e9; }
            .summary-item { display: flex; justify-content: space-between; margin: 10px 0; font-weight: bold; }
            .positive { color: #10b981; }
            .negative { color: #ef4444; }
            .neutral { color: #3b82f6; }
            table { width: 100%; border-collapse: collapse; margin: 30px 0; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
            th { background: #f3f4f6; font-weight: bold; }
            tr:hover { background: #f9fafb; }
            .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 20px; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <h1>📊 Relevé de Transactions BD Finance</h1>
          
          <div class="info">
            <p><strong>Utilisateur:</strong> ${userName}</p>
            <p><strong>Email:</strong> ${userEmail}</p>
            <p><strong>Période:</strong> ${startDate} à ${endDate}</p>
          </div>

          <div class="summary">
            <div class="summary-item">
              <span>💰 Total Recettes:</span>
              <span class="positive">+${totalRecettes.toFixed(2)} €</span>
            </div>
            <div class="summary-item">
              <span>📉 Total Dépenses:</span>
              <span class="negative">-${totalDepenses.toFixed(2)} €</span>
            </div>
            <div class="summary-item">
              <span>📈 Solde:</span>
              <span class="neutral">${solde.toFixed(2)} €</span>
            </div>
          </div>

          <h2>Transactions Détaillées</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Désignation</th>
                <th>Quantité</th>
                <th>Prix Unitaire</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${transactions
                .slice(0, 50)
                .map(
                  (t) => `
                <tr>
                  <td>${new Date(t.date).toLocaleDateString('fr-FR')}</td>
                  <td>${t.designation}</td>
                  <td>${t.quantite}</td>
                  <td>${t.prix_unitaire.toFixed(2)} €</td>
                  <td>${(t.quantite * t.prix_unitaire).toFixed(2)} €</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>

          <div class="footer">
            <p>📱 BD Finance - Gestion intelligente de vos finances</p>
            <p>Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
          </div>
        </body>
      </html>
    `

    const printWindow = window.open('', '', 'height=700,width=900')
    printWindow!.document.write(htmlContent)
    printWindow!.document.close()
    printWindow!.print()
  }
}
