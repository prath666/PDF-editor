import { useRef, useState, useCallback, useEffect } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import { encryptPDF } from "@pdfsmaller/pdf-encrypt-lite";
import Tesseract from "tesseract.js";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import "./PdfEditor.css";

pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

// ========== MAIN APP ==========
function PdfViewer() {
    const [mode, setMode] = useState("home");

    return (
        <div className="pdf-editor">
            {mode === "home" && <HomeScreen onNavigate={setMode} />}
            {mode === "annotate" && <AnnotateScreen onBack={() => setMode("home")} />}
            {mode === "merge" && <MergeScreen onBack={() => setMode("home")} />}
            {mode === "convert" && <ConvertScreen onBack={() => setMode("home")} />}
            {mode === "split" && <SplitScreen onBack={() => setMode("home")} />}
            {mode === "organize" && <OrganizeScreen onBack={() => setMode("home")} />}
            {mode === "protect" && <ProtectScreen onBack={() => setMode("home")} />}
            {mode === "unlock" && <UnlockScreen onBack={() => setMode("home")} />}
            {mode === "compress" && <CompressScreen onBack={() => setMode("home")} />}
            {mode === "extract" && <ExtractTextScreen onBack={() => setMode("home")} />}
            {mode === "sign" && <SignScreen onBack={() => setMode("home")} />}
            {mode === "watermark" && <WatermarkScreen onBack={() => setMode("home")} />}
            {mode === "pagenums" && <PageNumbersScreen onBack={() => setMode("home")} />}
            {mode === "crop" && <CropScreen onBack={() => setMode("home")} />}
            {mode === "pdftoword" && <PdfToWordScreen onBack={() => setMode("home")} />}
            {mode === "fillforms" && <FillFormsScreen onBack={() => setMode("home")} />}
            {mode === "flatten" && <FlattenScreen onBack={() => setMode("home")} />}
        </div>
    );
}

// ========== SVG ICONS ==========
const FeatureIcons = {
    annotate: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            <path d="m15 5 4 4" />
        </svg>
    ),
    merge: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="8" height="18" rx="2" />
            <rect x="14" y="3" width="8" height="18" rx="2" />
            <path d="M10 12h4" />
            <path d="m12 10 2 2-2 2" />
        </svg>
    ),
    split: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="2" x2="12" y2="22" />
            <path d="m8 6-4 4 4 4" />
            <path d="m16 6 4 4-4 4" />
        </svg>
    ),
    convert: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L2 9" />
            <path d="M2 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 15" />
            <polyline points="2 4 2 9 7 9" />
            <polyline points="22 20 22 15 17 15" />
        </svg>
    ),
    organize: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="2" width="7" height="9" rx="1.5" />
            <rect x="14" y="2" width="7" height="9" rx="1.5" />
            <rect x="3" y="13" width="7" height="9" rx="1.5" />
            <rect x="14" y="13" width="7" height="9" rx="1.5" />
        </svg>
    ),
    compress: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v8l4-4" />
            <path d="M12 2v8l-4-4" />
            <path d="M12 22v-8l4 4" />
            <path d="M12 22v-8l-4 4" />
            <rect x="3" y="8" width="18" height="8" rx="2" />
        </svg>
    ),
    protect: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M12 17a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" fill="#fff" />
            <path d="M8 11V7a4 4 0 1 1 8 0v4" />
        </svg>
    ),
    unlock: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M12 17a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" fill="#fff" />
            <path d="M16 11V7a4 4 0 0 0-7.9-.7" />
        </svg>
    ),
    extract: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="8" y1="13" x2="16" y2="13" />
            <line x1="8" y1="17" x2="13" y2="17" />
        </svg>
    ),
    sign: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 17c1.5-1.5 3-2 4.5-1s2.5 2.5 4 1.5 2-3 3.5-3 2 1 3.5.5 2.5-2 4.5-2" />
            <path d="M17 3l4 4-10 10H7v-4Z" />
        </svg>
    ),
    watermark: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2" />
            <path d="M2 12h20" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10" />
        </svg>
    ),
    pagenums: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
            <path d="M12 16v-4" />
            <path d="M10 12h2" />
            <line x1="8" y1="20" x2="8" y2="22" />
            <line x1="12" y1="20" x2="12" y2="22" />
            <line x1="16" y1="20" x2="16" y2="22" />
        </svg>
    ),
    crop: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2v4H2" />
            <path d="M18 22v-4h4" />
            <path d="M6 6h12a2 2 0 0 1 2 2v8" />
            <path d="M18 18H6a2 2 0 0 1-2-2V8" />
        </svg>
    ),
    pdftoword: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
            <polyline points="14 2 14 8 20 8" />
            <path d="M9 15v-2h6v2" />
            <path d="M12 13v4" />
        </svg>
    ),
    fillforms: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M7 7h4" />
            <path d="M7 12h10" />
            <path d="M7 17h6" />
            <circle cx="17" cy="7" r="1" fill="#fff" />
        </svg>
    ),
    flatten: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <polyline points="8 8 12 4 16 8" />
            <polyline points="8 16 12 20 16 16" />
        </svg>
    ),
};

