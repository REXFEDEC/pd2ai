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
        
        // Extract text from PDF
        updateProcessingStatus('Extracting text from PDF...');
        const extractedText = await extractTextFromPDF(file);
        
        if (!extractedText || extractedText.trim().length === 0) {
            throw new Error('No text could be extracted from the PDF. The PDF might be image-based or encrypted.');
        }
        
        // Send to API for summarization
        updateProcessingStatus('Generating AI summary...');
        const summary = await generateSummary(extractedText);
        
        // Display results
        displaySummary(summary);
        
    } catch (error) {
        console.error('Error processing file:', error);
        alert(`Error: ${error.message}`);
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
            throw new Error(`API request failed (${response.status}): ${errorText}`);
        }
        
        const data = await response.json();
        
        if (!data.summary) {
            throw new Error('Invalid response from API: missing summary field');
        }
        
        return data.summary;
    } catch (error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Network error: Unable to connect to the summarization service. Please check your internet connection.');
        }
        throw error;
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