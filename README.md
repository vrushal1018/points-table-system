# BGMI Tournament Points Table System

A web application that uses AI to analyze BGMI tournament slot and result images to generate points tables automatically.

## Features

- 🖼️ **AI-Powered Image Analysis**: Uses Google Gemini AI to analyze tournament images
- 📊 **Automatic Points Calculation**: Calculates position points and finish points
- 📈 **Real-time Points Table**: Generates sorted points table with rankings
- 💾 **CSV Export**: Export results to CSV format
- 🌙 **Dark Mode**: Toggle between light and dark themes
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- A valid Google Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pointstablesystem
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up your Gemini API key**
   
   **Option A: Create a .env file (Recommended)**
   ```bash
   # Create .env file in the server directory
   echo "GEMINI_API_KEY=your_actual_api_key_here" > server/.env
   ```
   
   **Option B: Set environment variable**
   ```bash
   # Windows
   set GEMINI_API_KEY=your_actual_api_key_here
   
   # Linux/Mac
   export GEMINI_API_KEY=your_actual_api_key_here
   ```

4. **Get a free Gemini API key**
   - Visit: https://makersuite.google.com/app/apikey
   - Create a new API key
   - Copy the key and use it in step 3

5. **Start the application**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   - Navigate to: http://localhost:3000
   - The React app will open automatically

## Troubleshooting

### "Failed to process image with Gemini API" Error

If you're getting this error, follow these steps:

1. **Check your API key**
   ```bash
   node test-gemini.js
   ```
   This will test if your API key is working.

2. **Common issues and solutions:**

   **❌ API Key Issues:**
   - Make sure you have a valid API key from https://makersuite.google.com/app/apikey
   - The API key should start with "AIzaSy..."
   - Check if your API key has expired

   **❌ Network Issues:**
   - Check your internet connection
   - Try using a VPN if you're behind a corporate firewall
   - The Gemini API might be blocked in some regions

   **❌ Rate Limiting:**
   - Wait a few minutes and try again
   - The free tier has rate limits

   **❌ Image Format Issues:**
   - Make sure images are JPEG, PNG, or JPG format
   - Image size should be under 10MB
   - Try with smaller, clearer images

3. **Test the API manually:**
   ```bash
   # Test basic API connectivity
   node test-gemini.js
   
   # If that fails, try with curl
   curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
   ```

4. **Alternative: Use a different API key**
   - Create a new API key from Google AI Studio
   - Update your .env file with the new key
   - Restart the server

### Server won't start

1. **Check if port 5000 is available:**
   ```bash
   # Windows
   netstat -ano | findstr :5000
   
   # Linux/Mac
   lsof -i :5000
   ```

2. **Use a different port:**
   ```bash
   set PORT=3001
   npm run server
   ```

### Client won't start

1. **Check if port 3000 is available**
2. **Clear npm cache:**
   ```bash
   npm cache clean --force
   cd client
   npm install
   ```

## Usage

1. **Upload Slot Images**: Drag and drop images showing team slots/assignments
2. **Upload Result Images**: Drag and drop images showing match results
3. **Analyze**: Click "Analyze Images" to process with AI
4. **View Results**: See the generated points table
5. **Export**: Download results as CSV

## API Endpoints

- `POST /api/analyze-slots`: Analyze slot images
- `POST /api/analyze-results`: Analyze result images

## Environment Variables

- `GEMINI_API_KEY`: Your Google Gemini API key
- `PORT`: Server port (default: 5000)
- `NODE_ENV`: Environment (development/production)

## Tech Stack

- **Frontend**: React, Axios, React Dropzone
- **Backend**: Node.js, Express, Multer
- **AI**: Google Gemini API
- **Styling**: CSS3 with dark mode support

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details 