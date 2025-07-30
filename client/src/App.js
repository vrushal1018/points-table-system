import React, { useState } from 'react';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import { FiUpload, FiDownload, FiMoon, FiSun, FiRefreshCw } from 'react-icons/fi';
import './App.css';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [slotImages, setSlotImages] = useState([]);
  const [resultImages, setResultImages] = useState([]);
  const [pointsTable, setPointsTable] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Position points mapping
  const positionPoints = {
    1: 10, 2: 6, 3: 5, 4: 4, 5: 3, 6: 2, 7: 1, 8: 1
  };

  // Calculate points directly from result data
  const calculatePointsFromResults = (results) => {
    const calculatedResults = {};
    
    for (let key in results) {
      let team = { ...results[key] }; // Create a copy
      
      // Finishes check
      if (!team.finishes || team.finishes.length === 0) {
        console.warn(`No finishes found for team at rank ${team.rank}`);
        team.total_finishes = 0;
      } else {
        team.total_finishes = team.finishes.reduce((a, b) => a + b, 0);
      }
      
      // Position Points
      const positionPoint = positionPoints[team.rank] || 0;
      team.position_points = positionPoint;
      
      // Total Points
      team.total_points = team.total_finishes + team.position_points;
      
      calculatedResults[key] = team;
    }
    
    return calculatedResults;
  };

  // Dropzone for slot images
  const {
    getRootProps: getSlotRootProps,
    getInputProps: getSlotInputProps,
    isDragActive: isSlotDragActive
  } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxFiles: 10,
    multiple: true,
    onDrop: acceptedFiles => {
      setSlotImages(acceptedFiles);
      setError('');
    }
  });

  // Dropzone for result images
  const {
    getRootProps: getResultRootProps,
    getInputProps: getResultInputProps,
    isDragActive: isResultDragActive
  } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxFiles: 10,
    multiple: true,
    onDrop: acceptedFiles => {
      setResultImages(acceptedFiles);
      setError('');
    }
  });

  // Analyze images with Gemini AI
  const analyzeImages = async () => {
    if (slotImages.length === 0 || resultImages.length === 0) {
      setError('Please upload both slot images and result images');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Analyze slot images
      const slotFormData = new FormData();
      slotImages.forEach(image => {
        slotFormData.append('images', image);
      });

      const slotResponse = await axios.post('/api/analyze-slots', slotFormData);
      const slots = slotResponse.data.data;

      // Analyze result images
      const resultFormData = new FormData();
      resultImages.forEach(image => {
        resultFormData.append('images', image);
      });

      const resultResponse = await axios.post('/api/analyze-results', resultFormData);
      const results = resultResponse.data.data;

      console.log('Slots data:', slots);
      console.log('Results data:', results);
      
      // Debug: Check if results is an object with rank keys
      if (results && typeof results === 'object') {
        console.log('Results keys:', Object.keys(results));
        Object.entries(results).forEach(([rank, data]) => {
          console.log(`Rank ${rank}:`, data);
        });
      }
      
      // Calculate points directly from results
      const calculatedResults = calculatePointsFromResults(results);
      console.log('Calculated results:', calculatedResults);
      
      // Create points table from calculated results
      createPointsTableFromResults(calculatedResults);

    } catch (error) {
      console.error('Analysis error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to analyze images';
      const errorDetails = error.response?.data?.details || '';
      
      let displayError = errorMessage;
      if (errorDetails) {
        displayError += `\n\n${errorDetails}`;
      }
      
      // Handle specific overloaded error
      if (errorMessage.includes('overloaded')) {
        displayError = 'Gemini API is currently overloaded. Please wait 2-3 minutes and try again.';
      }
      
      setError(displayError);
    } finally {
      setLoading(false);
    }
  };

  // Create points table from calculated results
  const createPointsTableFromResults = (calculatedResults) => {
    console.log('Creating points table from calculated results:', calculatedResults);
    const table = [];
    
    // Convert results object to array and sort by total points
    Object.values(calculatedResults).forEach(result => {
      table.push({
        slot_no: null, // We don't have slot info from results
        team_members: result.team_members,
        total_finishes: result.total_finishes,
        position_points: result.position_points,
        total_points: result.total_points,
        rank: result.rank
      });
    });
    
    // Sort by total points (descending)
    table.sort((a, b) => b.total_points - a.total_points);
    console.log('Final points table:', table);
    setPointsTable(table);
  };

  // Calculate points table with improved team matching (keeping for reference)
  // eslint-disable-next-line no-unused-vars
  const calculatePointsTable = (slots, results) => {
    console.log('Calculating points table with:', { slots, results });
    const table = [];

    // For each slot, find matching results and calculate points
    slots.forEach(slot => {
      console.log(`Processing slot ${slot.slot_no}:`, slot.team_members);
      
      // Find matching result by comparing team members
      let matchingResult = null;
      let bestMatchScore = 0;
      
      Object.values(results).forEach(result => {
        console.log(`Comparing with result rank ${result.rank}:`, result.team_members);
        
        // More flexible matching logic - handle OCR variations better
        const normalizeName = (name) => {
          return name.toLowerCase()
            .replace(/[^a-z0-9]/g, '') // Remove special characters
            .replace(/x/g, '') // Remove 'x' characters
            .replace(/[0-9]/g, '') // Remove numbers
            .replace(/[×¬]/g, ''); // Remove special characters like × and ¬
        };
        
        const slotMembers = slot.team_members.map(normalizeName);
        const resultMembers = result.team_members.map(normalizeName);
        
        console.log('Normalized slot members:', slotMembers);
        console.log('Normalized result members:', resultMembers);
        
        // Calculate match score based on common members
        let matchScore = 0;
        let matchedMembers = [];
        
        slotMembers.forEach((slotMember, slotIndex) => {
          resultMembers.forEach((resultMember, resultIndex) => {
            // Check for exact match or partial match
            if (slotMember === resultMember && slotMember.length > 2) {
              matchScore += 3; // Exact match
              matchedMembers.push(`${slot.team_members[slotIndex]} = ${result.team_members[resultIndex]}`);
            } else if (slotMember.includes(resultMember) && resultMember.length > 2) {
              matchScore += 2; // Slot contains result
              matchedMembers.push(`${slot.team_members[slotIndex]} contains ${result.team_members[resultIndex]}`);
            } else if (resultMember.includes(slotMember) && slotMember.length > 2) {
              matchScore += 2; // Result contains slot
              matchedMembers.push(`${result.team_members[resultIndex]} contains ${slot.team_members[slotIndex]}`);
            }
          });
        });
        
        console.log(`Match score for slot ${slot.slot_no} vs result rank ${result.rank}: ${matchScore}`);
        console.log('Matched members:', matchedMembers);
        
        if (matchScore > bestMatchScore && matchScore >= 3) {
          bestMatchScore = matchScore;
          matchingResult = result;
          console.log('Better match found!', result, 'Score:', matchScore);
        }
      });

      if (matchingResult) {
        const positionPointsEarned = positionPoints[matchingResult.rank] || 0;
        const totalPoints = matchingResult.total_finishes + positionPointsEarned;
        console.log(`Points calculation for slot ${slot.slot_no}:`, {
          rank: matchingResult.rank,
          positionPoints: positionPointsEarned,
          finishes: matchingResult.total_finishes,
          totalPoints
        });

        table.push({
          slot_no: slot.slot_no,
          team_members: slot.team_members,
          total_finishes: matchingResult.total_finishes,
          position_points: positionPointsEarned,
          total_points: totalPoints,
          rank: matchingResult.rank
        });
      } else {
        console.log(`No match found for slot ${slot.slot_no}`);
        // Team not found in results
        table.push({
          slot_no: slot.slot_no,
          team_members: slot.team_members,
          total_finishes: 0,
          position_points: 0,
          total_points: 0,
          rank: null
        });
      }
    });

    console.log('Final table:', table);
    // Sort by total points (descending)
    table.sort((a, b) => b.total_points - a.total_points);
    setPointsTable(table);
  };

  // Export to CSV
  const exportToCSV = () => {
    if (pointsTable.length === 0) return;

    const headers = ['Slot No', 'Team Members', 'Finishes', 'Position Points', 'Total Points'];
    const csvContent = [
      headers.join(','),
      ...pointsTable.map(row => [
        row.slot_no,
        `"${row.team_members.join(', ')}"`,
        row.total_finishes,
        row.position_points,
        row.total_points
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bgmi_points_table.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Reset all data
  const resetData = () => {
    setSlotImages([]);
    setResultImages([]);
    setPointsTable([]);
    setError('');
  };

  return (
    <div className={`app ${darkMode ? 'dark-mode' : ''}`}>
      <div className="container">
        <header className="header">
          <h1>BGMI Points Table System</h1>
          <button 
            className="theme-toggle"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? <FiSun /> : <FiMoon />}
          </button>
        </header>

        <div className="content">
          {/* Upload Section */}
          <div className="upload-section">
            <div className="upload-card">
              <h3>Upload Slot Images</h3>
              <div 
                {...getSlotRootProps()} 
                className={`upload-area ${isSlotDragActive ? 'active' : ''}`}
              >
                <input {...getSlotInputProps()} />
                {slotImages.length > 0 ? (
                  <div className="uploaded-files">
                    <FiUpload />
                    <p>{slotImages.length} image(s) selected</p>
                    <ul>
                      {slotImages.map((file, index) => (
                        <li key={index}>{file.name}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <FiUpload />
                    <p>Drag & drop slot images here, or click to select</p>
                  </div>
                )}
              </div>
            </div>

            <div className="upload-card">
              <h3>Upload Result Images</h3>
              <div 
                {...getResultRootProps()} 
                className={`upload-area ${isResultDragActive ? 'active' : ''}`}
              >
                <input {...getResultInputProps()} />
                {resultImages.length > 0 ? (
                  <div className="uploaded-files">
                    <FiUpload />
                    <p>{resultImages.length} image(s) selected</p>
                    <ul>
                      {resultImages.map((file, index) => (
                        <li key={index}>{file.name}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <FiUpload />
                    <p>Drag & drop result images here, or click to select</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button 
              className="btn btn-primary"
              onClick={analyzeImages}
              disabled={loading || slotImages.length === 0 || resultImages.length === 0}
            >
              {loading ? (
                <>
                  <FiRefreshCw className="spinning" />
                  Analyzing...
                </>
              ) : (
                'Analyze Images'
              )}
            </button>
            <button 
              className="btn btn-secondary"
              onClick={resetData}
              disabled={loading}
            >
              Reset
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Results Section */}
          {pointsTable.length > 0 && (
            <div className="results-section">
              <div className="results-header">
                <h2>Points Table</h2>
                <button 
                  className="btn btn-secondary"
                  onClick={exportToCSV}
                >
                  <FiDownload />
                  Export CSV
                </button>
              </div>

              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Slot No</th>
                      <th>Team Members</th>
                      <th>Finishes</th>
                      <th>Position Points</th>
                      <th>Total Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pointsTable.map((row, index) => (
                      <tr key={row.slot_no}>
                        <td>{index + 1}</td>
                        <td>{row.slot_no}</td>
                        <td>
                          <div className="team-members">
                            {row.team_members.map((member, idx) => (
                              <span key={idx} className="member">
                                {member}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>{row.total_finishes}</td>
                        <td>{row.position_points}</td>
                        <td className="total-points">{row.total_points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App; 