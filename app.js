// DOM Elements
const uploadSection = document.getElementById('uploadSection');
const processingSection = document.getElementById('processingSection');
const summarySection = document.getElementById('summarySection');
const uploadCard = document.getElementById('uploadCard');
const fileInput = document.getElementById('fileInput');
const uploadButton = document.getElementById('uploadButton');
const processingStatus = document.getElementById('processingStatus');
const summaryContent = document.getElementById('summaryContent');
const resetButton = document.getElementById('resetButton');

// API Configuration
const API_ENDPOINT = 'https://pdf.sameermann5335.workers.dev';

// State Management
let isProcessing = false;

// Initialize Event Listeners
function initializeEventListeners() {
    // File input change
    fileInput.addEventListener('change', handleFileSelect);

    // Upload button click
    uploadButton.addEventListener('click', () => {
        if (!isProcessing) {
            fileInput.click();
        }
    });

    // Drag and drop events
    uploadCard.addEventListener('dragover', handleDragOver);
    uploadCard.addEventListener('dragleave', handleDragLeave);
    uploadCard.addEventListener('drop', handleDrop);

    // Reset button
    resetButton.addEventListener('click', resetApplication);

    // Prevent default drag behaviors on document
    document.addEventListener('dragover', (e) => e.preventDefault());
    document.addEventListener('drop', (e) => e.preventDefault());
}

// File Selection Handler
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
        processFile(file);
    } else if (file) {
        alert('Please select a valid PDF file.');
        fileInput.value = '';
    }
}

// Drag and Drop Handlers
function handleDragOver(event) {
    event.preventDefault();
    uploadCard.classList.add('dragover');
}

function handleDragLeave(event) {
    event.preventDefault();
    if (!uploadCard.contains(event.relatedTarget)) {
        uploadCard.classList.remove('dragover');
    }
}

function handleDrop(event) {
    event.preventDefault();
    uploadCard.classList.remove('dragover');

    const files = event.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        if (file.type === 'application/pdf') {
            fileInput.files = files;
            processFile(file);
        } else {
            alert('Please drop a valid PDF file.');
        }
    }
}

// Main File Processing Function
async function processFile(file) {
    if (isProcessing) return;

    try {
        isProcessing = true;
        showProcessingSection();

        // Try extracting text using PDF.js first
        updateProcessingStatus('Extracting text from PDF...');
        let extractedText = await extractTextFromPDF(file);

        // If PDF.js extraction fails or returns little/no text, try OCR.space
        if (!extractedText || extractedText.trim().length < 10) {
            updateProcessingStatus('No selectable text found. Using OCR.space (cloud OCR)...');
            extractedText = await extractTextWithOCRSpacePerPage(file); // Use per-page version
        }

        if (!extractedText || extractedText.trim().length === 0) {
            throw new Error('No text could be extracted from the PDF. The PDF might be image-based or encrypted.');
        }

        // Limit input length for AI backend
        const MAX_INPUT_LENGTH = 12000;
        const inputForSummary = extractedText.slice(0, MAX_INPUT_LENGTH);

        // Send to API for summarization
        updateProcessingStatus('Generating AI summary...');
        const summary = await generateSummary(inputForSummary);

        // Display results
        if (summary) {
            displaySummary(summary);
        } else {
            summaryContent.textContent = "No summary returned from AI backend.";
            showSection(summarySection);
        }

    } catch (error) {
        console.error('Error processing file:', error);
        summaryContent.textContent = `Error: ${error.message}`;
        showSection(summarySection);
        resetApplication();
    } finally {
        isProcessing = false;
    }
}

// PDF Text Extraction
async function extractTextFromPDF(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        let fullText = '';
        const totalPages = pdf.numPages;

        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
            updateProcessingStatus(`Extracting text from page ${pageNum} of ${totalPages}...`);

            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();

            const pageText = textContent.items
                .map(item => item.str)
                .join(' ');

            fullText += pageText + '\n\n';
        }

        return fullText.trim();
    } catch (error) {
        throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
}

