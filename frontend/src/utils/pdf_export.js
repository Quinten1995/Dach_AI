/**
 * PDF Export — direkt im Browser mit html2pdf
 */

export async function exportPDF(projekt, positionen, profil, anmerkung = '') {
  const netto = positionen.reduce((sum, p) => sum + (parseFloat(p.menge) * parseFloat(p.ep) || 0), 0)
  const mwst = netto * 0.19
  const brutto = netto + mwst

  const datum = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const angebotNr = `AN-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`
  const gueltigBis = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE')

  const html = `
<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 10pt; color: #1a1a1a; }
  
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24pt; padding-bottom: 16pt; border-bottom: 3px solid #e63c22; }
  .logo { font-size: 20pt; font-weight: 700; color: #e63c22; }
  .logo-sub { font-size: 8pt; color: #666; margin-top: 2pt; }
  .header-right { text-align: right; font-size: 9pt; color: #444; line-height: 1.6; }
  
  .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 20pt; margin-bottom: 24pt; }
  .meta-block { font-size: 9pt; line-height: 1.6; }
  .meta-label { font-size: 7.5pt; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin-bottom: 2pt; }
  
  h1 { font-size: 14pt; font-weight: 700; margin-bottom: 4pt; }
  .angebot-nr { font-size: 9pt; color: #666; margin-bottom: 20pt; }
  
  table { width: 100%; border-collapse: collapse; margin-bottom: 16pt; }
  thead tr { background: #1a1a2e; color: white; }
  thead th { padding: 7pt 8pt; text-align: left; font-size: 8.5pt; font-weight: 600; }
  thead th.right { text-align: right; }
  tbody tr:nth-child(even) { background: #f8f8f8; }
  tbody td { padding: 6pt 8pt; font-size: 9pt; border-bottom: 1px solid #eee; }
  tbody td.right { text-align: right; }
  
  .summen { margin-left: auto; width: 220pt; margin-bottom: 20pt; }
  .summen-row { display: flex; justify-content: space-between; padding: 4pt 0; border-bottom: 1px solid #eee; font-size: 9.5pt; }
  .summen-row.total { border-top: 2px solid #1a1a2e; border-bottom: none; font-weight: 700; font-size: 12pt; padding-top: 8pt; color: #e63c22; }
  
  .anmerkung { background: #fffbf0; border-left: 3px solid #f59e0b; padding: 8pt 12pt; margin-bottom: 16pt; font-size: 9pt; }
  .hinweis { font-size: 8pt; color: #0369a1; margin-bottom: 16pt; background: #f0f9ff; border: 1px solid #bae6fd; padding: 8pt; border-radius: 4pt; }
  .footer { border-top: 1px solid #eee; padding-top: 10pt; font-size: 8pt; color: #999; text-align: center; margin-top: 20pt; }
  
  .unterschrift { display: grid; grid-template-columns: 1fr 1fr; gap: 40pt; margin-top: 40pt; }
  .unterschrift-box { border-top: 1px solid #999; padding-top: 6pt; font-size: 8pt; color: #666; }
</style>
</head>
<body>

<div class="header">
  <div>
    <div class="logo">${profil?.firmenname || 'Dachdeckerei'}</div>
    <div class="logo-sub">${profil?.inhaber || ''}</div>
  </div>
  <div class="header-right">
    ${profil?.strasse ? profil.strasse + '<br>' : ''}
    ${profil?.plz && profil?.ort ? profil.plz + ' ' + profil.ort + '<br>' : ''}
    ${profil?.telefon ? 'Tel: ' + profil.telefon + '<br>' : ''}
    ${profil?.email ? profil.email + '<br>' : ''}
    ${profil?.steuernummer ? 'St.-Nr.: ' + profil.steuernummer : ''}
  </div>
</div>

<div class="meta">
  <div class="meta-block">
    <div class="meta-label">Angebot für</div>
    <strong>${projekt.kunde}</strong><br>
    ${projekt.adresse}
  </div>
  <div class="meta-block">
    <div class="meta-label">Angebotsdaten</div>
    Angebot Nr.: ${angebotNr}<br>
    Datum: ${datum}<br>
    Gültig bis: ${gueltigBis}
  </div>
</div>

<h1>Angebot – Dacharbeiten</h1>
<p class="angebot-nr">Angebot Nr. ${angebotNr} · ${datum}</p>

<div class="hinweis">
  ℹ️ Dieses Angebot wurde mit Unterstützung von KI erstellt und vom Dachdecker geprüft.
</div>

<table>
  <thead>
    <tr>
      <th style="width:30pt">Pos.</th>
      <th>Bezeichnung</th>
      <th style="width:50pt" class="right">Menge</th>
      <th style="width:45pt" class="right">Einheit</th>
      <th style="width:60pt" class="right">EP (€)</th>
      <th style="width:65pt" class="right">GP (€)</th>
    </tr>
  </thead>
  <tbody>
    ${positionen.map((pos, i) => `
    <tr>
      <td class="right">${i + 1}</td>
      <td>${pos.bezeichnung}</td>
      <td class="right">${parseFloat(pos.menge).toLocaleString('de-DE')}</td>
      <td class="right">${pos.einheit}</td>
      <td class="right">${parseFloat(pos.ep).toLocaleString('de-DE', { minimumFractionDigits: 2 })}</td>
      <td class="right"><strong>${(parseFloat(pos.menge) * parseFloat(pos.ep)).toLocaleString('de-DE', { minimumFractionDigits: 2 })}</strong></td>
    </tr>`).join('')}
  </tbody>
</table>

${anmerkung ? `<div class="anmerkung"><strong>Anmerkungen:</strong><br>${anmerkung}</div>` : ''}

<div class="summen">
  <div class="summen-row"><span>Nettobetrag</span><span>${netto.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</span></div>
  <div class="summen-row"><span>MwSt. 19%</span><span>${mwst.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</span></div>
  <div class="summen-row total"><span>Gesamtbetrag</span><span>${brutto.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</span></div>
</div>

<div class="unterschrift">
  <div class="unterschrift-box">Datum, Unterschrift Auftraggeber</div>
  <div class="unterschrift-box">${profil?.ort || ''}, Datum · ${profil?.inhaber || 'Auftragnehmer'}</div>
</div>

<div class="footer">
  Angebot gültig für 30 Tage · Erstellt mit DachProfi AI · Alle Preise netto zzgl. gesetzlicher MwSt.
</div>

</body>
</html>`

  // Als PDF herunterladen via Blob
  const { default: html2pdf } = await import('https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js')
  
  const element = document.createElement('div')
  element.innerHTML = html
  document.body.appendChild(element)

  await html2pdf().set({
    margin: [15, 20, 15, 20],
    filename: `Angebot_${projekt.kunde.replace(/\s+/g, '_')}_${datum.replace(/\./g, '-')}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  }).from(element).save()

  document.body.removeChild(element)
}
