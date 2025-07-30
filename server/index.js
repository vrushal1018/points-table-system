const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files only in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
}

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Max 10 files
  }
});

// Gemini API configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBhzKG4ExA1OtNv7temqU4Xy2PeuJrnjZg';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// Validate API key
if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
  console.error('❌ GEMINI_API_KEY is not properly configured. Please set a valid API key.');
  console.error('   You can get a free API key from: https://makersuite.google.com/app/apikey');
}

// Helper function to encode image to base64
function encodeImageToBase64(buffer) {
  return buffer.toString('base64');
}

// Helper function to call Gemini API with retry mechanism
async function callGeminiAPI(imageBase64, prompt, retryCount = 0) {
  const maxRetries = 3;
  const baseDelay = 2000; // 2 seconds base delay
  
  try {
    console.log(`🔍 Calling Gemini API... (Attempt ${retryCount + 1}/${maxRetries + 1})`);
    console.log('📝 Prompt length:', prompt.length);
    console.log('🖼️  Image size:', Math.round(imageBase64.length / 1024), 'KB');
    
    const response = await axios.post(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      contents: [{
        parts: [
          {
            text: prompt
          },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: imageBase64
            }
          }
        ]
      }]
    }, {
      timeout: 45000, // Increased timeout to 45 seconds
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Gemini API call successful');
    return response.data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('❌ Gemini API Error Details:');
    console.error('   Status:', error.response?.status);
    console.error('   Status Text:', error.response?.statusText);
    console.error('   Error Data:', error.response?.data);
    console.error('   Error Message:', error.message);
    
    // Check if this is a retryable error
    const isRetryable = error.response?.status === 503 ||
                       error.response?.status === 429 ||
                       error.code === 'ECONNABORTED' ||
                       (error.response?.data?.error?.message &&
                        error.response.data.error.message.includes('overloaded'));
    
    if (isRetryable && retryCount < maxRetries) {
      const delay = baseDelay * Math.pow(2, retryCount); // Exponential backoff
      console.log(`⏳ Retrying in ${delay/1000} seconds... (Attempt ${retryCount + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callGeminiAPI(imageBase64, prompt, retryCount + 1);
    }
    
    // If not retryable or max retries reached, throw error
    let errorMessage = 'Gemini API error';
    
    if (error.response?.status === 400) {
      errorMessage = 'Invalid request to Gemini API. Please check your images.';
    } else if (error.response?.status === 403) {
      errorMessage = 'API key is invalid or has insufficient permissions.';
    } else if (error.response?.status === 429) {
      errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
    } else if (error.response?.status === 503) {
      errorMessage = 'Gemini API is temporarily unavailable. Please try again later.';
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'Request timeout. Please try again.';
    } else if (error.response?.data?.error?.message) {
      errorMessage = `Gemini API error: ${error.response.data.error.message}`;
    } else {
      errorMessage = `Gemini API error: ${error.message}`;
    }
    
    throw new Error(errorMessage);
  }
}

// Route to analyze slot images
app.post('/api/analyze-slots', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No images uploaded' });
    }

    const allSlots = [];
    
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      console.log(`📸 Processing slot image ${i + 1}/${req.files.length}: ${file.originalname}`);
      const imageBase64 = encodeImageToBase64(file.buffer);
      
      const prompt = `Analyze this BGMI tournament slot image and extract team information. 
      Return ONLY a JSON array with this exact format:
      [
        {
          "slot_no": 4,
          "team_members": ["Player1", "Player2", "Player3", "Player4"]
        }
      ]
      
      Extract all team slots and their members. Ensure the JSON is valid and complete.`;

      try {
        const result = await callGeminiAPI(imageBase64, prompt);
        console.log('Gemini result for slot image:', result);
        
        // Try to extract JSON from the response
        const jsonMatch = result.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsedData = JSON.parse(jsonMatch[0]);
          console.log('Parsed slot data:', parsedData);
          allSlots.push(...parsedData);
        } else {
          console.log('No JSON found in slot result:', result);
        }
      } catch (apiError) {
        console.error(`❌ Failed to process image ${i + 1}:`, apiError.message);
        continue; // Continue with other images
      }
      
      // Add delay between API calls to prevent rate limiting
      if (i < req.files.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      }
    }

    // Remove duplicates based on slot_no
    const uniqueSlots = allSlots.filter((slot, index, self) => 
      index === self.findIndex(s => s.slot_no === slot.slot_no)
    );

    if (uniqueSlots.length === 0) {
      return res.status(500).json({
        error: 'No valid data extracted from images',
        details: 'Please check if your images contain clear slot information and try again.'
      });
    }

    res.json({ success: true, data: uniqueSlots });
      } catch (error) {
      console.error('❌ Slot analysis error:', error);
      res.status(500).json({ 
        error: error.message,
        details: 'Failed to analyze slot images. Please check your images and try again.'
      });
    }
});

// Route to analyze result images
app.post('/api/analyze-results', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No images uploaded' });
    }

    const allResults = [];
    
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      console.log(`📸 Processing result image ${i + 1}/${req.files.length}: ${file.originalname}`);
      const imageBase64 = encodeImageToBase64(file.buffer);
      
      const prompt = `Analyze this BGMI tournament result image and extract ALL team result data.
      
      The image layout is:
      - LEFT SIDE: Team rank (1, 2, 3, etc.)
      - CENTER: Team player names
      - RIGHT SIDE: Individual finishes for each player
      
      This image contains MULTIPLE teams. Extract ALL teams from the image.
      
      Return ONLY a JSON array with this exact format:
      [
        {
          "rank": 1,
          "team_members": ["Player1", "Player2", "Player3", "Player4"],
          "finishes": [3, 4, 4, 3],
          "total_finishes": 14
        },
        {
          "rank": 2,
          "team_members": ["Player5", "Player6", "Player7", "Player8"],
          "finishes": [2, 1, 3, 2],
          "total_finishes": 8
        }
      ]
      
      Extract ALL teams from the image. Each team has a rank, player names, and individual finishes. Calculate total finishes for each team by summing individual finishes.`;

      try {
        const result = await callGeminiAPI(imageBase64, prompt);
        console.log('Gemini result for result image:', result);
        
        // Try to extract JSON array from the response
        const jsonMatch = result.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsedData = JSON.parse(jsonMatch[0]);
          console.log('Parsed result data:', parsedData);
          // Add all teams from this image to the results
          allResults.push(...parsedData);
        } else {
          console.log('No JSON array found in result:', result);
        }
      } catch (apiError) {
        console.error(`❌ Failed to process image ${i + 1}:`, apiError.message);
        continue; // Continue with other images
      }
      
      // Add delay between API calls to prevent rate limiting
      if (i < req.files.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      }
    }

    // Convert array to object with rank as key, but handle duplicates by appending image index
    const results = {};
    allResults.forEach((result, index) => {
      // Use rank as key, but if duplicate exists, append index
      let key = result.rank.toString();
      let counter = 0;
      while (results[key]) {
        counter++;
        key = `${result.rank}_${counter}`;
      }
      results[key] = result;
    });

    if (Object.keys(results).length === 0) {
      return res.status(500).json({
        error: 'No valid data extracted from images',
        details: 'Please check if your images contain clear result information and try again.'
      });
    }

    res.json({ success: true, data: results });
      } catch (error) {
      console.error('❌ Result analysis error:', error);
      res.status(500).json({ 
        error: error.message,
        details: 'Failed to analyze result images. Please check your images and try again.'
      });
    }
});

// Serve React app for all other routes (production only)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 