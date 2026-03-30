export async function extractTextFromImage(imageFile, onProgress, dualLanguage = false) {
  const Tesseract = (await import('tesseract.js')).default || await import('tesseract.js');
  const lang = dualLanguage ? 'ara+eng' : 'ara';
  const worker = await Tesseract.createWorker(lang, 1, {
    logger: m => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(m.progress);
      }
    }
  });
  const { data: { text } } = await worker.recognize(imageFile);
  await worker.terminate();
  return text;
}

export async function extractTextFromPdf(pdfFile, onProgress, fastMode = false, dualLanguage = false, startPage = 1, endPage = null) {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ 
    data: arrayBuffer,
    standardFontDataUrl: `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`,
    cMapUrl: `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
    cMapPacked: true,
  }).promise;
  
  const numPages = pdf.numPages;
  const actualStartPage = Math.max(1, startPage || 1);
  const actualEndPage = endPage ? Math.min(numPages, endPage) : numPages;

  if (actualStartPage > actualEndPage) {
    throw new Error('نطاق الصفحات غير صالح (Start page is greater than End page)');
  }

  const pagesToProcess = actualEndPage - actualStartPage + 1;
  let fullTextArray = new Array(pagesToProcess);
  let completedPages = 0;
  let nextPageIndex = actualStartPage;

  if (fastMode) {
    // Fast Native Extraction (Millisecond speed)
    async function processNextPageFast() {
      while (nextPageIndex <= actualEndPage) {
        const pageIndex = nextPageIndex++;
        const page = await pdf.getPage(pageIndex);
        const textContent = await page.getTextContent();
        
        fullTextArray[pageIndex - actualStartPage] = textContent.items.map(i => i.str).join(' ');
        
        completedPages++;
        if (onProgress) onProgress(completedPages / pagesToProcess);
      }
    }
    
    const workerPromises = [];
    const maxConcurrency = Math.min(10, numPages);
    for(let c = 0; c < maxConcurrency; c++) {
      workerPromises.push(processNextPageFast());
    }
    await Promise.all(workerPromises);
    
    // Clean up corrupted PDF.js native font extraction characters
    const finalTextFast = fullTextArray.join('\n\n')
      .replace(/\uFFFD/g, '') // remove replacement characters ()
      .replace(/  +/g, ' ') // remove multiple spaces
      .replace(/\n{3,}/g, '\n\n'); 
      
    return finalTextFast;

  } else {
    // Deep OCR Extraction (Heavy)
    const Tesseract = (await import('tesseract.js')).default || await import('tesseract.js');
    const lang = dualLanguage ? 'ara+eng' : 'ara';
    const maxWorkers = Math.min(4, pagesToProcess, navigator.hardwareConcurrency || 4);
    const scheduler = Tesseract.createScheduler();

    for (let i = 0; i < maxWorkers; i++) {
      const worker = await Tesseract.createWorker(lang, 1);
      scheduler.addWorker(worker);
    }

    async function processNextPageOCR() {
      while (nextPageIndex <= actualEndPage) {
        const pageIndex = nextPageIndex++;
        
        const page = await pdf.getPage(pageIndex);
        const viewport = page.getViewport({ scale: 2.0 }); // Resilient generic scale
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        // Optional: Ensure canvas uses white background for better contrast in Tesseract
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport }).promise;
        
        // Ensure white background before converting to PNG (PDFs are often transparent)
        context.globalCompositeOperation = 'destination-over';
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        const dataUrl = canvas.toDataURL('image/png');
        
        const { data: { text } } = await scheduler.addJob('recognize', dataUrl);
        fullTextArray[pageIndex - actualStartPage] = text;
        
        completedPages++;
        if (onProgress) onProgress(completedPages / pagesToProcess);
      }
    }

    const workerPromises = [];
    for(let c = 0; c < maxWorkers; c++) {
      workerPromises.push(processNextPageOCR());
    }

    await Promise.all(workerPromises);
    await scheduler.terminate();

    // Basic cleanup of multiple empty spaces/newlines often introduced by OCR
    const finalText = fullTextArray.join('\n\n')
      .replace(/\uFFFD/g, '') // remove replacement characters ()
      .replace(/  +/g, ' ') // remove multiple spaces
      .replace(/\n{3,}/g, '\n\n'); // limit newlines
    
    return finalText;
  }
}

export async function extractTextFromFile(file, onProgress, fastMode = false, dualLanguage = false, startPage = 1, endPage = null) {
  if (file.type === 'application/pdf') {
    return extractTextFromPdf(file, onProgress, fastMode, dualLanguage, startPage, endPage);
  } else if (file.type.startsWith('image/')) {
    // Images always require OCR, fastMode is ignored. Page range is ignored.
    return extractTextFromImage(file, onProgress, dualLanguage);
  } else {
    throw new Error('Unsupported file type. Please upload a PDF or an Image.');
  }
}
