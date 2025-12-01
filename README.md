# AI PDF Summarizer

A modern web application that extracts and summarizes PDF content using AI-powered technology. Built with vanilla JavaScript, featuring a clean UI and intelligent text extraction with OCR fallback.

## ✨ Features

- **Drag & Drop Interface**: Intuitive file upload with drag-and-drop support
- **Dual Text Extraction**: Uses PDF.js for text-based PDFs, falls back to OCR.space for image-based PDFs
- **AI-Powered Summarization**: Leverages a Cloudflare Workers API backend for intelligent text summarization
- **Progress Tracking**: Real-time processing status with visual timeline
- **Responsive Design**: Mobile-friendly interface built with modern CSS
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **No Build Required**: Pure HTML/CSS/JS - just open `index.html` in a browser

## 🚀 Quick Start

1. Clone or download this repository
2. Open `index.html` in your web browser
3. Upload a PDF file and get your AI-generated summary

No installation, dependencies, or build process required!

## 🏗️ Architecture

### Frontend Components

- **`index.html`**: Main HTML structure with semantic markup and accessibility features
- **`styles.css`**: Modern CSS with Vercel-inspired design system, responsive layout
- **`app.js`**: Core application logic for file handling and API communication
- **`ui-enhancements.js`**: UI animations, progress tracking, and user experience enhancements

### Key Features

#### Text Extraction Pipeline
1. **PDF.js**: First attempts to extract selectable text directly
2. **OCR.space**: Fallback for image-based PDFs using cloud OCR API
3. **Page-by-page processing**: Handles large PDFs efficiently with progress updates

#### Processing Flow
```
Upload PDF → Extract Text (PDF.js) → [Fallback: OCR.space] → AI Summarization → Display Results
```

#### API Integration
- **OCR.space API**: For image-to-text conversion (API key included)
- **Custom AI API**: Cloudflare Workers endpoint for text summarization
- **Error Recovery**: Network error handling and retry logic

## 🛠️ Technical Details

### Dependencies
- **PDF.js** (v3.4.120): PDF text extraction and rendering
- **PDF-lib**: PDF manipulation utilities
- **OCR.space API**: Cloud OCR service for image-based PDFs

### File Structure
```
pd2ai/
├── index.html          # Main application page
├── styles.css          # Styling and design system
├── app.js              # Core application logic
├── ui-enhancements.js  # UI animations and enhancements
└── README.md           # This file
```

### Browser Support
- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

### Performance Considerations
- **Optimal PDF Size**: 10 pages or fewer for best performance
- **File Size Limit**: 10MB maximum file size
- **Processing Time**: Varies based on PDF complexity and size

## 🔧 Configuration

### API Endpoints
- **AI Summarization**: `https://pdf.sameermann5335.workers.dev`
- **OCR Service**: `https://api.ocr.space/parse/image`

### Customization
- Modify `API_ENDPOINT` in `app.js` to use your own summarization service
- Update OCR API key in `extractTextWithOCRSpacePerPage()` function
- Adjust `MAX_INPUT_LENGTH` for different text processing limits

## 🎨 UI Features

### Design System
- Modern color palette with CSS custom properties
- Inter font family for optimal readability
- Consistent spacing and border radius system
- Smooth transitions and micro-interactions

### Accessibility
- ARIA labels and roles for screen readers
- Keyboard navigation support
- High contrast color scheme
- Semantic HTML structure

### Responsive Design
- Mobile-first approach
- Flexible layout system
- Touch-friendly interface elements

## 📝 Usage Examples

### Basic Usage
1. Click "Select PDF" or drag a file onto the upload area
2. Wait for processing (text extraction → OCR if needed → summarization)
3. View the generated summary
4. Click "New PDF" to process another file

### Supported PDF Types
- Text-based PDFs (direct extraction)
- Scanned documents (OCR processing)
- Mixed content PDFs
- Multi-page documents

## 🐛 Troubleshooting

### Common Issues
- **Large PDFs**: Processing may take longer for files with many pages
- **Image-only PDFs**: OCR processing is automatic but slower
- **Network Errors**: Check internet connection for API calls
- **Corrupted PDFs**: Application will display error messages

### Error Handling
- Global error catching with user-friendly alerts
- Network timeout handling
- API error response parsing
- Graceful fallback mechanisms

## 🔒 Privacy & Security

- **Client-side Processing**: PDF processing happens in your browser
- **API Communications**: Only extracted text is sent to external services
- **No File Storage**: Files are not permanently stored on servers
- **OCR Processing**: Images are temporarily sent to OCR.space for text extraction

## 🤝 Contributing

Feel free to submit issues, feature requests, or pull requests to improve this application.

### Development Setup
1. Fork the repository
2. Make your changes
3. Test thoroughly in multiple browsers
4. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

## 🌟 Live Demo

Check out the live version at: [https://pdf.goneto.space](https://pdf.goneto.space)

---

**Built by Sameer** | [GitHub](https://github.com/rexfedec) | [Portfolio](https://sameer.goneto.space)
