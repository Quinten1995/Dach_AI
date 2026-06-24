/**
 * PDF Export — neues Fenster + Druckdialog
 * "Als PDF speichern" auf allen Geräten verfügbar
 */

export function exportPDF(projekt, positionen, profil, anmerkung = '') {
  const netto = positionen.reduce((sum, p) => sum + (parseFloat(p.menge) * parseFloat(p.ep) || 0), 0)
  const mwst = netto * 0.19
  const brutto = netto + mwst

  const datum = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const angebotNr = `AN-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`
  const gueltigBis = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE')

  const html = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<title>Angebot ${projekt.kunde}</title>
<style>
  @media print {
    body { margin: 0; }
    @page { margin: 1.5cm 2cm; }
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 10pt; color: #1a1a1a; padding: 1cm; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20pt; padding-bottom: 12pt; border-bottom: 3px solid #e63c22; }
  .logo { font-size: 18pt; font-weight: 700; color: #e63c22; }
  .logo-sub { font-size: 8pt; color: #666; margin-top: 2pt; }
  .header-right { text-align: right; font-size: 9pt; color: #444; line-height: 1.6; }
  .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 20pt; margin-bottom: 20pt; }
  .meta-label { font-size: 7.5pt; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin-bottom: 2pt; }
  .meta-value { font-size: 9pt; line-height: 1.6; }
  h1 { font-size: 14pt; font-weight: 700; margin-bottom: 4pt; }
  .angebot-nr { font-size: 9pt; color: #666; margin-bottom: 16pt; }
  .hinweis { font-size: 8pt; color: #0369a1; margin-bottom: 14pt; background: #f0f9ff; border: 1px solid #bae6fd; padding: 6pt 8pt; border-radius: 3pt; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 14pt; }
  thead tr { background: #1a1a2e; color: white; }
  thead th { padding: 6pt 8pt; text-align: left; font-size: 8.5pt; font-weight: 600; }
  thead th.r { text-align: right; }
  tbody tr:nth-child(even) { background: #f8f8f8; }
  tbody td { padding: 5pt 8pt; font-size: 9pt; border-bottom: 1px solid #eee; }
  tbody td.r { text-align: right; }
  .summen { margin-left: auto; width: 200pt; margin-bottom: 16pt; }
  .sr { display: flex; justify-content: space-between; padding: 3pt 0; border-bottom: 1px solid #eee; font-size: 9pt; }
  .sr.total { border-top: 2px solid #1a1a2e; border-bottom: none; font-weight: 700; font-size: 11pt; padding-top: 6pt; color: #e63c22; }
  .anmerkung { background: #fffbf0; border-left: 3px solid #f59e0b; padding: 6pt 10pt; margin-bottom: 14pt; font-size: 9pt; }
  .unterschrift { display: grid; grid-template-columns: 1fr 1fr; gap: 40pt; margin-top: 36pt; }
  .ub { border-top: 1px solid #999; padding-top: 5pt; font-size: 8pt; color: #666; }
  .footer { border-top: 1px solid #eee; padding-top: 8pt; font-size: 8pt; color: #999; text-align: center; margin-top: 16pt; }
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
  <div>
    <div class="meta-label">Angebot für</div>
    <div class="meta-value"><strong>${projekt.kunde}</strong><br>${projekt.adresse}</div>
  </div>
  <div>
    <div class="meta-label">Angebotsdaten</div>
    <div class="meta-value">Nr.: ${angebotNr}<br>Datum: ${datum}<br>Gültig bis: ${gueltigBis}</div>
  </div>
</div>

<h1>Angebot – Dacharbeiten</h1>
<p class="angebot-nr">Angebot Nr. ${angebotNr} · ${datum}</p>
<div class="hinweis">ℹ️ Dieses Angebot wurde mit KI-Unterstützung erstellt und vom Dachdecker geprüft.</div>

<table>
  <thead>
    <tr>
      <th style="width:25pt">Pos.</th>
      <th>Bezeichnung</th>
      <th style="width:45pt" class="r">Menge</th>
      <th style="width:40pt" class="r">Einheit</th>
      <th style="width:55pt" class="r">EP (€)</th>
      <th style="width:60pt" class="r">GP (€)</th>
    </tr>
  </thead>
  <tbody>
    ${positionen.map((pos, i) => `
    <tr>
      <td class="r">${i + 1}</td>
      <td>${pos.bezeichnung}</td>
      <td class="r">${parseFloat(pos.menge).toLocaleString('de-DE')}</td>
      <td class="r">${pos.einheit}</td>
      <td class="r">${parseFloat(pos.ep).toLocaleString('de-DE', { minimumFractionDigits: 2 })}</td>
      <td class="r"><strong>${(parseFloat(pos.menge) * parseFloat(pos.ep)).toLocaleString('de-DE', { minimumFractionDigits: 2 })}</strong></td>
    </tr>`).join('')}
  </tbody>
</table>

${anmerkung ? `<div class="anmerkung"><strong>Anmerkungen:</strong><br>${anmerkung}</div>` : ''}

<div class="summen">
  <div class="sr"><span>Nettobetrag</span><span>${netto.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</span></div>
  <div class="sr"><span>MwSt. 19%</span><span>${mwst.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</span></div>
  <div class="sr total"><span>Gesamtbetrag</span><span>${brutto.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</span></div>
</div>

<div class="unterschrift">
  <div class="ub">Datum, Unterschrift Auftraggeber</div>
  <div class="ub">${profil?.ort || ''}, Datum · ${profil?.inhaber || 'Auftragnehmer'}</div>
</div>

<div class="footer">Angebot gültig für 30 Tage · Erstellt mit DachProfi AI · Alle Preise netto zzgl. gesetzlicher MwSt.</div>
</body>
</html>`

  const win = window.open('', '_blank', 'width=800,height=600')
  win.document.write(html)
  win.document.close()
  win.onload = () => {
    setTimeout(() => win.print(), 300)
  }
}
