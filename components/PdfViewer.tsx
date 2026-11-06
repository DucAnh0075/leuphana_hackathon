"use client";
import dynamic from "next/dynamic";

export type Doc = { title: string; url: string };
export type PdfViewerProps = { doc: Doc; initialPage?: number; sourcePage?: number; sourceSection?: string; sourceQuote?: string; sourceCondition?: string; sourceExclusions?: string[]; onPageChange?: (page: number) => void };
const PdfContent = dynamic(() => import("./DocumentReader"), {
  ssr: false,
  loading: () => <div className="loading-screen" role="status"><span className="spinner" />Dokumentansicht wird vorbereitet …</div>,
});
export default function PdfViewer(props: PdfViewerProps) {
  return <PdfContent key={props.doc.url + ":" + (props.initialPage ?? 1) + ":" + (props.sourceSection ?? "")} {...props} />;
}
