"use client";

import { useEffect, useRef, useState } from "react";


import { Document, Page, pdfjs } from "react-pdf";
import type { PdfViewerProps } from "./PdfViewer";
import { Icon } from "./Icons";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

function Thumbnail({ number, selected, onSelect }: { number: number; selected: boolean; onSelect: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: "160px" });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return <button ref={ref} className={"thumbnail" + (selected ? " selected" : "")} onClick={onSelect} aria-label={"Seite " + number + " anzeigen"} aria-current={selected ? "page" : undefined}>
    <span className="thumbnail-paper">{visible && <Page pageNumber={number} width={100} renderAnnotationLayer={false} renderTextLayer={false} suspense={false} loading={<span className="thumbnail-placeholder" />} error={<span>PDF</span>} />}</span>
    <span>{String(number).padStart(2, "0")}</span>
  </button>;
}

export default function PdfContent({ doc, initialPage = 1, sourceSection, sourceQuote, sourceCondition, sourceExclusions, sourcePerson, evidenceId, provenance, sourceTemplatePage }: PdfViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(Math.max(1, initialPage));
  const [zoom, setZoom] = useState<number | "fit">("fit");
  const [width, setWidth] = useState(700);
  const [pageWidth, setPageWidth] = useState(0);
  const [thumbnails, setThumbnails] = useState(false);
  const [error, setError] = useState(false);
  const [password, setPassword] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const viewport = useRef<HTMLDivElement>(null);
  const thumbnailRail = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!viewport.current) return;
    const observer = new ResizeObserver(entries => setWidth(Math.max(200, entries[0].contentRect.width - 48)));
    observer.observe(viewport.current);
    return () => observer.disconnect();
  }, [numPages, error, password]);
  useEffect(() => {
    const rail = thumbnailRail.current;
    const selected = rail?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!rail || !selected) return;
    const revealSelected = () => {
      if (!rail.clientHeight) return;
      const railBounds = rail.getBoundingClientRect();
      const selectedBounds = selected.getBoundingClientRect();
      // Scroll only the rail; keep the reader focus and the outer page in place.
      if (selectedBounds.top < railBounds.top) rail.scrollTop += selectedBounds.top - railBounds.top;
      else if (selectedBounds.bottom > railBounds.bottom) rail.scrollTop += selectedBounds.bottom - railBounds.bottom;
    };
    revealSelected();
    // Lazy PDF rendering can change this thumbnail or an earlier thumbnail's height.
    const observer = new ResizeObserver(revealSelected);
    observer.observe(rail);
    rail.querySelectorAll(".thumbnail").forEach(thumbnail => observer.observe(thumbnail));
    return () => observer.disconnect();
  }, [page, thumbnails, numPages]);
  const goTo = (next: number) => {
    setPage(Math.max(1, Math.min(numPages, next)));
    if (viewport.current) viewport.current.scrollTop = 0;
  };
  const failed = error || password;
  const fitWidth = Math.min(width, 1000);
  const currentZoom = zoom === "fit" ? (pageWidth ? fitWidth / pageWidth * 100 : 0) : zoom;
  const canZoomOut = !!numPages && !failed && !!pageWidth && currentZoom > 50;
  const canZoomIn = !!numPages && !failed && !!pageWidth && currentZoom < 200;
  const changeZoom = (step: number) => {
    if (step < 0 ? !canZoomOut : !canZoomIn) return;
    setZoom(Math.max(50, Math.min(200, Math.round(currentZoom + step))));
  };
  const pdfError = <div className="pdf-error" role="alert"><Icon name="document" width="40" height="40" /><h2>{password ? "Dieses PDF ist passwortgeschützt." : "Dieses Dokument konnte nicht geladen werden."}</h2><p>{password ? "Öffnen Sie das Original mit Ihrem PDF-Programm." : "Versuchen Sie es erneut oder öffnen Sie das Original."}</p><div className="error-actions">{!password && <button className="button primary" onClick={() => { setError(false); setPassword(false); setNumPages(0); setAttempt(value => value + 1); }}>Erneut versuchen</button>}<a className="button secondary" href={doc.url} target="_blank" rel="noopener noreferrer">Original öffnen ↗</a></div></div>;
  return <div className="pdf-content" data-evidence-id={evidenceId}>
    {(sourceSection || sourceCondition) && <details className="source-evidence" open><summary>{sourceSection ? "Belegstelle · Seite " + initialPage + " · " + sourceSection : "Geltungsbereich des Dokuments"}</summary>{sourcePerson && <p><strong>Benannte Person:</strong> {sourcePerson}</p>}{sourceQuote && <blockquote>{sourceQuote}</blockquote>}{sourceCondition && <p><strong>Voraussetzung:</strong> {sourceCondition}</p>}{!!sourceExclusions?.length && <p><strong>Nicht umfasst:</strong> {sourceExclusions.join("; ")}</p>}</details>}
    {provenance && <details className="source-provenance"><summary>Vorlagengrundlage: {provenance.label}</summary><p>{provenance.version} · {provenance.note}</p>{provenance.url && <a href={provenance.url + (sourceTemplatePage ? "#page=" + sourceTemplatePage : "")} target="_blank" rel="noopener noreferrer">Unveränderte Vorlage ansehen{sourceTemplatePage ? " · Seite " + sourceTemplatePage : ""}</a>}</details>}
    <div className="reader-toolbar" aria-label="Dokumentwerkzeuge">
      <div className="toolbar-group"><button className="icon-button thumbnail-toggle" aria-label="Seitenvorschau" aria-expanded={thumbnails} onClick={() => setThumbnails(value => !value)}><Icon name="pages" /></button><span className="document-type">PDF-DOKUMENT</span></div>
      <div className="toolbar-group zoom-controls"><button className="icon-button" aria-label="Verkleinern" disabled={!canZoomOut} onClick={() => changeZoom(-25)}><Icon name="minus" /></button><span className="zoom-value" aria-live="polite">{zoom === "fit" ? "Auto" : zoom + " %"}</span><button className="icon-button" aria-label="Vergrößern" disabled={!canZoomIn} onClick={() => changeZoom(25)}><Icon name="plus" /></button><span className="tool-divider" /><button className="icon-button" aria-label="An Breite anpassen" aria-pressed={zoom === "fit"} onClick={() => setZoom("fit")} disabled={!numPages || failed}><Icon name="expand" /></button></div>
      <a className="download-link" aria-label="Original-PDF öffnen oder herunterladen" href={doc.url} download target="_blank" rel="noopener noreferrer"><Icon name="download" /><span>Original öffnen</span></a>
    </div>
    <Document key={attempt} file={doc.url} suspense={false} className={"pdf-document" + (thumbnails ? " show-thumbnails" : "")} onLoadSuccess={({ numPages }) => { setNumPages(numPages); setPage(Math.max(1, Math.min(numPages, initialPage))); }} onLoadError={() => setError(true)} onSourceError={() => setError(true)} onPassword={() => setPassword(true)} externalLinkTarget="_blank" onItemClick={({ pageNumber }) => { if (pageNumber) goTo(pageNumber); }} loading={password ? pdfError : <div className="pdf-loading" role="status"><span className="spinner" />Das PDF wird geladen …</div>} error={pdfError}>
      {failed ? pdfError : <>
        <aside ref={thumbnailRail} className="thumbnail-rail" aria-label="Seitenvorschau"><p className="rail-title">SEITEN <span>{numPages || "—"}</span></p>{Array.from({ length: numPages }, (_, index) => <Thumbnail key={index} number={index + 1} selected={page === index + 1} onSelect={() => goTo(index + 1)} />)}</aside>
        <div ref={viewport} className="page-viewport" tabIndex={0} role="region" aria-label="PDF-Lesebereich. Mit den Pfeiltasten blättern, mit Plus und Minus zoomen." onKeyDown={event => {
          if (event.ctrlKey || event.metaKey || event.altKey) return;
          if ((event.target as HTMLElement).closest("a, button, input, select, textarea, [contenteditable]")) return;
          if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); goTo(page + (event.key === "ArrowRight" ? 1 : -1)); }
          if (event.key === "+" || event.key === "-") { event.preventDefault(); changeZoom(event.key === "+" ? 25 : -25); }
        }}>
          <div className="page-sheet"><Page key={page} pageNumber={page} width={zoom === "fit" ? fitWidth : undefined} scale={zoom === "fit" ? 1 : zoom / 100} onLoadSuccess={loadedPage => setPageWidth(loadedPage.originalWidth)} suspense={false} renderForms={false} loading={<div className="page-loading" role="status">Seite wird geladen …</div>} error={<p role="alert">Diese Seite konnte nicht angezeigt werden. Bitte öffnen Sie das Original.</p>} /></div>
          <p className="page-caption">{doc.title} <span>·</span> Seite {page}</p>
        </div>
      </>}
    </Document>
    <footer className="page-navigation">
      <span className="navigation-tip">Mit <kbd>←</kbd> <kbd>→</kbd> im Lesebereich blättern</span>
      <div className="page-controls"><button className="icon-button" aria-label="Vorherige Seite" disabled={page <= 1 || failed || !numPages} onClick={() => goTo(page - 1)}><Icon name="back" /></button><span className="page-count" aria-live="polite">Seite <strong>{numPages ? page : "—"}</strong> von {numPages || "—"}</span><button className="icon-button" aria-label="Nächste Seite" disabled={!numPages || page >= numPages || failed} onClick={() => goTo(page + 1)}><Icon name="arrow" /></button></div>
      <span className="read-only"><Icon name="shield" width="16" height="16" /> Leseansicht</span>
    </footer>
  </div>;
}