// Per-Page OCR.space API: Extract text from each page of the PDF using OCR.space
async function extractTextWithOCRSpacePerPage(file) {
    const apiKey = 'K84860922088957';
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    summaryContent.textContent = '';
    showSection(summarySection);

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        // Render and resize/compress to image blob
        const imageBlob = await pdfPageToResizedImageBlob(page);

        // Send image to OCR.space
        const formData = new FormData();
        formData.append('file', imageBlob, `page${i}.jpg`);
        formData.append('language', 'eng');
        formData.append('isOverlayRequired', 'false');
        formData.append('OCREngine', '2');

        updateProcessingStatus(`Uploading page ${i} of ${pdf.numPages} to OCR.space...`);

        const response = await fetch('https://api.ocr.space/parse/image', {
            method: 'POST',
            headers: { 'apikey': apiKey },
            body: formData
        });

        const result = await response.json();
        let pageText = '';
        if (result.ParsedResults && result.ParsedResults.length > 0) {
            pageText = result.ParsedResults[0].ParsedText;
        }
        fullText += `--- Page ${i} ---\n${pageText}\n\n`;
        summaryContent.textContent += `--- Page ${i} ---\n${pageText}\n\n`;
    }

    return fullText;
}

// Render PDF page to resized/compressed image blob (JPEG)
async function pdfPageToResizedImageBlob(pdfPage, maxWidth = 1200, maxHeight = 1600, quality = 0.8) {
    // Render PDF page to canvas
    const viewport = pdfPage.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await pdfPage.render({ canvasContext: context, viewport }).promise;

    // Resize if needed
    let targetCanvas = canvas;
    if (canvas.width > maxWidth || canvas.height > maxHeight) {
        targetCanvas = document.createElement('canvas');
        const scale = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);
        targetCanvas.width = canvas.width * scale;
        targetCanvas.height = canvas.height * scale;
        targetCanvas.getContext('2d').drawImage(canvas, 0, 0, targetCanvas.width, targetCanvas.height);
    }

    // Compress to JPEG (smaller than PNG)
    let blob = await new Promise(resolve => targetCanvas.toBlob(resolve, 'image/jpeg', quality));
    // If still too big, reduce quality and try again
    while (blob.size > 950 * 1024 && quality > 0.3) {
        quality -= 0.1;
        blob = await new Promise(resolve => targetCanvas.toBlob(resolve, 'image/jpeg', quality));
    }
    return blob;
}

// API Call for Summary Generation
async function generateSummary(text) {
    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: text
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            summaryContent.textContent = "AI backend error response:\n" + errorText;
            showSection(summarySection);
            throw new Error(`API request failed (${response.status})`);
        }

        const data = await response.json();

        if (!data.summary) {
            summaryContent.textContent = "AI backend response:\n" + JSON.stringify(data, null, 2);
            showSection(summarySection);
            return null;
        }

        return data.summary;
    } catch (error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            summaryContent.textContent = 'Network error: Unable to connect to the summarization service. Please check your internet connection.';
            showSection(summarySection);
            return null;
        }
        summaryContent.textContent = `Unexpected error:\n${error.message}`;
        showSection(summarySection);
        return null;
    }
}

// UI State Management
function showSection(sectionToShow) {
    const sections = [uploadSection, processingSection, summarySection];

    sections.forEach(section => {
        if (section === sectionToShow) {
            section.classList.remove('hidden');
        } else {
            section.classList.add('hidden');
        }
    });
}

function showProcessingSection() {
    showSection(processingSection);
}

function updateProcessingStatus(status) {
    processingStatus.textContent = status;
}

function displaySummary(summary) {
    summaryContent.textContent = summary;
    showSection(summarySection);
}

function resetApplication() {
    // Reset form
    fileInput.value = '';

    // Clear previous results
    summaryContent.textContent = '';

    // Reset state
    isProcessing = false;

    // Remove drag states
    uploadCard.classList.remove('dragover');

    // Show upload section
    showSection(uploadSection);
}

// Utility Functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Enhanced Error Handling
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    if (isProcessing) {
        alert('An unexpected error occurred. Please try again.');
        resetApplication();
    }
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    if (isProcessing) {
        alert('An unexpected error occurred. Please try again.');
        resetApplication();
    }
});

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();

    // Ensure PDF.js is loaded
    if (typeof pdfjsLib === 'undefined') {
        alert('PDF.js library failed to load. Please refresh the page and try again.');
    }

    console.log('AI PDF Summarizer initialized successfully');
});