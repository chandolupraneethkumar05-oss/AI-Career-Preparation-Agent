import React, { useState, useRef } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Printer, Maximize2 } from 'lucide-react';
import ClassicAcademicTemplate from './templates/ClassicAcademicTemplate';
import ModernProfessionalTemplate from './templates/ModernProfessionalTemplate';
import ExecutiveMinimalTemplate from './templates/ExecutiveMinimalTemplate';

const TEMPLATE_COMPONENTS = {
  classic_academic: ClassicAcademicTemplate,
  modern_professional: ModernProfessionalTemplate,
  executive_minimal: ExecutiveMinimalTemplate,
};

export default function ResumePreview({
  content = {},
  templateId = 'modern_professional',
  accentColor = '#245A45',
  onPrint,
}) {
  const [zoom, setZoom] = useState(1.0);
  const printAreaRef = useRef(null);

  const SelectedTemplate = TEMPLATE_COMPONENTS[templateId] || ModernProfessionalTemplate;

  const handleZoomIn = () => setZoom(z => Math.min(1.5, Math.round((z + 0.1) * 10) / 10));
  const handleZoomOut = () => setZoom(z => Math.max(0.5, Math.round((z - 0.1) * 10) / 10));
  const handleResetZoom = () => setZoom(1.0);

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
      return;
    }
    window.print();
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 rounded-xl border border-slate-200 overflow-hidden shadow-inner">
      {/* Top Preview Controls Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-slate-200 text-slate-700 text-xs">
        <div className="flex items-center space-x-2 font-medium">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>A4 Live Preview</span>
          <span className="text-slate-400 font-mono text-[11px]">(210 × 297 mm)</span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Zoom Controls */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              title="Zoom Out"
              className="p-1 hover:bg-white rounded transition text-slate-600 disabled:opacity-40"
            >
              <ZoomOut size={14} />
            </button>
            <span className="px-2 font-mono text-[11px] min-w-[42px] text-center font-semibold text-slate-600">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 1.5}
              title="Zoom In"
              className="p-1 hover:bg-white rounded transition text-slate-600 disabled:opacity-40"
            >
              <ZoomIn size={14} />
            </button>
            <button
              onClick={handleResetZoom}
              title="Reset Zoom"
              className="p-1 hover:bg-white rounded transition text-slate-600 ml-0.5"
            >
              <RotateCcw size={13} />
            </button>
          </div>

          {/* Quick Print Button */}
          <button
            onClick={handlePrint}
            title="Export Vector PDF via Print"
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg shadow-sm transition text-xs"
          >
            <Printer size={13} />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Preview Viewport */}
      <div className="flex-1 overflow-auto p-4 sm:p-6 flex justify-center items-start print:p-0 print:m-0 print:overflow-visible">
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out',
          }}
          className="w-full max-w-[794px] print:max-w-none print:transform-none"
        >
          {/* A4 Sheet Container */}
          <div
            id="resume-print-area"
            ref={printAreaRef}
            className="w-full min-h-[1123px] bg-white rounded-lg shadow-xl border border-slate-200 relative overflow-hidden print:overflow-visible print:border-none print:shadow-none print:rounded-none print:min-h-0 print:m-0 print:p-0"
          >
            <SelectedTemplate content={content} accentColor={accentColor} />
          </div>
        </div>
      </div>

      {/* Print Stylesheet */}
      <style>{`
        @media print {
          /* Hide all top-level application body elements by default */
          body * {
            visibility: hidden !important;
          }

          /* Make only the resume print container and its descendants visible */
          #resume-print-area,
          #resume-print-area * {
            visibility: visible !important;
          }

          /* Reset ancestor container layout to allow natural multi-page document flow */
          html,
          body,
          #root,
          #root > div,
          main,
          div {
            height: auto !important;
            min-height: 0 !important;
          }

          /* Ensure parent scrollers do not clip printed pages */
          [class*="overflow-"] {
            overflow: visible !important;
          }

          /* Position print area at the document root in normal flow (not fixed) */
          #resume-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            min-height: 0 !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            background: white !important;
            overflow: visible !important;
            transform: none !important;
          }

          /* Standard A4 portrait paper with clean print margins */
          @page {
            size: A4 portrait;
            margin: 10mm;
          }

          /* Allow section containers to paginate naturally across pages */
          section {
            break-inside: auto !important;
            page-break-inside: auto !important;
          }

          section > div {
            break-inside: auto !important;
            page-break-inside: auto !important;
          }

          /* Prevent awkward page-breaks inside individual section items */
          section > div > div,
          section li {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          h1, h2, h3, h4 {
            break-after: avoid !important;
            page-break-after: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}
