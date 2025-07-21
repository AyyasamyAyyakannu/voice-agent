# Chargebee AI Voice Assistant

A voice-enabled AI assistant for Chargebee that allows users to ask questions about Chargebee's features, pricing, integrations, and more using speech recognition or text input.

## Features

- 🎤 Voice recognition with speech-to-text
- � Real-time search using SearchAPI for Chargebee information
- 📱 Responsive design for mobile and desktop
- 🎨 Modern, accessible UI with Chargebee branding
- ⚡ Fast serverless API endpoints

## Live Demo

[View Live Demo](https://your-vercel-url.vercel.app)

## Tech Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Vercel Serverless Functions
- **Search**: SearchAPI for real-time search results
- **Speech**: Web Speech Recognition API
- **Deployment**: Vercel

## Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd voice-search
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```env
SEARCH_API_KEY=xcFdkkUfgZ2AN43MsYbixfo8
```

Get your SearchAPI key from: https://www.searchapi.io/

### 3. Local Development

```bash
npm run dev
```

This will start the Vercel development server at `http://localhost:3000`

### 4. Deploy to Vercel

#### Option A: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variable
vercel env add SEARCH_API_KEY
```

#### Option B: Deploy via GitHub

1. Push your code to GitHub
2. Connect your GitHub repo to Vercel
3. Add `SEARCH_API_KEY` in Vercel dashboard under Environment Variables
4. Deploy automatically

## Project Structure

```
voice-search/
├── api/
│   └── openai.js          # Serverless function for SearchAPI
├── index.html             # Main HTML file
├── styles.css             # All CSS styles
├── script.js              # Main JavaScript application
├── package.json           # Node.js dependencies
├── vercel.json           # Vercel configuration
├── .env.local            # Environment variables (local)
├── .gitignore            # Git ignore file
└── README.md             # This file
```

## API Endpoints

### POST /api/openai

Proxy endpoint for SearchAPI to avoid CORS issues and get real-time search results about Chargebee.

**Request Body:**
```json
{
  "query": "What is Chargebee pricing?",
  "location": "United States"
}
```

**Response:**
```json
{
  "choices": [
    {
      "message": {
        "content": "Based on the latest information about Chargebee..."
      }
    }
  ],
  "search_results": [
    {
      "title": "Chargebee Pricing",
      "snippet": "Flexible pricing plans...",
      "link": "https://chargebee.com/pricing",
      "position": 1
    }
  ]
}
```

## Features Explained

### Voice Recognition
- Uses Web Speech Recognition API
- Supports multiple browsers (Chrome, Safari, Firefox, Edge)
- Automatic permission handling with user-friendly prompts
- Real-time transcription with visual feedback

### Search Integration
- Uses SearchAPI for real-time search results
- Searches Chargebee website and related content
- Context-aware answers based on search results
- Fallback responses when search is unavailable

### User Experience
- Floating voice assistant button
- Modal interface with clean design
- Autocomplete suggestions
- Loading states and error handling
- Keyboard shortcuts (Alt+A to open, Esc to close)

## Browser Support

- ✅ Chrome/Chromium (Full support)
- ✅ Safari (Full support)
- ✅ Firefox (Full support)
- ✅ Edge (Full support)
- ⚠️ Speech recognition requires HTTPS in production

## Deployment Notes

### Environment Variables

Make sure to set these in your Vercel dashboard:

- `SEARCH_API_KEY`: Your SearchAPI key

### CORS Resolution

The original CORS issue is resolved by:
1. Using Vercel serverless functions as a proxy
2. Setting proper CORS headers in the API endpoint
3. Making requests to `/api/openai` instead of directly to OpenAI

### Security

- API key is stored securely in environment variables
- No sensitive data exposed to frontend
- Proper CORS configuration
- Input validation on API endpoints

## Customization

### Styling
Edit `styles.css` to modify the appearance:
- Change color scheme in CSS variables
- Modify animations and transitions
- Update responsive breakpoints

### AI Responses
Edit the fallback responses in `script.js`:
- Update the `fallbackResponses` object
- Modify the system prompt for OpenAI
- Add more Chargebee-specific knowledge

### Voice Recognition
Configure speech recognition in `script.js`:
- Change language (`recognition.lang`)
- Adjust sensitivity settings
- Modify error handling

## Troubleshooting

### Voice Recognition Not Working
- Ensure HTTPS is enabled (required for production)
- Check microphone permissions in browser
- Verify browser compatibility

### API Errors
- Check OpenAI API key is valid
- Verify environment variables are set
- Check API quota and billing

### CORS Issues
- Ensure you're using the `/api/openai` endpoint
- Check Vercel function deployment
- Verify CORS headers in API function

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue on GitHub
- Check browser console for errors
- Verify environment variables are set correctly
