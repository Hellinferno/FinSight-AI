import * as pdfjsLib from 'pdfjs-dist';

// Handle potential mismatch in export structure (ESM vs CJS default)
// In some environments, the library is on the 'default' property of the namespace.
const pdfjs = (pdfjsLib as any).default ?? pdfjsLib;

if (pdfjs.GlobalWorkerOptions) {
    // We match the version defined in index.html (3.11.174)
    pdfjs.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
} else {
    console.error("Critical: PDF.js GlobalWorkerOptions not found. PDF parsing may fail.");
}

export const extractTextFromPDF = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  
  // Ensure we call getDocument from the resolved pdfjs object
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  
  let fullText = '';
  
  // Iterate through every page
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += `\n--- Page ${i} ---\n${pageText}`;
  }
  
  return fullText;
};