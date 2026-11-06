"use client";
import dynamic from "next/dynamic";

export type Doc = { title: string; url: string };
export type DocumentProvenance = { kind: string; label: string; url: string; version: string; note: string };
export type PdfViewerProps = {
  doc: Doc;
  locale?: "de" | "en";
  initialPage?: number;
  sourcePage?: number;
  onPageChange?: (page: number) => void;
  evidenceId?: string;
  sourceSection?: string;
  sourceQuote?: string;
  sourcePerson?: string;
  sourceCondition?: string;
  sourceExclusions?: string[];
  sourceTemplatePage?: number;
  provenance?: DocumentProvenance;
};
const PdfContent = dynamic(() => import("./DocumentReader"), {
  ssr: false,
  loading: () => <div className="loading-screen" role="status"><span className="spinner" />Dokumentansicht wird vorbereitet …</div>,
});
const EnglishPdfContent = dynamic(() => import("./DocumentReader"), {
  ssr: false,
  loading: () => <div className="loading-screen" role="status"><span className="spinner" />Preparing document view…</div>,
});
export default function PdfViewer(props: PdfViewerProps) {
  const Content = props.locale === "en" ? EnglishPdfContent : PdfContent;
  return <Content key={props.doc.url + ":" + (props.initialPage ?? 1) + ":" + (props.evidenceId ?? props.sourceSection ?? "")} {...props} />;
}