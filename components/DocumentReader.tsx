"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import type { PdfViewerProps } from "./PdfViewer";
import { Icon } from "./Icons";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

function Thumbnail({ number, selected, onSelect, locale }: { number: number; selected: boolean; onSelect: () => void; locale: "de" | "en" }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: "160px" });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return <button ref={ref} className={"thumbnail" + (selected ? " selected" : "")} onClick={onSelect} aria-label={locale === "en" ? "Show page " + number : "Seite " + number + " anzeigen"} aria-current={selected ? "page" : undefined}>
    <span className="thumbnail-paper">{visible && <Page pageNumber={number} width={100} renderAnnotationLayer={false} renderTextLayer={false} suspense={false} loading={<span className="thumbnail-placeholder" />} error={<span>PDF</span>} />}</span>
    <span>{String(number).padStart(2, "0")}</span>
  </button>;
}

export default function PdfContent({ doc, locale = "de", initialPage = 1, sourceSection, sourceQuote, sourceCondition, sourceExclusions, sourcePerson, evidenceId, provenance, sourceTemplatePage }: PdfViewerProps) {
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
  const t = (de: string, en: string) => locale === "en" ? en : de;
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
  const pdfError = <div className="pdf-error" role="alert"><Icon name="document" width="40" height="40" /><h2>{password ? t("Dieses PDF ist passwortgeschützt.", "This PDF is password protected.") : t("Dieses Dokument konnte nicht geladen werden.", "This document could not be loaded.")}</h2><p>{password ? t("Öffnen Sie das Original mit Ihrem PDF-Programm.", "Open the original in your PDF app.") : t("Versuchen Sie es erneut oder öffnen Sie das Original.", "Try again or open the original document.")}</p><div className="error-actions">{!password && <button className="button primary" onClick={() => { setError(false); setPassword(false); setNumPages(0); setAttempt(value => value + 1); }}>{t("Erneut versuchen", "Try again")}</button>}<a className="button secondary" href={doc.url} target="_blank" rel="noopener noreferrer">{t("Original öffnen ↗", "Open original ↗")}</a></div></div>;
  return <div className="pdf-content" lang={locale} data-evidence-id={evidenceId}>
    {(sourceSection || sourceCondition) && <details className="source-evidence" open><summary>{sourceSection ? t("Belegstelle · Seite ", "Source · Page ") + initialPage + " · " + sourceSection : t("Geltungsbereich des Dokuments", "Document scope")}</summary>{sourcePerson && <p><strong>{t("Benannte Person:", "Named person:")}</strong> {sourcePerson}</p>}{sourceQuote && <blockquote lang="de">{sourceQuote}</blockquote>}{sourceCondition && <p><strong>{t("Voraussetzung:", "Condition:")}</strong> <span lang="de">{sourceCondition}</span></p>}{!!sourceExclusions?.length && <p><strong>{t("Nicht umfasst:", "Exclusions:")}</strong> <span lang="de">{sourceExclusions.join("; ")}</span></p>}</details>}
    {provenance && <details className="source-provenance"><summary>{t("Vorlagengrundlage: ", "Original template: ")}<span lang="de">{provenance.label}</span></summary><p lang="de">{provenance.version} · {provenance.note}</p>{provenance.url && <a href={provenance.url + (sourceTemplatePage ? "#page=" + sourceTemplatePage : "")} target="_blank" rel="noopener noreferrer">{t("Unveränderte Vorlage ansehen", "View unchanged template")}{sourceTemplatePage ? t(" · Seite ", " · Page ") + sourceTemplatePage : ""}</a>}</details>}
    <div className="reader-toolbar" aria-label={t("Dokumentwerkzeuge", "Document tools")}>
      <div className="toolbar-group"><button className="icon-button thumbnail-toggle" aria-label={t("Seitenvorschau", "Page thumbnails")} aria-expanded={thumbnails} onClick={() => setThumbnails(value => !value)}><Icon name="pages" /></button><span className="document-type">{t("PDF-DOKUMENT", "PDF document")}</span></div>
      <div className="toolbar-group zoom-controls"><button className="icon-button" aria-label={t("Verkleinern", "Zoom out")} disabled={!canZoomOut} onClick={() => changeZoom(-25)}><Icon name="minus" /></button><span className="zoom-value" aria-live="polite">{zoom === "fit" ? "Auto" : zoom + " %"}</span><button className="icon-button" aria-label={t("Vergrößern", "Zoom in")} disabled={!canZoomIn} onClick={() => changeZoom(25)}><Icon name="plus" /></button><span className="tool-divider" /><button className="icon-button" aria-label={t("An Breite anpassen", "Fit to width")} aria-pressed={zoom === "fit"} onClick={() => setZoom("fit")} disabled={!numPages || failed}><Icon name="expand" /></button></div>
      <a className="download-link" aria-label={t("Original-PDF öffnen oder herunterladen", "Open or download original PDF")} href={doc.url} download target="_blank" rel="noopener noreferrer"><Icon name="download" /><span>{t("Original öffnen", "Open original")}</span></a>
    </div>
    <Document key={attempt} file={doc.url} suspense={false} className={"pdf-document" + (thumbnails ? " show-thumbnails" : "")} onLoadSuccess={({ numPages }) => { setNumPages(numPages); setPage(Math.max(1, Math.min(numPages, initialPage))); }} onLoadError={() => setError(true)} onSourceError={() => setError(true)} onPassword={() => setPassword(true)} externalLinkTarget="_blank" onItemClick={({ pageNumber }) => { if (pageNumber) goTo(pageNumber); }} loading={password ? pdfError : <div className="pdf-loading" role="status"><span className="spinner" />{t("Das PDF wird geladen …", "Loading PDF…")}</div>} error={pdfError}>
      {failed ? pdfError : <>
        <aside ref={thumbnailRail} className="thumbnail-rail" aria-label={t("Seitenvorschau", "Page thumbnails")}><p className="rail-title">{t("SEITEN", "Pages")} <span>{numPages || "—"}</span></p>{Array.from({ length: numPages }, (_, index) => <Thumbnail key={index} number={index + 1} selected={page === index + 1} onSelect={() => goTo(index + 1)} locale={locale} />)}</aside>
        <div ref={viewport} className="page-viewport" tabIndex={0} role="region" aria-label={t("PDF-Lesebereich. Mit den Pfeiltasten blättern, mit Plus und Minus zoomen.", "PDF reading area. Use the arrow keys to change pages and plus or minus to zoom.")} onKeyDown={event => {
          if (event.ctrlKey || event.metaKey || event.altKey) return;
          if ((event.target as HTMLElement).closest("a, button, input, select, textarea, [contenteditable]")) return;
          if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); goTo(page + (event.key === "ArrowRight" ? 1 : -1)); }
          if (event.key === "+" || event.key === "-") { event.preventDefault(); changeZoom(event.key === "+" ? 25 : -25); }
        }}>
          <div className="page-sheet" lang="de"><Page key={page} pageNumber={page} width={zoom === "fit" ? fitWidth : undefined} scale={zoom === "fit" ? 1 : zoom / 100} onLoadSuccess={loadedPage => setPageWidth(loadedPage.originalWidth)} suspense={false} renderForms={false} loading={<div lang={locale} className="page-loading" role="status">{t("Seite wird geladen …", "Loading page…")}</div>} error={<p lang={locale} role="alert">{t("Diese Seite konnte nicht angezeigt werden. Bitte öffnen Sie das Original.", "This page could not be displayed. Open the original document.")}</p>} /></div>
          <p className="page-caption">{doc.title} <span>·</span> {t("Seite", "Page")} {page}</p>
        </div>
      </>}
    </Document>
    <footer className="page-navigation">
      <span className="navigation-tip">{t("Mit ", "Use ")}<kbd>←</kbd> <kbd>→</kbd>{t(" im Lesebereich blättern", " to change pages in the reading area")}</span>
      <div className="page-controls"><button className="icon-button" aria-label={t("Vorherige Seite", "Previous page")} disabled={page <= 1 || failed || !numPages} onClick={() => goTo(page - 1)}><Icon name="back" /></button><span className="page-count" aria-live="polite">{t("Seite", "Page")} <strong>{numPages ? page : "—"}</strong> {t("von", "of")} {numPages || "—"}</span><button className="icon-button" aria-label={t("Nächste Seite", "Next page")} disabled={!numPages || page >= numPages || failed} onClick={() => goTo(page + 1)}><Icon name="arrow" /></button></div>
      <span className="read-only"><Icon name="shield" width="16" height="16" /> {t("Leseansicht", "Read only")}</span>
    </footer>
  </div>;
}
