"""
POST /api/projekt/{id}/pdf
Generiert ein professionelles Angebots-PDF mit WeasyPrint.
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from typing import List, Optional
from jinja2 import Environment, FileSystemLoader
import os

router = APIRouter()


class Position(BaseModel):
    id: int
    bezeichnung: str
    einheit: str
    menge: float
    ep: float


class PDFRequest(BaseModel):
    positionen: List[Position]
    anmerkung: Optional[str] = ""
    # Metadaten werden aus DB geladen – hier nur Overrides
    

HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<style>
  @page {
    margin: 2cm 2.5cm;
    @bottom-right {
      content: "Seite " counter(page) " von " counter(pages);
      font-size: 9pt;
      color: #999;
    }
  }
  
  * { box-sizing: border-box; margin: 0; padding: 0; }
  
  body {
    font-family: 'Helvetica Neue', Arial, sans-serif;
    font-size: 10pt;
    color: #1a1a1a;
    line-height: 1.5;
  }
  
  /* Header */
  .header {
    border-bottom: 3px solid #e63c22;
    padding-bottom: 16pt;
    margin-bottom: 24pt;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  
  .logo {
    font-size: 18pt;
    font-weight: 700;
    color: #e63c22;
  }
  
  .logo-sub {
    font-size: 8pt;
    color: #666;
    margin-top: 2pt;
  }
  
  /* Empfänger & Angebotsnr */
  .meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24pt;
    margin-bottom: 24pt;
  }
  
  .meta-label {
    font-size: 7.5pt;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #888;
    margin-bottom: 3pt;
  }
  
  .meta-value {
    font-size: 10pt;
    color: #1a1a1a;
  }
  
  h1 {
    font-size: 14pt;
    font-weight: 700;
    margin-bottom: 4pt;
  }
  
  .angebot-nr {
    font-size: 9pt;
    color: #666;
    margin-bottom: 20pt;
  }
  
  /* Tabelle */
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 16pt;
  }
  
  thead tr {
    background: #1a1a2e;
    color: white;
  }
  
  thead th {
    padding: 7pt 8pt;
    text-align: left;
    font-size: 8.5pt;
    font-weight: 600;
    letter-spacing: 0.04em;
  }
  
  thead th.right { text-align: right; }
  
  tbody tr:nth-child(even) { background: #f8f8f8; }
  tbody tr:hover { background: #fff4f2; }
  
  tbody td {
    padding: 6pt 8pt;
    font-size: 9.5pt;
    border-bottom: 1px solid #eee;
    vertical-align: top;
  }
  
  tbody td.right {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  
  .pos-nr {
    color: #999;
    font-size: 8.5pt;
    width: 30pt;
  }
  
  /* Summen */
  .summen {
    margin-left: auto;
    width: 220pt;
    margin-bottom: 20pt;
  }
  
  .summen-row {
    display: flex;
    justify-content: space-between;
    padding: 4pt 0;
    border-bottom: 1px solid #eee;
    font-size: 9.5pt;
  }
  
  .summen-row.total {
    border-top: 2px solid #1a1a2e;
    border-bottom: none;
    font-weight: 700;
    font-size: 11pt;
    padding-top: 8pt;
    color: #e63c22;
  }
  
  /* Anmerkungen */
  .anmerkung {
    background: #fffbf0;
    border-left: 3px solid #f59e0b;
    padding: 10pt 12pt;
    margin-bottom: 20pt;
    font-size: 9pt;
  }
  
  /* Footer */
  .footer {
    border-top: 1px solid #eee;
    padding-top: 10pt;
    margin-top: 20pt;
    font-size: 8pt;
    color: #999;
    text-align: center;
  }
  
  .hinweis {
    background: #f0f9ff;
    border: 1px solid #bae6fd;
    padding: 8pt 12pt;
    border-radius: 4pt;
    font-size: 8.5pt;
    color: #0369a1;
    margin-bottom: 16pt;
  }
</style>
</head>
<body>

<div class="header">
  <div>
    <div class="logo">🏠 DachProfi</div>
    <div class="logo-sub">Ihr Dachdeckermeister vor Ort</div>
  </div>
  <div style="text-align: right; font-size: 9pt; color: #666;">
    {{ datum }}<br>
    Angebot Nr. {{ angebot_nr }}
  </div>
</div>

<div class="meta-grid">
  <div>
    <div class="meta-label">Angebot für</div>
    <div class="meta-value">
      <strong>{{ kunde }}</strong><br>
      {{ adresse }}
    </div>
  </div>
  <div>
    <div class="meta-label">Ausführungsort</div>
    <div class="meta-value">{{ adresse }}</div>
  </div>
</div>

<h1>Angebot – Dacharbeiten</h1>
<p class="angebot-nr">Angebot Nr. {{ angebot_nr }} · Datum: {{ datum }}</p>

<div class="hinweis">
  ⚠️ Dies ist ein KI-unterstützter Angebotsentwurf. Alle Positionen, Mengen und Preise wurden vom Dachdecker geprüft und freigegeben.
</div>

<table>
  <thead>
    <tr>
      <th class="pos-nr">Pos.</th>
      <th>Bezeichnung</th>
      <th style="width: 50pt" class="right">Menge</th>
      <th style="width: 40pt" class="right">Einheit</th>
      <th style="width: 60pt" class="right">EP (€)</th>
      <th style="width: 65pt" class="right">GP (€)</th>
    </tr>
  </thead>
  <tbody>
    {% for pos in positionen %}
    <tr>
      <td class="pos-nr right">{{ loop.index }}</td>
      <td>{{ pos.bezeichnung }}</td>
      <td class="right">{{ "%.1f"|format(pos.menge) }}</td>
      <td class="right">{{ pos.einheit }}</td>
      <td class="right">{{ "%.2f"|format(pos.ep)|replace(".", ",") }}</td>
      <td class="right"><strong>{{ "%.2f"|format(pos.menge * pos.ep)|replace(".", ",") }}</strong></td>
    </tr>
    {% endfor %}
  </tbody>
</table>

{% if anmerkung %}
<div class="anmerkung">
  <strong>Anmerkungen:</strong><br>
  {{ anmerkung }}
</div>
{% endif %}

<div class="summen">
  <div class="summen-row">
    <span>Nettobetrag</span>
    <span>{{ "%.2f"|format(netto)|replace(".", ",") }} €</span>
  </div>
  <div class="summen-row">
    <span>MwSt. 19%</span>
    <span>{{ "%.2f"|format(mwst)|replace(".", ",") }} €</span>
  </div>
  <div class="summen-row total">
    <span>Gesamtbetrag</span>
    <span>{{ "%.2f"|format(brutto)|replace(".", ",") }} €</span>
  </div>
</div>

<div class="footer">
  Angebot gültig für 30 Tage ab Ausstellungsdatum · Erstellt mit DachProfi AI · Alle Preise netto zzgl. gesetzlicher MwSt.
</div>

</body>
</html>
"""


@router.post("/projekt/{projekt_id}/pdf")
async def export_pdf(projekt_id: str, request: PDFRequest):
    """Generiert und gibt das Angebots-PDF zurück."""
    
    from datetime import date
    import random
    
    netto = sum(p.menge * p.ep for p in request.positionen)
    mwst = netto * 0.19
    brutto = netto + mwst
    
    # HTML rendern
    from jinja2 import Template
    template = Template(HTML_TEMPLATE)
    html = template.render(
        kunde="Kunde",  # TODO: aus DB laden
        adresse="Adresse",  # TODO: aus DB laden
        datum=date.today().strftime("%d.%m.%Y"),
        angebot_nr=f"AN-{date.today().year}-{random.randint(1000, 9999)}",
        positionen=request.positionen,
        anmerkung=request.anmerkung,
        netto=netto,
        mwst=mwst,
        brutto=brutto,
    )
    
    # PDF generieren
    try:
        from weasyprint import HTML
        pdf_bytes = HTML(string=html).write_pdf()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF-Generierung fehlgeschlagen: {e}")
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="Angebot_{projekt_id}.pdf"'
        }
    )
