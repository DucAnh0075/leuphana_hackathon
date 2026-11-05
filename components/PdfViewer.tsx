"use client";
import dynamic from "next/dynamic";

export type Doc = { title: string; url: string };
export type DocumentProvenance = { kind: string; label: string; url: string; version: string; note: string };
export type PdfViewerProps = {
  doc: Doc;
  initialPage?: number;
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
export default function PdfViewer(props: PdfViewerProps) {
  return <PdfContent key={props.doc.url + ":" + (props.initialPage ?? 1) + ":" + (props.evidenceId ?? props.sourceSection ?? "")} {...props} />;
}
