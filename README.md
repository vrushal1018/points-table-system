# BGMI Points Table System

A comprehensive tournament management system for BGMI (Battlegrounds Mobile India) tournaments that automatically generates points tables from tournament images using AI.

## 🚀 Features

- **Multi-Image Support**: Upload up to 10 images for both slot registration and tournament results
- **AI-Powered Analysis**: Uses Google Gemini API to extract team information and results from images
- **Automatic Points Calculation**: Generates comprehensive points tables with rankings
- **Enhanced Error Handling**: Robust retry mechanism for API overload scenarios
- **Export Functionality**: Download results as CSV files
- **Real-time Processing**: Live feedback during image analysis

## 🛠️ Tech Stack

- **Frontend**: React.js with modern UI components
- **Backend**: Node.js with Express.js
- **AI Integration**: Google Gemini API for image analysis
- **File Upload**: Multer for handling multipart form data
- **Styling**: CSS3 with responsive design

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Google Gemini API key

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/vrushal1018/points-table-system.git
   cd points-table-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd client && npm install
   cd ..
   ```

3. **Set up environment variables**
   Create a `.env` file in the `server` directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Get Gemini API Key**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Add it to your `.env` file

## 🏃‍♂️ Running the Application

### Development Mode
```bash
npm run dev
```

This will start both the backend server (port 5000) and React frontend (port 3000).

### Production Mode
```bash
# Build the React app
cd client && npm run build

# Start the server
cd .. && npm start
```

## 📖 Usage

1. **Open the application** at `http://localhost:3000`

2. **Upload Slot Images**:
   - Click "Choose Files" in the Slot Images section
   - Upload images showing team registrations/slots
   - You can upload up to 10 images

3. **Upload Result Images**:
   - Click "Choose Files" in the Result Images section
   - Upload images showing tournament results
   - You can upload up to 10 images

4. **Analyze Images**:
   - Click "Analyze Images" button
   - The system will process all images using AI

5. **View Results**:
   - Generated points table shows:
     - Team rankings
     - Total finishes
     - Position points
     - Total points

6. **Export Results**:
   - Click "Export to CSV" to download results

## 🔧 API Endpoints

- `POST /api/analyze-slots` - Analyze slot registration images
- `POST /api/analyze-results` - Analyze tournament result images
- `GET /api/health` - Health check endpoint

## 🛡️ Error Handling

The system includes robust error handling for:
- **API Overload**: Automatic retry with exponential backoff
- **Network Timeouts**: Extended timeout periods
- **Invalid Images**: Graceful error messages
- **Rate Limiting**: Built-in delays between API calls

## 📁 Project Structure

```
pointstablesystem/
├── client/                 # React frontend
│   ├── src/
│   │   ├── App.js         # Main application component
│   │   ├── App.css        # Styling
│   │   └── index.js       # Entry point
│   └── package.json
├── server/                 # Node.js backend
│   ├── index.js           # Express server with API routes
│   └── .env               # Environment variables
├── package.json           # Root package.json
└── README.md             # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues:
1. Check the console for error messages
2. Ensure your Gemini API key is valid
3. Verify all dependencies are installed
4. Check that both servers are running (ports 3000 and 5000)

## 🔄 Recent Updates

- ✅ Multi-image upload support (up to 10 images per category)
- ✅ Enhanced error handling with retry mechanism
- ✅ Improved UI with image previews and removal
- ✅ Export functionality for results
- ✅ Health check endpoint for monitoring

---

**Built with ❤️ for the BGMI community** 