// ========== HOME SCREEN ==========
function HomeScreen({ onNavigate }) {
    const features = [
        { id: "annotate", title: "Annotate", desc: "Add text, draw, highlight & redact", color: "orange" },
        { id: "merge", title: "Merge", desc: "Combine multiple files into one PDF", color: "blue" },
        { id: "split", title: "Split", desc: "Extract or split pages from a PDF", color: "red" },
        { id: "convert", title: "Convert", desc: "PDF ↔ Image conversion", color: "cyan" },
        { id: "organize", title: "Organize", desc: "Reorder, delete & rotate pages", color: "purple" },
        { id: "compress", title: "Compress", desc: "Reduce PDF file size", color: "green" },
        { id: "protect", title: "Protect", desc: "Add password to your PDF", color: "yellow" },
        { id: "unlock", title: "Unlock", desc: "Remove password from PDF", color: "teal" },
        { id: "extract", title: "Extract Text", desc: "Export text with OCR support", color: "pink" },
        { id: "sign", title: "Sign PDF", desc: "Draw or add signature to PDF", color: "orange" },
        { id: "watermark", title: "Watermark", desc: "Add text watermark to pages", color: "blue" },
        { id: "pagenums", title: "Page Numbers", desc: "Add page numbers to PDF", color: "purple" },
        { id: "crop", title: "Crop Pages", desc: "Crop or trim page margins", color: "green" },
        { id: "pdftoword", title: "PDF to Word", desc: "Convert PDF to .docx file", color: "cyan" },
        { id: "fillforms", title: "Fill Forms", desc: "Fill interactive PDF forms", color: "yellow" },
        { id: "flatten", title: "Flatten", desc: "Flatten annotations & forms", color: "red" },
    ];

    return (
        <div className="home-screen">
            <div className="home-hero">
                <div className="hero-badge">⚡ All-in-One PDF Toolkit</div>
                <h2>PDF Editor <span className="hero-gradient">Pro</span></h2>
                <p>All the tools you need to work with PDFs — right in your browser. Fast, private, and free.</p>
            </div>
            <div className="home-cards">
                {features.map(f => (
                    <div key={f.id} className="feature-card" data-color={f.color} onClick={() => onNavigate(f.id)}>
                        <div className="feature-icon">{FeatureIcons[f.id]}</div>
                        <h3>{f.title}</h3>
                        <p>{f.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ========== ANNOTATE SCREEN ==========
function AnnotateScreen({ onBack }) {
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);
    const containerRef = useRef(null);

    const [pdfDoc, setPdfDoc] = useState(null);
    const [pdfFile, setPdfFile] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [scale] = useState(1.5);
    const [viewport, setViewport] = useState(null);

    // Text items: both extracted (from PDF) and user-added
    const [textItems, setTextItems] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [showInput, setShowInput] = useState(null);
    const [inputValue, setInputValue] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editValue, setEditValue] = useState("");

    // Text style controls
    const [fontSize, setFontSize] = useState(16);
    const [fontColor, setFontColor] = useState("#000000");
    const [fontBold, setFontBold] = useState(false);

    // Drag state
    const [dragging, setDragging] = useState(null);
    const [dragStart, setDragStart] = useState(null);

    // Upload drag-drop
    const [dragOver, setDragOver] = useState(false);

    // Tool mode: "select" | "add" | "draw" | "highlight" | "redact"
    const [toolMode, setToolMode] = useState("select");

    // Drawing state
    const [drawings, setDrawings] = useState([]); // { page, paths: [{x,y}], color, width }
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentPath, setCurrentPath] = useState([]);
    const [drawColor, setDrawColor] = useState("#000000");
    const [drawWidth, setDrawWidth] = useState(3);

    // Highlight/Redact rectangles
    const [annotations, setAnnotations] = useState([]); // { page, type, x, y, w, h }
    const [rectStart, setRectStart] = useState(null);

    // Load PDF
    const loadPdf = useCallback(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        setPdfFile(arrayBuffer);

        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setCurrentPage(1);
        setTextItems([]);
        setSelectedId(null);
        setEditingId(null);
    }, []);

    // Render page + extract text
    useEffect(() => {
        if (!pdfDoc) return;

        const renderPage = async () => {
            const page = await pdfDoc.getPage(currentPage);
            const vp = page.getViewport({ scale });
            setViewport(vp);

            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext("2d");
            canvas.width = vp.width;
            canvas.height = vp.height;

            await page.render({ canvasContext: ctx, viewport: vp }).promise;

            // Extract existing text from this page
            const textContent = await page.getTextContent();
            const existingOnPage = textItems.filter(
                (t) => t.page === currentPage && t.source === "extracted"
            );

            // Only extract if we haven't already for this page
            if (existingOnPage.length === 0) {
                const extracted = [];
                for (const item of textContent.items) {
                    if (!item.str || !item.str.trim()) continue;

                    // Convert PDF coordinates to screen coordinates
                    const tx = pdfjsLib.Util.transform(vp.transform, item.transform);
                    const x = tx[4];
                    const y = tx[5];
                    const fSize = Math.sqrt(tx[2] * tx[2] + tx[3] * tx[3]);

                    extracted.push({
                        id: `ext_${currentPage}_${Math.random().toString(36).substr(2, 9)}`,
                        text: item.str,
                        x: x,
                        y: y - fSize,
                        fontSize: fSize,
                        color: "#000000",
                        bold: false,
                        page: currentPage,
                        source: "extracted",
                        originalX: x,
                        originalY: y - fSize,
                        originalText: item.str,
                        deleted: false,
                        modified: false,
                        width: item.width * scale,
                        height: item.height * scale || fSize * 1.2,
                    });
                }

                if (extracted.length > 0) {
                    setTextItems((prev) => [...prev, ...extracted]);
                }
            }
        };

        renderPage();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pdfDoc, currentPage, scale]);

    // Handle canvas click
    const handleCanvasClick = (e) => {
        if (dragging) return;
        if (toolMode === "draw" || toolMode === "highlight" || toolMode === "redact") return;
        if (editingId) {
            finishEditing();
            return;
        }

        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (toolMode === "add") {
            setSelectedId(null);
            setShowInput({ x, y });
            setInputValue("");
        } else {
            setSelectedId(null);
        }
    };

    // Drawing handlers
    const handleDrawStart = (e) => {
        if (toolMode !== "draw" && toolMode !== "highlight" && toolMode !== "redact") return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (toolMode === "draw") {
            setIsDrawing(true);
            setCurrentPath([{ x, y }]);
        } else {
            setRectStart({ x, y });
        }
    };

    const handleDrawMove = (e) => {
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (toolMode === "draw" && isDrawing) {
            setCurrentPath(prev => [...prev, { x, y }]);
        } else if ((toolMode === "highlight" || toolMode === "redact") && rectStart) {
            // Live preview handled via rectStart state
            setRectStart(prev => ({ ...prev, cx: x, cy: y }));
        }
    };

    const handleDrawEnd = (e) => {
        if (toolMode === "draw" && isDrawing && currentPath.length > 1) {
            setDrawings(prev => [...prev, { page: currentPage, path: currentPath, color: drawColor, width: drawWidth }]);
            setCurrentPath([]);
            setIsDrawing(false);
        } else if ((toolMode === "highlight" || toolMode === "redact") && rectStart && rectStart.cx !== undefined) {
            const rx = Math.min(rectStart.x, rectStart.cx);
            const ry = Math.min(rectStart.y, rectStart.cy);
            const rw = Math.abs(rectStart.cx - rectStart.x);
            const rh = Math.abs(rectStart.cy - rectStart.y);
            if (rw > 5 && rh > 5) {
                setAnnotations(prev => [...prev, { id: `ann_${Date.now()}`, page: currentPage, type: toolMode, x: rx, y: ry, w: rw, h: rh }]);
            }
            setRectStart(null);
        } else {
            setIsDrawing(false);
            setRectStart(null);
        }
    };

    // Helper: path to SVG d attribute
    const pathToD = (pts) => {
        if (pts.length === 0) return "";
        return pts.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ");
    };

    // Add new text item
    const addTextItem = () => {
        if (!inputValue.trim()) {
            setShowInput(null);
            return;
        }

        const newItem = {
            id: `new_${Date.now()}`,
            text: inputValue,
            x: showInput.x,
            y: showInput.y,
            fontSize,
            color: fontColor,
            bold: fontBold,
            page: currentPage,
            source: "added",
            deleted: false,
            modified: false,
        };

        setTextItems((prev) => [...prev, newItem]);
        setShowInput(null);
        setInputValue("");
        setSelectedId(newItem.id);
    };

    // Delete text item (mark extracted as deleted, remove added ones)
    const deleteTextItem = (id) => {
        setTextItems((prev) =>
            prev.map((item) => {
                if (item.id !== id) return item;
                if (item.source === "extracted") {
                    return { ...item, deleted: true };
                }
                return null;
            }).filter(Boolean)
        );
        if (selectedId === id) setSelectedId(null);
        if (editingId === id) setEditingId(null);
    };

    // Start editing a text item
    const startEditing = (id) => {
        const item = textItems.find((t) => t.id === id);
        if (!item || item.deleted) return;
        setEditingId(id);
        setEditValue(item.text);
        setSelectedId(id);
    };

    // Finish editing
    const finishEditing = () => {
        if (!editingId) return;

        setTextItems((prev) =>
            prev.map((item) => {
                if (item.id !== editingId) return item;
                const newText = editValue.trim();
                if (!newText) {
                    // If text cleared, mark as deleted
                    if (item.source === "extracted") {
                        return { ...item, deleted: true, text: "" };
                    }
                    return null; // Remove added items
                }
                return {
                    ...item,
                    text: newText,
                    modified: item.source === "extracted" ? true : item.modified,
                };
            }).filter(Boolean)
        );
        setEditingId(null);
        setEditValue("");
    };

    // Drag-to-move
    const handleOverlayMouseDown = (e, id) => {
        e.stopPropagation();
        if (editingId === id) return; // Don't drag while editing
        setSelectedId(id);
        setDragging(id);
        setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = useCallback(
        (e) => {
            if (!dragging || !dragStart) return;
            const dx = e.clientX - dragStart.x;
            const dy = e.clientY - dragStart.y;

            setTextItems((prev) =>
                prev.map((item) =>
                    item.id === dragging
                        ? { ...item, x: item.x + dx, y: item.y + dy, modified: true }
                        : item
                )
            );
            setDragStart({ x: e.clientX, y: e.clientY });
        },
        [dragging, dragStart]
    );

    const handleMouseUp = useCallback(() => {
        setDragging(null);
        setDragStart(null);
    }, []);

    useEffect(() => {
        if (dragging) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
        }
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [dragging, handleMouseMove, handleMouseUp]);

    // ===== SAVE PDF =====
    const savePdf = async () => {
        if (!pdfFile) return;

        const pdfDocLib = await PDFDocument.load(pdfFile);
        const pages = pdfDocLib.getPages();

        const hexToRgb = (hex) => {
            const r = parseInt(hex.slice(1, 3), 16) / 255;
            const g = parseInt(hex.slice(3, 5), 16) / 255;
            const b = parseInt(hex.slice(5, 7), 16) / 255;
            return rgb(r, g, b);
        };

        // Process each page
        for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
            const pageNum = pageIdx + 1;
            const page = pages[pageIdx];
            const { width: pageW, height: pageH } = page.getSize();
            const scaleX = pageW / (viewport?.width || pageW);
            const scaleY = pageH / (viewport?.height || pageH);

            const pageItems = textItems.filter((t) => t.page === pageNum);

            for (const item of pageItems) {
                if (item.source === "extracted" && (item.deleted || item.modified)) {
                    // White-out original text position
                    const origX = (item.originalX || item.x) * scaleX;
                    const origY = pageH - (item.originalY || item.y) * scaleY;
                    const ww = (item.width || 100) * scaleX;
                    const hh = (item.height || item.fontSize * 1.2) * scaleY;

                    page.drawRectangle({
                        x: origX - 2,
                        y: origY - hh + item.fontSize * scaleX * 0.3,
                        width: ww + 4,
                        height: hh + 4,
                        color: rgb(1, 1, 1),
                    });
                }

                // Draw text if not deleted
                if (!item.deleted) {
                    if (item.source === "added" || (item.source === "extracted" && item.modified)) {
                        const drawX = item.x * scaleX;
                        const drawY = pageH - item.y * scaleY - item.fontSize * scaleX;

                        page.drawText(item.text, {
                            x: drawX,
                            y: drawY,
                            size: item.fontSize * scaleX,
                            color: hexToRgb(item.color),
                        });
                    }
                }
            }

            // Draw freehand lines
            const pageDrawings = drawings.filter(d => d.page === pageNum);
            for (const drawing of pageDrawings) {
                if (drawing.path.length < 2) continue;
                for (let i = 1; i < drawing.path.length; i++) {
                    const p1 = drawing.path[i - 1];
                    const p2 = drawing.path[i];
                    page.drawLine({
                        start: { x: p1.x * scaleX, y: pageH - p1.y * scaleY },
                        end: { x: p2.x * scaleX, y: pageH - p2.y * scaleY },
                        thickness: drawing.width * scaleX,
                        color: hexToRgb(drawing.color),
                    });
                }
            }

            // Draw highlight/redact annotations
            const pageAnnotations = annotations.filter(a => a.page === pageNum);
            for (const ann of pageAnnotations) {
                if (ann.type === "redact") {
                    page.drawRectangle({
                        x: ann.x * scaleX,
                        y: pageH - (ann.y + ann.h) * scaleY,
                        width: ann.w * scaleX,
                        height: ann.h * scaleY,
                        color: rgb(0, 0, 0),
                    });
                } else if (ann.type === "highlight") {
                    page.drawRectangle({
                        x: ann.x * scaleX,
                        y: pageH - (ann.y + ann.h) * scaleY,
                        width: ann.w * scaleX,
                        height: ann.h * scaleY,
                        color: rgb(0.98, 0.8, 0.08),
                        opacity: 0.35,
                    });
                }
            }
        }

        const pdfBytes = await pdfDocLib.save();
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "annotated.pdf";
        link.click();
        URL.revokeObjectURL(link.href);
    };

    // Drag-and-drop file handling
    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type === "application/pdf") loadPdf(file);
    };

    const handleInputKeyDown = (e) => {
        if (e.key === "Enter") addTextItem();
        if (e.key === "Escape") setShowInput(null);
    };

    const handleEditKeyDown = (e) => {
        if (e.key === "Enter") finishEditing();
        if (e.key === "Escape") {
            setEditingId(null);
            setEditValue("");
        }
    };

    // Current page items (visible, not deleted)
    const pageTextItems = textItems.filter(
        (t) => t.page === currentPage && !t.deleted
    );
    const deletedCount = textItems.filter(
        (t) => t.page === currentPage && t.deleted
    ).length;

    // ===== UPLOAD SCREEN =====
    if (!pdfDoc) {
        return (
            <div
                className="upload-zone"
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
            >
                <div style={{ position: "absolute", top: 20, left: 20 }}>
                    <button className="btn btn-secondary" onClick={onBack}>← Back</button>
                </div>
                <div
                    className={`upload-card ${dragOver ? "drag-over" : ""}`}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div className="upload-icon">✏️</div>
                    <h2>Open a PDF to Annotate</h2>
                    <p>Add text, draw, highlight, or redact on your PDF</p>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="application/pdf"
                        style={{ display: "none" }}
                        onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) loadPdf(f);
                        }}
                    />
                    <span className="btn btn-primary">Choose File</span>
                </div>
            </div>
        );
    }

    // ===== EDITOR SCREEN =====
    return (
        <>
            {/* Toolbar */}
            <div className="annotate-toolbar">
                <button className="btn btn-secondary" onClick={onBack} style={{ marginRight: 8 }}>← Back</button>
                <button className={`annotate-tool-btn ${toolMode === "select" ? "active" : ""}`} onClick={() => setToolMode("select")}>
                    👆 Select
                </button>
                <button className={`annotate-tool-btn ${toolMode === "add" ? "active" : ""}`} onClick={() => setToolMode("add")}>
                    Aa Text
                </button>
                <button className={`annotate-tool-btn ${toolMode === "draw" ? "active" : ""}`} onClick={() => setToolMode("draw")}>
                    🖊️ Draw
                </button>
                <button className={`annotate-tool-btn ${toolMode === "highlight" ? "active" : ""}`} onClick={() => setToolMode("highlight")}>
                    🟡 Highlight
                </button>
                <button className={`annotate-tool-btn ${toolMode === "redact" ? "active" : ""}`} onClick={() => setToolMode("redact")}>
                    ⬛ Redact
                </button>

                <div className="toolbar-divider" />

                {toolMode === "add" && (
                    <>
                        <div className="toolbar-group">
                            <span className="toolbar-label">Size</span>
                            <select className="toolbar-select" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))}>
                                {[10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64].map(s => (
                                    <option key={s} value={s}>{s}px</option>
                                ))}
                            </select>
                        </div>
                        <div className="toolbar-group">
                            <span className="toolbar-label">Color</span>
                            <div className="color-picker-wrapper">
                                <input type="color" value={fontColor} onChange={(e) => setFontColor(e.target.value)} />
                            </div>
                        </div>
                        <div className="toolbar-group">
                            <button className={`btn-icon ${fontBold ? "active" : ""}`} onClick={() => setFontBold(b => !b)} title="Bold">
                                <b>B</b>
                            </button>
                        </div>
                    </>
                )}

                {toolMode === "draw" && (
                    <>
                        <div className="toolbar-group">
                            <span className="toolbar-label">Color</span>
                            <div className="color-picker-wrapper">
                                <input type="color" value={drawColor} onChange={(e) => setDrawColor(e.target.value)} />
                            </div>
                        </div>
                        <div className="toolbar-group">
                            <span className="toolbar-label">Width</span>
                            <select className="toolbar-select" value={drawWidth} onChange={(e) => setDrawWidth(Number(e.target.value))}>
                                {[1, 2, 3, 5, 8, 12].map(w => (
                                    <option key={w} value={w}>{w}px</option>
                                ))}
                            </select>
                        </div>
                    </>
                )}

                <div style={{ flex: 1 }} />

                <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
                    📁 Open New
                </button>
                <button className="btn btn-primary" onClick={savePdf}>
                    ⬇ Download PDF
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    style={{ display: "none" }}
                    onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) loadPdf(f);
                    }}
                />
            </div>

            {/* Body */}
            <div className="editor-body">
                {/* Canvas Area */}
                <div className="canvas-area">
                    {totalPages > 1 && (
                        <div className="page-nav">
                            <button
                                className="btn btn-secondary"
                                disabled={currentPage <= 1}
                                onClick={() => setCurrentPage((p) => p - 1)}
                            >
                                ◀ Prev
                            </button>
                            <span className="page-info">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                className="btn btn-secondary"
                                disabled={currentPage >= totalPages}
                                onClick={() => setCurrentPage((p) => p + 1)}
                            >
                                Next ▶
                            </button>
                        </div>
                    )}

                    {/* Canvas + overlays */}
                    <div
                        ref={containerRef}
                        className="canvas-container"
                        onClick={handleCanvasClick}
                        onMouseDown={handleDrawStart}
                        onMouseMove={handleDrawMove}
                        onMouseUp={handleDrawEnd}
                        onMouseLeave={handleDrawEnd}
                        style={{ cursor: toolMode === "draw" ? "crosshair" : toolMode === "highlight" || toolMode === "redact" ? "crosshair" : toolMode === "add" ? "text" : "default" }}
                    >
                        <canvas ref={canvasRef} />

                        {/* Highlight/Redact annotations */}
                        {annotations.filter(a => a.page === currentPage).map(a => (
                            <div
                                key={a.id}
                                style={{
                                    position: "absolute",
                                    left: a.x,
                                    top: a.y,
                                    width: a.w,
                                    height: a.h,
                                    background: a.type === "highlight" ? "rgba(250, 204, 21, 0.35)" : "#000",
                                    borderRadius: 2,
                                    pointerEvents: "none",
                                }}
                            />
                        ))}

                        {/* Live rectangle preview */}
                        {rectStart && rectStart.cx !== undefined && (
                            <div style={{
                                position: "absolute",
                                left: Math.min(rectStart.x, rectStart.cx),
                                top: Math.min(rectStart.y, rectStart.cy),
                                width: Math.abs(rectStart.cx - rectStart.x),
                                height: Math.abs(rectStart.cy - rectStart.y),
                                background: toolMode === "highlight" ? "rgba(250, 204, 21, 0.3)" : "rgba(0,0,0,0.5)",
                                border: `1px dashed ${toolMode === "highlight" ? "#eab308" : "#666"}`,
                                pointerEvents: "none",
                            }} />
                        )}

                        {/* SVG drawing overlay */}
                        <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
                            {drawings.filter(d => d.page === currentPage).map((d, i) => (
                                <path key={i} d={pathToD(d.path)} stroke={d.color} strokeWidth={d.width} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                            ))}
                            {isDrawing && currentPath.length > 0 && (
                                <path d={pathToD(currentPath)} stroke={drawColor} strokeWidth={drawWidth} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                            )}
                        </svg>

                        {/* Text overlays */}
                        {pageTextItems.map((item) => (
                            <div
                                key={item.id}
                                className={`text-overlay ${selectedId === item.id ? "selected" : ""} ${item.source === "extracted" ? "extracted" : "added"
                                    } ${item.modified ? "modified" : ""}`}
                                style={{
                                    left: item.x,
                                    top: item.y,
                                    fontSize: item.fontSize,
                                    color: (item.source === "extracted" && !item.modified) ? "transparent" : item.color,
                                    fontWeight: item.bold ? 700 : 400,
                                    backgroundColor: (item.source === "extracted" && item.modified) ? "var(--bg-card)" : "transparent",
                                    padding: (item.source === "extracted" && item.modified) ? "0 4px" : "0",
                                    borderRadius: (item.source === "extracted" && item.modified) ? "4px" : "0",
                                    pointerEvents: "auto", // Ensure clicks register even if transparent
                                }}
                                onMouseDown={(e) => handleOverlayMouseDown(e, item.id)}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedId(item.id);
                                }}
                                onDoubleClick={(e) => {
                                    e.stopPropagation();
                                    startEditing(item.id);
                                }}
                            >
                                {editingId === item.id ? (
                                    <input
                                        className="inline-edit-input"
                                        type="text"
                                        autoFocus
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        onKeyDown={handleEditKeyDown}
                                        onBlur={finishEditing}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{
                                            fontSize: item.fontSize,
                                            color: item.color,
                                            fontWeight: item.bold ? 700 : 400,
                                        }}
                                    />
                                ) : (
                                    item.text
                                )}
                                {selectedId === item.id && editingId !== item.id && (
                                    <div className="overlay-actions">
                                        <button
                                            className="overlay-btn edit"
                                            onClick={(e) => { e.stopPropagation(); startEditing(item.id); }}
                                            title="Edit"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            className="overlay-btn delete"
                                            onClick={(e) => { e.stopPropagation(); deleteTextItem(item.id); }}
                                            title="Delete"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Add text popup */}
                        {showInput && (
                            <div
                                className="text-input-popup"
                                style={{ left: showInput.x, top: showInput.y }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <input
                                    type="text"
                                    autoFocus
                                    placeholder="Type text here…"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={handleInputKeyDown}
                                />
                                <div className="popup-actions">
                                    <button className="btn btn-primary" onClick={addTextItem}>Add</button>
                                    <button className="btn btn-secondary" onClick={() => setShowInput(null)}>Cancel</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="editor-sidebar">
                    <div className="sidebar-header">
                        <h3>Text Layers ({pageTextItems.length})</h3>
                        {deletedCount > 0 && (
                            <span className="deleted-badge">{deletedCount} removed</span>
                        )}
                    </div>
                    <div className="sidebar-list">
                        {pageTextItems.length === 0 ? (
                            <div className="sidebar-empty">
                                {toolMode === "add"
                                    ? "Click on the PDF to add text"
                                    : "Double-click existing text to edit it"}
                            </div>
                        ) : (
                            pageTextItems.map((item) => (
                                <div
                                    key={item.id}
                                    className={`sidebar-item ${selectedId === item.id ? "active" : ""}`}
                                    onClick={() => setSelectedId(item.id)}
                                    onDoubleClick={() => startEditing(item.id)}
                                >
                                    <div className="item-info">
                                        <span className="item-text" style={{ color: item.color }}>
                                            {item.text}
                                        </span>
                                        <span className="item-badge">
                                            {item.source === "extracted"
                                                ? item.modified
                                                    ? "edited"
                                                    : "original"
                                                : "added"}
                                        </span>
                                    </div>
                                    <button
                                        className="btn-icon item-delete"
                                        onClick={(e) => { e.stopPropagation(); deleteTextItem(item.id); }}
                                        title="Delete"
                                        style={{ width: 24, height: 24, fontSize: 12 }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

// ========== MERGE SCREEN ==========
function MergeScreen({ onBack }) {
    const [mergeFiles, setMergeFiles] = useState([]);
    const [merging, setMerging] = useState(false);
    const mergeInputRef = useRef(null);
    const [dragOver, setDragOver] = useState(false);
    const [dragIdx, setDragIdx] = useState(null);

    const isImage = (file) => file.type.startsWith("image/");

    const addFiles = async (files) => {
        const newFiles = [];
        for (const file of files) {
            const isPdf = file.type === "application/pdf";
            const isImg = isImage(file);
            if (!isPdf && !isImg) continue;

            const arrayBuffer = await file.arrayBuffer();

            if (isPdf) {
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
                const page = await pdf.getPage(1);
                const vp = page.getViewport({ scale: 0.3 });
                const canvas = document.createElement("canvas");
                canvas.width = vp.width;
                canvas.height = vp.height;
                const ctx = canvas.getContext("2d");
                await page.render({ canvasContext: ctx, viewport: vp }).promise;
                const thumbnail = canvas.toDataURL();

                newFiles.push({
                    id: `merge_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    name: file.name,
                    type: "pdf",
                    data: arrayBuffer,
                    pages: pdf.numPages,
                    thumbnail,
                });
            } else {
                // Image file — create thumbnail and store data
                const thumbnail = await new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement("canvas");
                        const maxH = 120;
                        const ratio = maxH / img.height;
                        canvas.width = img.width * ratio;
                        canvas.height = maxH;
                        const ctx = canvas.getContext("2d");
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        resolve(canvas.toDataURL());
                        URL.revokeObjectURL(img.src);
                    };
                    img.src = URL.createObjectURL(file);
                });

                newFiles.push({
                    id: `merge_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    name: file.name,
                    type: "image",
                    imageType: file.type,
                    data: arrayBuffer,
                    pages: 1,
                    thumbnail,
                });
            }
        }
        setMergeFiles((prev) => [...prev, ...newFiles]);
    };

    const removeFile = (id) => {
        setMergeFiles((prev) => prev.filter((f) => f.id !== id));
    };

    const moveFile = (fromIdx, toIdx) => {
        setMergeFiles((prev) => {
            const arr = [...prev];
            const [item] = arr.splice(fromIdx, 1);
            arr.splice(toIdx, 0, item);
            return arr;
        });
    };

    const mergePdfs = async () => {
        if (mergeFiles.length < 2) return;
        setMerging(true);

        try {
            const mergedPdf = await PDFDocument.create();

            for (const file of mergeFiles) {
                if (file.type === "pdf") {
                    const srcPdf = await PDFDocument.load(file.data);
                    const copiedPages = await mergedPdf.copyPages(srcPdf, srcPdf.getPageIndices());
                    for (const page of copiedPages) {
                        mergedPdf.addPage(page);
                    }
                } else if (file.type === "image") {
                    // Embed image as a full PDF page
                    let img;
                    if (file.imageType === "image/png") {
                        img = await mergedPdf.embedPng(file.data);
                    } else {
                        img = await mergedPdf.embedJpg(file.data);
                    }
                    const { width, height } = img.scale(1);
                    const page = mergedPdf.addPage([width, height]);
                    page.drawImage(img, { x: 0, y: 0, width, height });
                }
            }

            const pdfBytes = await mergedPdf.save();
            const blob = new Blob([pdfBytes], { type: "application/pdf" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "merged.pdf";
            link.click();
            URL.revokeObjectURL(link.href);
        } catch (err) {
            console.error("Merge failed:", err);
        }

        setMerging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files?.length) {
            addFiles(Array.from(e.dataTransfer.files));
        }
    };

    // Drag reorder handlers
    const handleDragStart = (idx) => setDragIdx(idx);
    const handleDragOver = (e, idx) => {
        e.preventDefault();
        if (dragIdx !== null && dragIdx !== idx) {
            moveFile(dragIdx, idx);
            setDragIdx(idx);
        }
    };
    const handleDragEnd = () => setDragIdx(null);

    return (
        <div className="merge-screen">
            <button className="btn btn-secondary" onClick={onBack} style={{ alignSelf: "flex-start", marginBottom: 16 }}>← Back</button>
            {/* Upload area */}
            <div
                className={`merge-upload ${dragOver ? "drag-over" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => mergeInputRef.current?.click()}
            >
                <span className="merge-upload-icon">📄 +</span>
                <p>Click or drag PDFs & images here to add them</p>
                <input
                    ref={mergeInputRef}
                    type="file"
                    accept="application/pdf,image/*"
                    multiple
                    style={{ display: "none" }}
                    onChange={(e) => {
                        if (e.target.files?.length) addFiles(Array.from(e.target.files));
                        e.target.value = "";
                    }}
                />
            </div>

            {/* File list */}
            {mergeFiles.length > 0 && (
                <div className="merge-list">
                    <div className="merge-list-header">
                        <h3>Files to Merge ({mergeFiles.length})</h3>
                        <span className="merge-hint">Drag to reorder</span>
                    </div>
                    <div className="merge-items">
                        {mergeFiles.map((file, idx) => (
                            <div
                                key={file.id}
                                className={`merge-item ${dragIdx === idx ? "dragging" : ""}`}
                                draggable
                                onDragStart={() => handleDragStart(idx)}
                                onDragOver={(e) => handleDragOver(e, idx)}
                                onDragEnd={handleDragEnd}
                            >
                                <div className="merge-item-num">{idx + 1}</div>
                                <img src={file.thumbnail} alt="" className="merge-thumb" />
                                <div className="merge-item-info">
                                    <span className="merge-item-name">{file.name}</span>
                                    <span className="merge-item-pages">{file.pages} page{file.pages > 1 ? "s" : ""}</span>
                                </div>
                                <div className="merge-item-actions">
                                    {idx > 0 && (
                                        <button className="btn-icon" onClick={() => moveFile(idx, idx - 1)} title="Move up">
                                            ▲
                                        </button>
                                    )}
                                    {idx < mergeFiles.length - 1 && (
                                        <button className="btn-icon" onClick={() => moveFile(idx, idx + 1)} title="Move down">
                                            ▼
                                        </button>
                                    )}
                                    <button
                                        className="btn-icon"
                                        onClick={() => removeFile(file.id)}
                                        title="Remove"
                                        style={{ color: "var(--danger)" }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="merge-actions">
                        <button
                            className="btn btn-primary merge-btn"
                            onClick={mergePdfs}
                            disabled={mergeFiles.length < 2 || merging}
                        >
                            {merging ? "Merging…" : `🔗 Merge ${mergeFiles.length} Files & Download`}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ========== CONVERT SCREEN ==========
function ConvertScreen({ onBack }) {
    const [convertMode, setConvertMode] = useState("pdf2img"); // pdf2img | img2pdf
    const [files, setFiles] = useState([]);
    const [converting, setConverting] = useState(false);
    const inputRef = useRef(null);
    const [dragOver, setDragOver] = useState(false);

    const isImage = (file) => file.type.startsWith("image/");

    const addFiles = async (newFilesList) => {
        const newFiles = [];
        for (const file of newFilesList) {
            const isPdf = file.type === "application/pdf";
            const isImg = isImage(file);

            if (convertMode === "pdf2img" && !isPdf) continue;
            if (convertMode === "img2pdf" && !isImg) continue;

            const arrayBuffer = await file.arrayBuffer();

            if (isPdf) {
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
                const page = await pdf.getPage(1);
                const vp = page.getViewport({ scale: 0.3 });
                const canvas = document.createElement("canvas");
                canvas.width = vp.width;
                canvas.height = vp.height;
                const ctx = canvas.getContext("2d");
                await page.render({ canvasContext: ctx, viewport: vp }).promise;
                const thumbnail = canvas.toDataURL();

                newFiles.push({
                    id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    name: file.name,
                    type: "pdf",
                    data: arrayBuffer,
                    pages: pdf.numPages,
                    thumbnail,
                });
            } else {
                const thumbnail = await new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement("canvas");
                        const maxH = 120;
                        const ratio = maxH / img.height;
                        canvas.width = img.width * ratio;
                        canvas.height = maxH;
                        const ctx = canvas.getContext("2d");
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        resolve(canvas.toDataURL());
                        URL.revokeObjectURL(img.src);
                    };
                    img.src = URL.createObjectURL(file);
                });

                newFiles.push({
                    id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    name: file.name,
                    type: "image",
                    imageType: file.type,
                    data: arrayBuffer,
                    thumbnail,
                });
            }
        }
        setFiles((prev) => [...prev, ...newFiles]);
    };

    const removeFile = (id) => {
        setFiles((prev) => prev.filter((f) => f.id !== id));
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files?.length) {
            addFiles(Array.from(e.dataTransfer.files));
        }
    };

    const handleConvert = async () => {
        if (files.length === 0) return;
        setConverting(true);

        try {
            if (convertMode === "pdf2img") {
                // Determine format
                const format = "image/jpeg";
                const ext = "jpg";

                for (const file of files) {
                    const zip = new JSZip();
                    const pdf = await pdfjsLib.getDocument({ data: file.data.slice(0) }).promise;

                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const vp = page.getViewport({ scale: 2.0 }); // High res
                        const canvas = document.createElement("canvas");
                        canvas.width = vp.width;
                        canvas.height = vp.height;
                        const ctx = canvas.getContext("2d");
                        await page.render({ canvasContext: ctx, viewport: vp }).promise;

                        const dataUrl = canvas.toDataURL(format, 0.9);
                        const base64Data = dataUrl.split(",")[1];
                        zip.file(`${file.name.replace(".pdf", "")}_page${i}.${ext}`, base64Data, { base64: true });
                    }

                    const zipContent = await zip.generateAsync({ type: "blob" });
                    const link = document.createElement("a");
                    link.href = URL.createObjectURL(zipContent);
                    link.download = `${file.name.replace(".pdf", "")}_images.zip`;
                    link.click();
                    URL.revokeObjectURL(link.href);

                    // Small delay between downloads if there are multiple PDFs
                    await new Promise(r => setTimeout(r, 200));
                }
            } else {
                // img2pdf mode: Convert selected images to a single PDF
                const newPdf = await PDFDocument.create();

                for (const file of files) {
                    let img;
                    if (file.imageType === "image/png") {
                        img = await newPdf.embedPng(file.data);
                    } else {
                        img = await newPdf.embedJpg(file.data);
                    }
                    const { width, height } = img.scale(1);
                    const page = newPdf.addPage([width, height]);
                    page.drawImage(img, { x: 0, y: 0, width, height });
                }

                const pdfBytes = await newPdf.save();
                const blob = new Blob([pdfBytes], { type: "application/pdf" });
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = "converted_images.pdf";
                link.click();
                URL.revokeObjectURL(link.href);
            }
        } catch (err) {
            console.error("Conversion failed:", err);
        }

        setConverting(false);
    };

    return (
        <div className="merge-screen"> {/* Reusing merge-screen layout */}
            <button className="btn btn-secondary" onClick={onBack} style={{ alignSelf: "flex-start", marginBottom: 16 }}>← Back</button>

            <div className="convert-tabs">
                <button
                    className={`btn ${convertMode === "pdf2img" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => { setConvertMode("pdf2img"); setFiles([]); }}
                >
                    PDF to Image (JPG/PNG)
                </button>
                <button
                    className={`btn ${convertMode === "img2pdf" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => { setConvertMode("img2pdf"); setFiles([]); }}
                >
                    Image to PDF
                </button>
            </div>

            <div
                className={`merge-upload ${dragOver ? "drag-over" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                style={{ marginTop: 20 }}
            >
                <span className="merge-upload-icon">{convertMode === "pdf2img" ? "📄➡🖼️" : "🖼️➡📄"}</span>
                <p>Click or drag {convertMode === "pdf2img" ? "PDF" : "Image (JPG/PNG)"} files here to convert</p>
                <input
                    ref={inputRef}
                    type="file"
                    accept={convertMode === "pdf2img" ? "application/pdf" : "image/*"}
                    multiple
                    style={{ display: "none" }}
                    onChange={(e) => {
                        if (e.target.files?.length) addFiles(Array.from(e.target.files));
                        e.target.value = "";
                    }}
                />
            </div>

            {files.length > 0 && (
                <div className="merge-list">
                    <div className="merge-list-header">
                        <h3>Files to Convert ({files.length})</h3>
                    </div>
                    <div className="merge-items">
                        {files.map((file, idx) => (
                            <div key={file.id} className="merge-item">
                                <div className="merge-item-num">{idx + 1}</div>
                                <img src={file.thumbnail} alt="" className="merge-thumb" />
                                <div className="merge-item-info">
                                    <span className="merge-item-name">{file.name}</span>
                                    {file.pages && <span className="merge-item-pages">{file.pages} page{file.pages > 1 ? "s" : ""}</span>}
                                </div>
                                <div className="merge-item-actions">
                                    <button
                                        className="btn-icon"
                                        onClick={() => removeFile(file.id)}
                                        title="Remove"
                                        style={{ color: "var(--danger)" }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="merge-actions">
                        <button
                            className="btn btn-primary merge-btn"
                            onClick={handleConvert}
                            disabled={files.length === 0 || converting}
                        >
                            {converting ? "Converting…" : `🔄 Convert & Download`}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ========== SPLIT SCREEN ==========
function SplitScreen({ onBack }) {
    const [pdfFile, setPdfFile] = useState(null);
    const [pages, setPages] = useState([]); // { idx: number, thumb: string, selected: boolean }
    const [splitting, setSplitting] = useState(false);
    const inputRef = useRef(null);
    const [dragOver, setDragOver] = useState(false);

    const loadPdf = async (file) => {
        if (file.type !== "application/pdf") return;
        setPdfFile(file);

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;

        const newPages = [];
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const vp = page.getViewport({ scale: 0.3 });
            const canvas = document.createElement("canvas");
            canvas.width = vp.width;
            canvas.height = vp.height;
            const ctx = canvas.getContext("2d");
            await page.render({ canvasContext: ctx, viewport: vp }).promise;

            newPages.push({
                idx: i,
                thumb: canvas.toDataURL(),
                selected: false
            });
        }
        setPages(newPages);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) loadPdf(file);
    };

    const togglePage = (idx) => {
        setPages(prev => prev.map(p => p.idx === idx ? { ...p, selected: !p.selected } : p));
    };

    const extractSelected = async () => {
        const selected = pages.filter(p => p.selected).map(p => p.idx - 1);
        if (selected.length === 0 || !pdfFile) return;

        setSplitting(true);
        try {
            const arrayBuffer = await pdfFile.arrayBuffer();
            const srcPdf = await PDFDocument.load(arrayBuffer);
            const newPdf = await PDFDocument.create();

            const copiedPages = await newPdf.copyPages(srcPdf, selected);
            copiedPages.forEach(p => newPdf.addPage(p));

            const pdfBytes = await newPdf.save();
            const blob = new Blob([pdfBytes], { type: "application/pdf" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `${pdfFile.name.replace(".pdf", "")}_extracted.pdf`;
            link.click();
            URL.revokeObjectURL(link.href);
        } catch (err) {
            console.error("Extract failed:", err);
        }
        setSplitting(false);
    };

    const splitAll = async () => {
        if (!pdfFile || pages.length === 0) return;

        setSplitting(true);
        try {
            const arrayBuffer = await pdfFile.arrayBuffer();
            const srcPdf = await PDFDocument.load(arrayBuffer);
            const zip = new JSZip();

            for (let i = 0; i < pages.length; i++) {
                const newPdf = await PDFDocument.create();
                const [copiedPage] = await newPdf.copyPages(srcPdf, [i]);
                newPdf.addPage(copiedPage);
                const pdfBytes = await newPdf.save();
                zip.file(`${pdfFile.name.replace(".pdf", "")}_page${i + 1}.pdf`, pdfBytes);
            }

            const zipContent = await zip.generateAsync({ type: "blob" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(zipContent);
            link.download = `${pdfFile.name.replace(".pdf", "")}_split.zip`;
            link.click();
            URL.revokeObjectURL(link.href);
        } catch (err) {
            console.error("Split all failed:", err);
        }
        setSplitting(false);
    };

    // Reuse merge screens layout mostly
    return (
        <div className="merge-screen">
            <button className="btn btn-secondary" onClick={onBack} style={{ alignSelf: "flex-start", marginBottom: 16 }}>← Back</button>
            {!pdfFile ? (
                <div
                    className={`merge-upload ${dragOver ? "drag-over" : ""}`}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                >
                    <span className="merge-upload-icon">✂️</span>
                    <p>Click or drag a PDF file here to split</p>
                    <input
                        ref={inputRef}
                        type="file"
                        accept="application/pdf"
                        style={{ display: "none" }}
                        onChange={(e) => {
                            if (e.target.files?.[0]) loadPdf(e.target.files[0]);
                            e.target.value = "";
                        }}
                    />
                </div>
            ) : (
                <div className="split-container" style={{ width: "100%", maxWidth: 1000 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                        <div>
                            <h3 style={{ fontSize: 18, color: "var(--text-primary)" }}>Select Pages</h3>
                            <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>{pdfFile.name} ({pages.length} pages)</p>
                        </div>
                        <button className="btn btn-secondary" onClick={() => { setPdfFile(null); setPages([]); }}>Cancel</button>
                    </div>

                    <div className="pages-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 20, marginBottom: 30 }}>
                        {pages.map(p => (
                            <div
                                key={p.idx}
                                onClick={() => togglePage(p.idx)}
                                style={{
                                    position: "relative",
                                    cursor: "pointer",
                                    border: p.selected ? "2px solid var(--accent)" : "2px solid transparent",
                                    borderRadius: "8px",
                                    transition: "all 0.2s"
                                }}
                            >
                                <img src={p.thumb} style={{ width: "100%", height: "auto", display: "block", borderRadius: "6px", border: "1px solid var(--border-glass)" }} alt={`Page ${p.idx}`} />
                                <div style={{ position: "absolute", bottom: 5, right: 5, background: "rgba(0,0,0,0.6)", color: "#fff", padding: "2px 6px", borderRadius: 4, fontSize: 11 }}>{p.idx}</div>
                                {p.selected && (
                                    <div style={{ position: "absolute", top: 5, right: 5, background: "var(--accent)", color: "#fff", width: 20, height: 20, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>✓</div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
                        <button
                            className="btn btn-primary"
                            disabled={splitting || !pages.some(p => p.selected)}
                            onClick={extractSelected}
                        >
                            {splitting ? "Processing..." : `Extract Selected (${pages.filter(p => p.selected).length})`}
                        </button>
                        <button
                            className="btn btn-secondary"
                            disabled={splitting}
                            onClick={splitAll}
                        >
                            {splitting ? "Processing..." : "Split All Pages as ZIP"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ========== ORGANIZE SCREEN (Reorder, Delete, Rotate) ==========
function OrganizeScreen({ onBack }) {
    const [pdfFile, setPdfFile] = useState(null);
    const [pages, setPages] = useState([]); // { idx, thumb, rotation }
    const [dragOver, setDragOver] = useState(false);
    const [dragIdx, setDragIdx] = useState(null);
    const fileRef = useRef(null);

    const loadPdf = async (file) => {
        const buf = await file.arrayBuffer();
        setPdfFile(buf);

        const pdf = await pdfjsLib.getDocument({ data: buf.slice(0) }).promise;
        const arr = [];
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const vp = page.getViewport({ scale: 0.3 });
            const canvas = document.createElement("canvas");
            canvas.width = vp.width;
            canvas.height = vp.height;
            await page.render({ canvasContext: canvas.getContext("2d"), viewport: vp }).promise;
            arr.push({ idx: i, thumb: canvas.toDataURL(), rotation: 0 });
        }
        setPages(arr);
    };

    const deletePage = (i) => setPages(prev => prev.filter((_, idx) => idx !== i));

    const rotatePage = (i) => {
        setPages(prev => prev.map((p, idx) => idx === i ? { ...p, rotation: (p.rotation + 90) % 360 } : p));
    };

    const handleDragStart = (i) => setDragIdx(i);
    const handleDragOver = (e, i) => {
        e.preventDefault();
        if (dragIdx === null || dragIdx === i) return;
        setPages(prev => {
            const arr = [...prev];
            const [item] = arr.splice(dragIdx, 1);
            arr.splice(i, 0, item);
            return arr;
        });
        setDragIdx(i);
    };
    const handleDragEnd = () => setDragIdx(null);

    const savePdf = async () => {
        if (!pdfFile || pages.length === 0) return;
        const srcDoc = await PDFDocument.load(pdfFile);
        const newDoc = await PDFDocument.create();

        for (const p of pages) {
            const [copied] = await newDoc.copyPages(srcDoc, [p.idx - 1]);
            if (p.rotation) copied.setRotation({ type: "degrees", angle: p.rotation });
            newDoc.addPage(copied);
        }

        const bytes = await newDoc.save();
        const blob = new Blob([bytes], { type: "application/pdf" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "organized.pdf";
        link.click();
        URL.revokeObjectURL(link.href);
    };

    return (
        <div className="merge-screen">
            <button className="btn btn-secondary" onClick={onBack} style={{ alignSelf: "flex-start", marginBottom: 16 }}>← Back</button>

            {!pdfFile ? (
                <div
                    className={`merge-upload ${dragOver ? "drag-over" : ""}`}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) loadPdf(f); }}
                    onClick={() => fileRef.current?.click()}
                >
                    <span className="merge-upload-icon">📑</span>
                    <p>Upload a PDF to organize pages</p>
                    <span className="btn btn-primary">Choose File</span>
                    <input ref={fileRef} type="file" accept="application/pdf" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) loadPdf(f); }} />
                </div>
            ) : (
                <>
                    <p style={{ color: "#888", fontSize: 13, marginBottom: 16 }}>Drag to reorder • Click 🔄 to rotate • Click ✕ to delete</p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12, width: "100%", maxWidth: 800 }}>
                        {pages.map((p, i) => (
                            <div
                                key={i}
                                draggable
                                onDragStart={() => handleDragStart(i)}
                                onDragOver={(e) => handleDragOver(e, i)}
                                onDragEnd={handleDragEnd}
                                style={{
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    borderRadius: 8,
                                    padding: 8,
                                    textAlign: "center",
                                    cursor: "grab",
                                    background: dragIdx === i ? "rgba(255,255,255,0.06)" : "transparent",
                                }}
                            >
                                <img src={p.thumb} alt={`Page ${p.idx}`} style={{ width: "100%", borderRadius: 4, transform: `rotate(${p.rotation}deg)` }} />
                                <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 6 }}>
                                    <span style={{ fontSize: 11, color: "#888" }}>Page {i + 1}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 4 }}>
                                    <button className="btn btn-secondary" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => rotatePage(i)}>🔄</button>
                                    <button className="btn btn-danger" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => deletePage(i)}>✕</button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
                        <button className="btn btn-primary merge-btn" onClick={savePdf}>⬇ Download Organized PDF</button>
                    </div>
                </>
            )}
        </div>
    );
}

// ========== PROTECT SCREEN (Add Password) ==========
function ProtectScreen({ onBack }) {
    const [pdfFile, setPdfFile] = useState(null);
    const [fileName, setFileName] = useState("");
    const [password, setPassword] = useState("");
    const [status, setStatus] = useState("");
    const fileRef = useRef(null);

    const loadFile = (file) => {
        file.arrayBuffer().then(buf => {
            setPdfFile(buf);
            setFileName(file.name);
        });
    };

    const protectPdf = async () => {
        if (!pdfFile || !password) return;
        setStatus("Encrypting...");
        try {
            // Use pdf-encrypt-lite for real RC4 128-bit encryption
            const pdfBytes = new Uint8Array(pdfFile);
            const encryptedBytes = await encryptPDF(pdfBytes, password, password);
            const blob = new Blob([encryptedBytes], { type: "application/pdf" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `protected_${fileName}`;
            link.click();
            URL.revokeObjectURL(link.href);
            setStatus("Done! Protected PDF downloaded.");
        } catch (err) {
            setStatus("Error: " + err.message);
        }
    };

    return (
        <div className="merge-screen">
            <button className="btn btn-secondary" onClick={onBack} style={{ alignSelf: "flex-start", marginBottom: 16 }}>← Back</button>

            {!pdfFile ? (
                <div className="merge-upload" onClick={() => fileRef.current?.click()}>
                    <span className="merge-upload-icon">🔒</span>
                    <p>Upload a PDF to password-protect</p>
                    <span className="btn btn-primary">Choose File</span>
                    <input ref={fileRef} type="file" accept="application/pdf" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, maxWidth: 400, width: "100%" }}>
                    <p style={{ color: "#fff", fontSize: 15 }}>📄 {fileName}</p>
                    <input
                        type="password"
                        placeholder="Enter password…"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ width: "100%", padding: "10px 14px", background: "transparent", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "#fff", fontSize: 14, fontFamily: "Inter, sans-serif", outline: "none" }}
                    />
                    <button className="btn btn-primary merge-btn" onClick={protectPdf} disabled={!password}>🔒 Protect & Download</button>
                    {status && <p style={{ color: "#888", fontSize: 13 }}>{status}</p>}
                </div>
            )}
        </div>
    );
}

// ========== UNLOCK SCREEN (Remove Password) ==========
function UnlockScreen({ onBack }) {
    const [password, setPassword] = useState("");
    const [status, setStatus] = useState("");
    const [pdfData, setPdfData] = useState(null);
    const [fileName, setFileName] = useState("");
    const fileRef = useRef(null);

    const loadFile = (file) => {
        file.arrayBuffer().then(buf => {
            setPdfData(buf);
            setFileName(file.name);
        });
    };

    const unlockPdf = async () => {
        if (!pdfData) return;
        setStatus("Unlocking...");
        try {
            const doc = await PDFDocument.load(pdfData, { password });
            const bytes = await doc.save();
            const blob = new Blob([bytes], { type: "application/pdf" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `unlocked_${fileName}`;
            link.click();
            URL.revokeObjectURL(link.href);
            setStatus("Done! Unlocked PDF downloaded.");
        } catch (err) {
            setStatus("Error: Wrong password or corrupted file.");
        }
    };

    return (
        <div className="merge-screen">
            <button className="btn btn-secondary" onClick={onBack} style={{ alignSelf: "flex-start", marginBottom: 16 }}>← Back</button>

            {!pdfData ? (
                <div className="merge-upload" onClick={() => fileRef.current?.click()}>
                    <span className="merge-upload-icon">🔓</span>
                    <p>Upload a password-protected PDF</p>
                    <span className="btn btn-primary">Choose File</span>
                    <input ref={fileRef} type="file" accept="application/pdf" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, maxWidth: 400, width: "100%" }}>
                    <p style={{ color: "#fff", fontSize: 15 }}>📄 {fileName}</p>
                    <input
                        type="password"
                        placeholder="Enter current password…"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ width: "100%", padding: "10px 14px", background: "transparent", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "#fff", fontSize: 14, fontFamily: "Inter, sans-serif", outline: "none" }}
                    />
                    <button className="btn btn-primary merge-btn" onClick={unlockPdf}>🔓 Unlock & Download</button>
                    {status && <p style={{ color: "#888", fontSize: 13 }}>{status}</p>}
                </div>
            )}
        </div>
    );
}

// ========== COMPRESS SCREEN ==========
function CompressScreen({ onBack }) {
    const [pdfFile, setPdfFile] = useState(null);
    const [fileName, setFileName] = useState("");
    const [originalSize, setOriginalSize] = useState(0);
    const [status, setStatus] = useState("");
    const fileRef = useRef(null);

    const loadFile = (file) => {
        file.arrayBuffer().then(buf => {
            setPdfFile(buf);
            setFileName(file.name);
            setOriginalSize(buf.byteLength);
        });
    };

    const compressPdf = async () => {
        if (!pdfFile) return;
        setStatus("Compressing...");
        try {
            const doc = await PDFDocument.load(pdfFile);
            // Re-save without unused objects for basic compression
            const bytes = await doc.save({
                useObjectStreams: true,
                addDefaultPage: false,
            });

            const reduction = ((1 - bytes.byteLength / originalSize) * 100).toFixed(1);
            const blob = new Blob([bytes], { type: "application/pdf" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `compressed_${fileName}`;
            link.click();
            URL.revokeObjectURL(link.href);
            setStatus(`Done! Reduced by ${reduction}% (${(originalSize / 1024).toFixed(0)}KB → ${(bytes.byteLength / 1024).toFixed(0)}KB)`);
        } catch (err) {
            setStatus("Error: " + err.message);
        }
    };

    return (
        <div className="merge-screen">
            <button className="btn btn-secondary" onClick={onBack} style={{ alignSelf: "flex-start", marginBottom: 16 }}>← Back</button>

            {!pdfFile ? (
                <div className="merge-upload" onClick={() => fileRef.current?.click()}>
                    <span className="merge-upload-icon">📦</span>
                    <p>Upload a PDF to compress</p>
                    <span className="btn btn-primary">Choose File</span>
                    <input ref={fileRef} type="file" accept="application/pdf" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, maxWidth: 400, width: "100%" }}>
                    <p style={{ color: "#fff", fontSize: 15 }}>📄 {fileName}</p>
                    <p style={{ color: "#888", fontSize: 13 }}>Original size: {(originalSize / 1024).toFixed(0)} KB</p>
                    <button className="btn btn-primary merge-btn" onClick={compressPdf}>📦 Compress & Download</button>
                    {status && <p style={{ color: "#888", fontSize: 13, textAlign: "center" }}>{status}</p>}
                </div>
            )}
        </div>
    );
}

// ========== EXTRACT TEXT SCREEN ==========
function ExtractTextScreen({ onBack }) {
    const [status, setStatus] = useState("");
    const [extractedText, setExtractedText] = useState("");
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [useOcr, setUseOcr] = useState(false);
    const [method, setMethod] = useState("");
    const fileRef = useRef(null);

    // Render a PDF page to a canvas and return a data URL
    const renderPageToImage = async (pdf, pageNum, scale = 2.5) => {
        const page = await pdf.getPage(pageNum);
        const vp = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = vp.width;
        canvas.height = vp.height;
        const ctx = canvas.getContext("2d");
        await page.render({ canvasContext: ctx, viewport: vp }).promise;
        return canvas;
    };

    // OCR extraction using Tesseract.js
    const extractWithOcr = async (pdf) => {
        setMethod("OCR");
        let fullText = "";
        const totalPages = pdf.numPages;

        for (let i = 1; i <= totalPages; i++) {
            setStatus(`OCR: Scanning page ${i} of ${totalPages}...`);
            setProgress(Math.round(((i - 1) / totalPages) * 100));

            const canvas = await renderPageToImage(pdf, i);

            const result = await Tesseract.recognize(canvas, "eng+hin", {
                logger: (m) => {
                    if (m.status === "recognizing text") {
                        const pageProgress = Math.round(m.progress * 100);
                        const overallProgress = Math.round(((i - 1 + m.progress) / totalPages) * 100);
                        setProgress(overallProgress);
                        setStatus(`OCR: Page ${i}/${totalPages} — ${pageProgress}%`);
                    }
                },
            });

            const pageText = result.data.text.trim();
            fullText += `--- Page ${i} ---\n${pageText}\n\n`;
        }

        setProgress(100);
        return fullText;
    };

    // Normal text extraction using pdfjs
    const extractWithPdfjs = async (pdf) => {
        setMethod("Text Layer");
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
            setStatus(`Reading page ${i} of ${pdf.numPages}...`);
            setProgress(Math.round((i / pdf.numPages) * 100));
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items.map((item) => item.str).join(" ");
            fullText += `--- Page ${i} ---\n${pageText}\n\n`;
        }
        return fullText;
    };

    // Check if extracted text is mostly empty
    const hasRealText = (text) => {
        const cleaned = text.replace(/--- Page \d+ ---/g, "").trim();
        return cleaned.length > 20;
    };

    const extractText = async (file) => {
        if (file.type !== "application/pdf") {
            setStatus("Error: Please upload a PDF file.");
            return;
        }
        setLoading(true);
        setStatus("Loading PDF...");
        setExtractedText("");
        setProgress(0);
        setMethod("");

        try {
            const buf = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: buf.slice(0) }).promise;

            let fullText = "";

            if (useOcr) {
                // User forced OCR mode
                fullText = await extractWithOcr(pdf);
            } else {
                // First try normal extraction
                fullText = await extractWithPdfjs(pdf);

                // If no real text found, auto-fallback to OCR
                if (!hasRealText(fullText)) {
                    setStatus("No embedded text found. Starting OCR scan...");
                    await new Promise((r) => setTimeout(r, 500));
                    fullText = await extractWithOcr(pdf);
                }
            }

            const finalText = fullText.trim();
            if (!hasRealText(finalText)) {
                setExtractedText("");
                setStatus("Could not extract any text. The PDF may contain only images without readable text.");
            } else {
                setExtractedText(fullText);
                setStatus(`Extracted text from ${pdf.numPages} page${pdf.numPages > 1 ? "s" : ""} using ${method}.`);
            }
        } catch (err) {
            console.error("Extract text error:", err);
            setStatus("Error: " + err.message);
        }
        setLoading(false);
        setProgress(0);
    };

    const downloadText = () => {
        const blob = new Blob([extractedText], { type: "text/plain" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "extracted_text.txt";
        link.click();
        URL.revokeObjectURL(link.href);
    };

    const copyText = () => {
        navigator.clipboard.writeText(extractedText);
        setStatus("Copied to clipboard!");
    };

    const resetScreen = () => {
        setExtractedText("");
        setStatus("");
        setLoading(false);
        setProgress(0);
    };

    return (
        <div className="merge-screen">
            <button className="btn btn-secondary" onClick={onBack} style={{ alignSelf: "flex-start", marginBottom: 16 }}>← Back</button>

            {loading ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: 40, width: "100%", maxWidth: 400 }}>
                    <div style={{ width: 48, height: 48, border: "3px solid rgba(255,255,255,0.1)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    <p style={{ color: "#fff", fontSize: 14, fontWeight: 500 }}>{status}</p>
                    {progress > 0 && (
                        <div style={{ width: "100%", background: "rgba(255,255,255,0.06)", borderRadius: 8, height: 6, overflow: "hidden" }}>
                            <div style={{ width: `${progress}%`, height: "100%", background: "linear-gradient(90deg, #667eea, #764ba2)", borderRadius: 8, transition: "width 0.3s ease" }} />
                        </div>
                    )}
                    <p style={{ color: "#555", fontSize: 12 }}>{progress}% complete{method && ` • ${method}`}</p>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            ) : !extractedText ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, width: "100%" }}>
                    <div className="merge-upload" onClick={() => fileRef.current?.click()}>
                        <span className="merge-upload-icon" style={{ fontSize: 28 }}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="8" y1="13" x2="16" y2="13" />
                                <line x1="8" y1="17" x2="13" y2="17" />
                            </svg>
                        </span>
                        <p>Upload a PDF to extract text</p>
                        <span className="btn btn-primary">Choose File</span>
                        <input ref={fileRef} type="file" accept="application/pdf" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) extractText(f); e.target.value = ""; }} />
                    </div>

                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }}>
                        <input
                            type="checkbox"
                            checked={useOcr}
                            onChange={(e) => setUseOcr(e.target.checked)}
                            style={{ accentColor: "#764ba2", width: 16, height: 16 }}
                        />
                        <span style={{ color: "#888", fontSize: 13 }}>Force OCR mode (for scanned PDFs)</span>
                    </label>

                    {status && <p style={{ color: "#ff6b6b", fontSize: 13, textAlign: "center" }}>{status}</p>}
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 700 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                        <p style={{ color: "#4ade80", fontSize: 13 }}>{status}</p>
                        <button className="btn btn-secondary" onClick={resetScreen} style={{ fontSize: 12, padding: "4px 12px" }}>Extract Another</button>
                    </div>
                    <textarea
                        readOnly
                        value={extractedText}
                        style={{
                            width: "100%",
                            height: 400,
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 8,
                            color: "#fff",
                            padding: 16,
                            fontSize: 13,
                            fontFamily: "monospace",
                            resize: "vertical",
                            outline: "none",
                        }}
                    />
                    <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                        <button className="btn btn-primary" onClick={downloadText}>⬇ Download .txt</button>
                        <button className="btn btn-secondary" onClick={copyText}>📋 Copy</button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ========== SIGN PDF SCREEN ==========
function SignScreen({ onBack }) {
    const [pdfFile, setPdfFile] = useState(null);
    const [fileName, setFileName] = useState("");
    const [sigDataUrl, setSigDataUrl] = useState(null);
    const [status, setStatus] = useState("");
    const [drawing, setDrawing] = useState(false);
    const canvasRef = useRef(null);
    const fileRef = useRef(null);
    const sigFileRef = useRef(null);

    const loadFile = (file) => {
        file.arrayBuffer().then(buf => { setPdfFile(buf); setFileName(file.name); });
    };

    // Drawing signature
    const startDraw = (e) => {
        setDrawing(true);
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        const rect = canvas.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e) => {
        if (!drawing) return;
        e.preventDefault();
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        const rect = canvas.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.strokeStyle = "#000";
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDraw = () => {
        setDrawing(false);
        if (canvasRef.current) {
            setSigDataUrl(canvasRef.current.toDataURL("image/png"));
        }
    };

    const clearSig = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setSigDataUrl(null);
    };

    const uploadSig = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => setSigDataUrl(e.target.result);
        reader.readAsDataURL(file);
    };

    const applySignature = async () => {
        if (!pdfFile || !sigDataUrl) return;
        setStatus("Applying signature...");
        try {
            const doc = await PDFDocument.load(pdfFile);
            const pngBytes = await fetch(sigDataUrl).then(r => r.arrayBuffer());
            const sigImage = await doc.embedPng(pngBytes);
            const pages = doc.getPages();
            const lastPage = pages[pages.length - 1];
            const { width } = lastPage.getSize();
            const sigW = 150;
            const sigH = (sigImage.height / sigImage.width) * sigW;
            lastPage.drawImage(sigImage, { x: width - sigW - 40, y: 40, width: sigW, height: sigH });
            const bytes = await doc.save();
            const blob = new Blob([bytes], { type: "application/pdf" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `signed_${fileName}`;
            link.click();
            URL.revokeObjectURL(link.href);
            setStatus("Done! Signed PDF downloaded.");
        } catch (err) { setStatus("Error: " + err.message); }
    };

    return (
        <div className="merge-screen">
            <button className="btn btn-secondary" onClick={onBack} style={{ alignSelf: "flex-start", marginBottom: 16 }}>← Back</button>
            {!pdfFile ? (
                <div className="merge-upload" onClick={() => fileRef.current?.click()}>
                    <span className="merge-upload-icon" style={{ fontSize: 28 }}>{FeatureIcons.sign}</span>
                    <p>Upload a PDF to sign</p>
                    <span className="btn btn-primary">Choose File</span>
                    <input ref={fileRef} type="file" accept="application/pdf" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, width: "100%", maxWidth: 500 }}>
                    <p style={{ color: "#fff", fontSize: 14 }}>📄 {fileName}</p>
                    <p style={{ color: "#888", fontSize: 12 }}>Draw your signature below or upload an image</p>
                    <canvas ref={canvasRef} width={400} height={150}
                        style={{ background: "#fff", borderRadius: 8, cursor: "crosshair", touchAction: "none", width: "100%", maxWidth: 400 }}
                        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
                        onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
                    />
                    <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn btn-secondary" onClick={clearSig}>Clear</button>
                        <button className="btn btn-secondary" onClick={() => sigFileRef.current?.click()}>Upload Image</button>
                        <input ref={sigFileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadSig(f); }} />
                    </div>
                    <button className="btn btn-primary merge-btn" onClick={applySignature} disabled={!sigDataUrl}>✍ Sign & Download</button>
                    {status && <p style={{ color: "#888", fontSize: 13 }}>{status}</p>}
                </div>
            )}
        </div>
    );
}

// ========== WATERMARK SCREEN ==========
function WatermarkScreen({ onBack }) {
    const [pdfFile, setPdfFile] = useState(null);
    const [fileName, setFileName] = useState("");
    const [watermarkText, setWatermarkText] = useState("CONFIDENTIAL");
    const [opacity, setOpacity] = useState(0.15);
    const [angle, setAngle] = useState(-45);
    const [fontSize, setFontSize] = useState(50);
    const [status, setStatus] = useState("");
    const fileRef = useRef(null);

    const loadFile = (file) => {
        file.arrayBuffer().then(buf => { setPdfFile(buf); setFileName(file.name); });
    };

    const applyWatermark = async () => {
        if (!pdfFile || !watermarkText) return;
        setStatus("Adding watermark...");
        try {
            const doc = await PDFDocument.load(pdfFile);
            const font = await doc.embedFont(StandardFonts.HelveticaBold);
            const pages = doc.getPages();
            for (const page of pages) {
                const { width, height } = page.getSize();
                const textW = font.widthOfTextAtSize(watermarkText, fontSize);
                page.drawText(watermarkText, {
                    x: (width - textW) / 2,
                    y: height / 2,
                    size: fontSize,
                    font,
                    color: rgb(0.5, 0.5, 0.5),
                    opacity,
                    rotate: degrees(angle),
                });
            }
            const bytes = await doc.save();
            const blob = new Blob([bytes], { type: "application/pdf" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `watermarked_${fileName}`;
            link.click();
            URL.revokeObjectURL(link.href);
            setStatus("Done! Watermarked PDF downloaded.");
        } catch (err) { setStatus("Error: " + err.message); }
    };

    const inputStyle = { width: "100%", padding: "10px 14px", background: "transparent", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "#fff", fontSize: 14, fontFamily: "Inter, sans-serif", outline: "none" };

    return (
        <div className="merge-screen">
            <button className="btn btn-secondary" onClick={onBack} style={{ alignSelf: "flex-start", marginBottom: 16 }}>← Back</button>
            {!pdfFile ? (
                <div className="merge-upload" onClick={() => fileRef.current?.click()}>
                    <span className="merge-upload-icon" style={{ fontSize: 28 }}>{FeatureIcons.watermark}</span>
                    <p>Upload a PDF to add watermark</p>
                    <span className="btn btn-primary">Choose File</span>
                    <input ref={fileRef} type="file" accept="application/pdf" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, maxWidth: 420, width: "100%" }}>
                    <p style={{ color: "#fff", fontSize: 14 }}>📄 {fileName}</p>
                    <input style={inputStyle} placeholder="Watermark text…" value={watermarkText} onChange={(e) => setWatermarkText(e.target.value)} />
                    <div style={{ display: "flex", gap: 12, width: "100%", flexWrap: "wrap" }}>
                        <label style={{ flex: 1, color: "#888", fontSize: 12 }}>
                            Opacity: {Math.round(opacity * 100)}%
                            <input type="range" min="0.05" max="0.8" step="0.05" value={opacity} onChange={(e) => setOpacity(+e.target.value)} style={{ width: "100%", accentColor: "#764ba2" }} />
                        </label>
                        <label style={{ flex: 1, color: "#888", fontSize: 12 }}>
                            Angle: {angle}°
                            <input type="range" min="-90" max="90" step="5" value={angle} onChange={(e) => setAngle(+e.target.value)} style={{ width: "100%", accentColor: "#764ba2" }} />
                        </label>
                    </div>
                    <label style={{ width: "100%", color: "#888", fontSize: 12 }}>
                        Font Size: {fontSize}px
                        <input type="range" min="20" max="120" step="5" value={fontSize} onChange={(e) => setFontSize(+e.target.value)} style={{ width: "100%", accentColor: "#764ba2" }} />
                    </label>
                    <button className="btn btn-primary merge-btn" onClick={applyWatermark} disabled={!watermarkText}>💧 Add Watermark & Download</button>
                    {status && <p style={{ color: "#888", fontSize: 13 }}>{status}</p>}
                </div>
            )}
        </div>
    );
}

// ========== PAGE NUMBERS SCREEN ==========
function PageNumbersScreen({ onBack }) {
    const [pdfFile, setPdfFile] = useState(null);
    const [fileName, setFileName] = useState("");
    const [position, setPosition] = useState("bottom-center");
    const [format, setFormat] = useState("number");
    const [pnFontSize, setPnFontSize] = useState(12);
    const [status, setStatus] = useState("");
    const fileRef = useRef(null);

    const loadFile = (file) => {
        file.arrayBuffer().then(buf => { setPdfFile(buf); setFileName(file.name); });
    };

    const addPageNumbers = async () => {
        if (!pdfFile) return;
        setStatus("Adding page numbers...");
        try {
            const doc = await PDFDocument.load(pdfFile);
            const font = await doc.embedFont(StandardFonts.Helvetica);
            const pages = doc.getPages();
            const total = pages.length;
            pages.forEach((page, idx) => {
                const { width, height } = page.getSize();
                const num = idx + 1;
                let text = `${num}`;
                if (format === "of") text = `${num} of ${total}`;
                if (format === "dash") text = `- ${num} -`;
                const textW = font.widthOfTextAtSize(text, pnFontSize);
                let x, y;
                if (position.includes("bottom")) y = 20;
                else y = height - 20 - pnFontSize;
                if (position.includes("center")) x = (width - textW) / 2;
                else if (position.includes("left")) x = 30;
                else x = width - textW - 30;
                page.drawText(text, { x, y, size: pnFontSize, font, color: rgb(0.3, 0.3, 0.3) });
            });
            const bytes = await doc.save();
            const blob = new Blob([bytes], { type: "application/pdf" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `numbered_${fileName}`;
            link.click();
            URL.revokeObjectURL(link.href);
            setStatus("Done! PDF with page numbers downloaded.");
        } catch (err) { setStatus("Error: " + err.message); }
    };

    const selStyle = { padding: "8px 12px", background: "transparent", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "#fff", fontSize: 13, outline: "none", fontFamily: "Inter, sans-serif" };

    return (
        <div className="merge-screen">
            <button className="btn btn-secondary" onClick={onBack} style={{ alignSelf: "flex-start", marginBottom: 16 }}>← Back</button>
            {!pdfFile ? (
                <div className="merge-upload" onClick={() => fileRef.current?.click()}>
                    <span className="merge-upload-icon" style={{ fontSize: 28 }}>{FeatureIcons.pagenums}</span>
                    <p>Upload a PDF to add page numbers</p>
                    <span className="btn btn-primary">Choose File</span>
                    <input ref={fileRef} type="file" accept="application/pdf" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, maxWidth: 420, width: "100%" }}>
                    <p style={{ color: "#fff", fontSize: 14 }}>📄 {fileName}</p>
                    <div style={{ display: "flex", gap: 12, width: "100%", flexWrap: "wrap" }}>
                        <select style={{ ...selStyle, flex: 1 }} value={position} onChange={(e) => setPosition(e.target.value)}>
                            <option value="bottom-center">Bottom Center</option>
                            <option value="bottom-left">Bottom Left</option>
                            <option value="bottom-right">Bottom Right</option>
                            <option value="top-center">Top Center</option>
                            <option value="top-left">Top Left</option>
                            <option value="top-right">Top Right</option>
                        </select>
                        <select style={{ ...selStyle, flex: 1 }} value={format} onChange={(e) => setFormat(e.target.value)}>
                            <option value="number">1, 2, 3…</option>
                            <option value="of">1 of N</option>
                            <option value="dash">- 1 -</option>
                        </select>
                    </div>
                    <label style={{ width: "100%", color: "#888", fontSize: 12 }}>
                        Font Size: {pnFontSize}px
                        <input type="range" min="8" max="24" step="1" value={pnFontSize} onChange={(e) => setPnFontSize(+e.target.value)} style={{ width: "100%", accentColor: "#764ba2" }} />
                    </label>
                    <button className="btn btn-primary merge-btn" onClick={addPageNumbers}>📄 Add Page Numbers & Download</button>
                    {status && <p style={{ color: "#888", fontSize: 13 }}>{status}</p>}
                </div>
            )}
        </div>
    );
}

// ========== CROP PAGES SCREEN ==========
function CropScreen({ onBack }) {
    const [pdfFile, setPdfFile] = useState(null);
    const [fileName, setFileName] = useState("");
    const [top, setTop] = useState(0);
    const [bottom, setBottom] = useState(0);
    const [left, setLeft] = useState(0);
    const [right, setRight] = useState(0);
    const [status, setStatus] = useState("");
    const fileRef = useRef(null);

    const loadFile = (file) => {
        file.arrayBuffer().then(buf => { setPdfFile(buf); setFileName(file.name); });
    };

    const cropPages = async () => {
        if (!pdfFile) return;
        setStatus("Cropping pages...");
        try {
            const doc = await PDFDocument.load(pdfFile);
            const pages = doc.getPages();
            for (const page of pages) {
                const { width, height } = page.getSize();
                page.setCropBox(left, bottom, width - left - right, height - top - bottom);
            }
            const bytes = await doc.save();
            const blob = new Blob([bytes], { type: "application/pdf" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `cropped_${fileName}`;
            link.click();
            URL.revokeObjectURL(link.href);
            setStatus("Done! Cropped PDF downloaded.");
        } catch (err) { setStatus("Error: " + err.message); }
    };

    const numStyle = { width: 80, padding: "8px 10px", background: "transparent", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "#fff", fontSize: 14, textAlign: "center", outline: "none", fontFamily: "Inter, sans-serif" };

    return (
        <div className="merge-screen">
            <button className="btn btn-secondary" onClick={onBack} style={{ alignSelf: "flex-start", marginBottom: 16 }}>← Back</button>
            {!pdfFile ? (
                <div className="merge-upload" onClick={() => fileRef.current?.click()}>
                    <span className="merge-upload-icon" style={{ fontSize: 28 }}>{FeatureIcons.crop}</span>
                    <p>Upload a PDF to crop pages</p>
                    <span className="btn btn-primary">Choose File</span>
                    <input ref={fileRef} type="file" accept="application/pdf" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, maxWidth: 400, width: "100%" }}>
                    <p style={{ color: "#fff", fontSize: 14 }}>📄 {fileName}</p>
                    <p style={{ color: "#888", fontSize: 12 }}>Set margins to crop (in points, 1 inch = 72pt)</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, width: "100%" }}>
                        <label style={{ color: "#888", fontSize: 12, textAlign: "center" }}>Top<br /><input type="number" style={numStyle} value={top} onChange={(e) => setTop(+e.target.value)} min="0" /></label>
                        <label style={{ color: "#888", fontSize: 12, textAlign: "center" }}>Bottom<br /><input type="number" style={numStyle} value={bottom} onChange={(e) => setBottom(+e.target.value)} min="0" /></label>
                        <label style={{ color: "#888", fontSize: 12, textAlign: "center" }}>Left<br /><input type="number" style={numStyle} value={left} onChange={(e) => setLeft(+e.target.value)} min="0" /></label>
                        <label style={{ color: "#888", fontSize: 12, textAlign: "center" }}>Right<br /><input type="number" style={numStyle} value={right} onChange={(e) => setRight(+e.target.value)} min="0" /></label>
                    </div>
                    <button className="btn btn-primary merge-btn" onClick={cropPages}>✂ Crop & Download</button>
                    {status && <p style={{ color: "#888", fontSize: 13 }}>{status}</p>}
                </div>
            )}
        </div>
    );
}

// ========== PDF TO WORD SCREEN ==========
function PdfToWordScreen({ onBack }) {
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);
    const fileRef = useRef(null);

    const convertToWord = async (file) => {
        setLoading(true);
        setStatus("Extracting text from PDF...");
        try {
            const buf = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: buf.slice(0) }).promise;
            const paragraphs = [];
            for (let i = 1; i <= pdf.numPages; i++) {
                setStatus(`Reading page ${i} of ${pdf.numPages}...`);
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                const lines = {};
                content.items.forEach(item => {
                    const y = Math.round(item.transform[5]);
                    if (!lines[y]) lines[y] = [];
                    lines[y].push(item);
                });
                const sortedYs = Object.keys(lines).map(Number).sort((a, b) => b - a);
                sortedYs.forEach(y => {
                    const lineItems = lines[y].sort((a, b) => a.transform[4] - b.transform[4]);
                    const lineText = lineItems.map(it => it.str).join(" ").trim();
                    if (lineText) {
                        paragraphs.push(new Paragraph({
                            children: [new TextRun({ text: lineText, size: 24 })],
                            spacing: { after: 120 },
                        }));
                    }
                });
                if (i < pdf.numPages) {
                    paragraphs.push(new Paragraph({ children: [], spacing: { after: 400 } }));
                }
            }
            setStatus("Creating Word document...");
            const doc = new Document({
                sections: [{ properties: {}, children: paragraphs }],
            });
            const blob = await Packer.toBlob(doc);
            saveAs(blob, file.name.replace(".pdf", ".docx"));
            setStatus("Done! Word document downloaded.");
        } catch (err) {
            console.error(err);
            setStatus("Error: " + err.message);
        }
        setLoading(false);
    };

    return (
        <div className="merge-screen">
            <button className="btn btn-secondary" onClick={onBack} style={{ alignSelf: "flex-start", marginBottom: 16 }}>← Back</button>
            {loading ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: 40 }}>
                    <div style={{ width: 40, height: 40, border: "3px solid rgba(255,255,255,0.1)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    <p style={{ color: "#888", fontSize: 14 }}>{status}</p>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                    <div className="merge-upload" onClick={() => fileRef.current?.click()}>
                        <span className="merge-upload-icon" style={{ fontSize: 28 }}>{FeatureIcons.pdftoword}</span>
                        <p>Upload a PDF to convert to Word (.docx)</p>
                        <span className="btn btn-primary">Choose File</span>
                        <input ref={fileRef} type="file" accept="application/pdf" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) convertToWord(f); e.target.value = ""; }} />
                    </div>
                    {status && <p style={{ color: status.startsWith("Error") ? "#ff6b6b" : "#4ade80", fontSize: 13 }}>{status}</p>}
                </div>
            )}
        </div>
    );
}

// ========== FILL FORMS SCREEN ==========
function FillFormsScreen({ onBack }) {
    const [pdfFile, setPdfFile] = useState(null);
    const [fileName, setFileName] = useState("");
    const [fields, setFields] = useState([]);
    const [status, setStatus] = useState("");
    const fileRef = useRef(null);

    const loadFile = async (file) => {
        try {
            const buf = await file.arrayBuffer();
            setPdfFile(buf);
            setFileName(file.name);
            const doc = await PDFDocument.load(buf);
            const form = doc.getForm();
            const allFields = form.getFields();
            const fieldData = allFields.map(f => {
                const type = f.constructor.name;
                let value = "";
                try {
                    if (type === "PDFTextField") value = f.getText() || "";
                    else if (type === "PDFCheckBox") value = f.isChecked() ? "true" : "false";
                    else if (type === "PDFDropdown") value = f.getSelected()?.[0] || "";
                    else if (type === "PDFRadioGroup") value = f.getSelected() || "";
                } catch (e) { /* ignore */ }
                return { name: f.getName(), type, value };
            });
            setFields(fieldData);
            if (fieldData.length === 0) setStatus("No fillable form fields found in this PDF.");
        } catch (err) { setStatus("Error: " + err.message); }
    };

    const updateField = (idx, val) => {
        setFields(prev => prev.map((f, i) => i === idx ? { ...f, value: val } : f));
    };

    const saveFilled = async () => {
        if (!pdfFile) return;
        setStatus("Saving filled form...");
        try {
            const doc = await PDFDocument.load(pdfFile);
            const form = doc.getForm();
            fields.forEach(f => {
                try {
                    const field = form.getField(f.name);
                    if (f.type === "PDFTextField") field.setText(f.value);
                    else if (f.type === "PDFCheckBox") { f.value === "true" ? field.check() : field.uncheck(); }
                    else if (f.type === "PDFDropdown") field.select(f.value);
                } catch (e) { /* ignore */ }
            });
            const bytes = await doc.save();
            const blob = new Blob([bytes], { type: "application/pdf" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `filled_${fileName}`;
            link.click();
            URL.revokeObjectURL(link.href);
            setStatus("Done! Filled PDF downloaded.");
        } catch (err) { setStatus("Error: " + err.message); }
    };

    const inputStyle = { width: "100%", padding: "8px 10px", background: "transparent", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, color: "#fff", fontSize: 13, outline: "none", fontFamily: "Inter, sans-serif" };

    return (
        <div className="merge-screen">
            <button className="btn btn-secondary" onClick={onBack} style={{ alignSelf: "flex-start", marginBottom: 16 }}>← Back</button>
            {!pdfFile ? (
                <div className="merge-upload" onClick={() => fileRef.current?.click()}>
                    <span className="merge-upload-icon" style={{ fontSize: 28 }}>{FeatureIcons.fillforms}</span>
                    <p>Upload a PDF with form fields</p>
                    <span className="btn btn-primary">Choose File</span>
                    <input ref={fileRef} type="file" accept="application/pdf" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%", maxWidth: 600 }}>
                    <p style={{ color: "#fff", fontSize: 14 }}>📄 {fileName} — {fields.length} field{fields.length !== 1 ? "s" : ""} found</p>
                    {fields.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 400, overflowY: "auto", paddingRight: 8 }}>
                            {fields.map((f, i) => (
                                <div key={i} style={{ padding: 12, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, background: "rgba(255,255,255,0.02)" }}>
                                    <label style={{ color: "#888", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>{f.name} <span style={{ color: "#555" }}>({f.type.replace("PDF", "")})</span></label>
                                    {f.type === "PDFCheckBox" ? (
                                        <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, cursor: "pointer" }}>
                                            <input type="checkbox" checked={f.value === "true"} onChange={(e) => updateField(i, e.target.checked ? "true" : "false")} style={{ accentColor: "#764ba2", width: 16, height: 16 }} />
                                            <span style={{ color: "#fff", fontSize: 13 }}>Checked</span>
                                        </label>
                                    ) : (
                                        <input style={{ ...inputStyle, marginTop: 6 }} value={f.value} onChange={(e) => updateField(i, e.target.value)} placeholder="Enter value…" />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                    {fields.length > 0 && <button className="btn btn-primary merge-btn" onClick={saveFilled}>💾 Save Filled PDF</button>}
                    {status && <p style={{ color: "#888", fontSize: 13 }}>{status}</p>}
                </div>
            )}
        </div>
    );
}

// ========== FLATTEN PDF SCREEN ==========
function FlattenScreen({ onBack }) {
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);
    const fileRef = useRef(null);

    const flattenPdf = async (file) => {
        setLoading(true);
        setStatus("Flattening PDF...");
        try {
            const buf = await file.arrayBuffer();
            const doc = await PDFDocument.load(buf);
            const form = doc.getForm();
            try { form.flatten(); } catch (e) { /* no form fields */ }
            const bytes = await doc.save();
            const blob = new Blob([bytes], { type: "application/pdf" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `flattened_${file.name}`;
            link.click();
            URL.revokeObjectURL(link.href);
            setStatus("Done! Flattened PDF downloaded. All forms & annotations are now static.");
        } catch (err) { setStatus("Error: " + err.message); }
        setLoading(false);
    };

    return (
        <div className="merge-screen">
            <button className="btn btn-secondary" onClick={onBack} style={{ alignSelf: "flex-start", marginBottom: 16 }}>← Back</button>
            {loading ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: 40 }}>
                    <div style={{ width: 40, height: 40, border: "3px solid rgba(255,255,255,0.1)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    <p style={{ color: "#888", fontSize: 14 }}>{status}</p>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                    <div className="merge-upload" onClick={() => fileRef.current?.click()}>
                        <span className="merge-upload-icon" style={{ fontSize: 28 }}>{FeatureIcons.flatten}</span>
                        <p>Upload a PDF to flatten forms & annotations</p>
                        <span className="btn btn-primary">Choose File</span>
                        <input ref={fileRef} type="file" accept="application/pdf" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) flattenPdf(f); e.target.value = ""; }} />
                    </div>
                    {status && <p style={{ color: status.startsWith("Error") ? "#ff6b6b" : "#4ade80", fontSize: 13, textAlign: "center", maxWidth: 400 }}>{status}</p>}
                </div>
            )}
        </div>
    );
}

export default PdfViewer;
