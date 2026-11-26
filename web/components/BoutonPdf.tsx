'use client';
import { useState } from 'react';
import type { Rapport } from '@/lib/rapport';
import { textePdf as c } from '@/lib/rapport';

/** Télécharge le rapport en PDF (A4), avec la même mise en forme que l'artefact. */
export function BoutonPdf({ rapport }: { rapport: Rapport }) {
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState('');
  async function telecharger() {
    setEnCours(true); setErreur('');
    try {
      const { jsPDF } = await import('jspdf');
      const { autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const W = doc.internal.pageSize.getWidth(), M = 40;
      const fin = () => (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
      doc.setFillColor(14, 27, 61); doc.rect(0, 0, W, 78, 'F');
      doc.setFillColor(201, 162, 39); doc.rect(0, 78, W, 3, 'F');
      doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.text('EMCV', M, 38);
      doc.setFontSize(12); doc.setFont('helvetica', 'normal'); doc.text(c(rapport.titre), M, 58);
      doc.setTextColor(20, 32, 61); doc.setFontSize(10); doc.text(c(`${rapport.periode} · ${rapport.genere}`), M, 102);
      let y = 122;
      for (const s of rapport.secs) {
        if (y > 700) { doc.addPage(); y = 50; }
        doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(36, 86, 200); doc.text(c(s.t), M, y); y += 8;
        autoTable(doc, { startY: y, margin: { left: M, right: M }, head: [['Indicateur', 'Valeur']], body: s.kpis.map(k => [c(k[0]), c(k[1])]), theme: 'grid',
          styles: { fontSize: 9.5, cellPadding: 5, textColor: [20, 32, 61] }, headStyles: { fillColor: [14, 27, 61], textColor: 255 }, columnStyles: { 1: { halign: 'right', cellWidth: 150 } } });
        y = fin() + 16;
        for (const tb of s.tables) {
          if (y > 740) { doc.addPage(); y = 50; }
          doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(20, 32, 61); doc.text(c(tb.t), M, y); y += 6;
          if (tb.rows.length) {
            autoTable(doc, { startY: y, margin: { left: M, right: M }, head: [tb.head.map(c)], body: tb.rows.map(r => r.map(c)), theme: 'striped',
              styles: { fontSize: 9, cellPadding: 4, textColor: [20, 32, 61] }, headStyles: { fillColor: [231, 236, 245], textColor: [20, 32, 61], fontStyle: 'bold' } });
            y = fin() + 16;
          } else { doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(85, 98, 130); doc.text('Aucune donnée sur la période.', M, y + 10); y += 24; }
        }
        y += 8;
      }
      const n = doc.getNumberOfPages();
      for (let i = 1; i <= n; i++) { doc.setPage(i); doc.setFontSize(8.5); doc.setTextColor(85, 98, 130); doc.text(c(`EMCV · ${rapport.titre}`), M, 820); doc.text(`Page ${i} / ${n}`, W - M, 820, { align: 'right' }); }
      doc.save(`Rapport EMCV ${rapport.a} au ${rapport.b}.pdf`);
    } catch {
      setErreur('Le PDF n\'a pas pu être créé. Réessayez.');
    } finally { setEnCours(false); }
  }
  return (
    <>
      <button className="btn" type="button" onClick={telecharger} disabled={enCours}>{enCours ? 'Préparation du PDF…' : 'Télécharger en PDF'}</button>
      {erreur && <span className="err" role="alert">{erreur}</span>}
    </>
  );
}
