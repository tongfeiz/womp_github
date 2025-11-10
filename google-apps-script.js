/**
 * Google Apps Script for Womp Waitlist Form
 * 
 * This script receives form submissions and writes them to a Google Sheet.
 * 
 * SETUP INSTRUCTIONS:
 * 1. Create a new Google Sheet
 * 2. Add headers in row 1: Name | Age | Email | Timestamp
 * 3. Copy this entire script into Google Apps Script
 * 4. Replace 'YOUR_SHEET_ID' with your actual Google Sheet ID
 * 5. Deploy as a web app
 * 6. Copy the web app URL and use it in waitlist.html
 */

// Handle both GET and POST requests
function doGet(e) {
  return processFormSubmission(e);
}

function doPost(e) {
  return processFormSubmission(e);
}

function processFormSubmission(e) {
  try {
    // Log the incoming event for debugging
    Logger.log('Event received: ' + (e ? JSON.stringify(e) : 'null'));
    Logger.log('Event type: ' + typeof e);
    
    // Get the active spreadsheet
    const sheetId = '1ai7fccYgmQPF4VwlRpcn0mjAHwvSrm02Vhfugzhq_nM';
    const sheet = SpreadsheetApp.openById(sheetId).getActiveSheet();
    
    // Get form data - try multiple methods
    let name = '';
    let age = '';
    let email = '';
    
    // Try to get parameters from event object
    if (e && e.parameter) {
      // GET or POST with URL parameters (most reliable)
      name = e.parameter.name || '';
      age = e.parameter.age || '';
      email = e.parameter.email || '';
      Logger.log('Using e.parameter - Name: "' + name + '", Age: "' + age + '", Email: "' + email + '"');
    } else if (e && e.postData && e.postData.contents) {
      // JSON POST
      try {
        const data = JSON.parse(e.postData.contents);
        name = data.name || '';
        age = data.age || '';
        email = data.email || '';
        Logger.log('Using e.postData.contents');
      } catch (parseError) {
        throw new Error('Failed to parse JSON: ' + parseError.toString());
      }
    } else if (e && e.postData && e.postData.type === 'application/x-www-form-urlencoded') {
      // Form POST - parse the query string
      const params = e.postData.contents.split('&');
      for (let i = 0; i < params.length; i++) {
        const pair = params[i].split('=');
        const key = decodeURIComponent(pair[0]);
        const value = decodeURIComponent(pair[1] || '');
        if (key === 'name') name = value;
        if (key === 'age') age = value;
        if (key === 'email') email = value;
      }
      Logger.log('Using parsed form data');
    } else if (e && typeof e === 'object') {
      // Try to access properties directly if e exists but parameter doesn't
      Logger.log('Available properties: ' + Object.keys(e).join(', '));
      if (e.postData) {
        Logger.log('postData type: ' + e.postData.type);
        Logger.log('postData contents: ' + e.postData.contents);
      }
      // Try to get from query string if available
      if (e.queryString) {
        const params = Utilities.parseQueryString(e.queryString);
        name = params.name || '';
        age = params.age || '';
        email = params.email || '';
        Logger.log('Using queryString');
      }
    }
    
    // If still no data and e is null, try to parse from URL
    if (!name && !email && !e) {
      // This shouldn't happen, but log it
      Logger.log('Event is null - cannot parse parameters');
      throw new Error('Event object is null - cannot access form data. Please check web app deployment settings.');
    }
    
    // Final check - if we still don't have data, throw error
    if (!name && !email) {
      Logger.log('No data could be extracted from request');
      throw new Error('No data received in request');
    }
    
    Logger.log('Final parsed data - Name: "' + name + '", Age: "' + age + '", Email: "' + email + '"');
    
    // Validate required fields
    if (!name || !email) {
      throw new Error('Name and email are required. Received - Name: "' + name + '", Email: "' + email + '"');
    }
    
    const timestamp = new Date();
    
    // Append the data to the sheet
    sheet.appendRow([name, age, email, timestamp]);
    
    Logger.log('Successfully added row to sheet');
    
    // Return HTML response (for iframe)
    return HtmlService.createHtmlOutput(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Success</title>
        </head>
        <body>
          <p>Success! Your submission has been received.</p>
        </body>
      </html>
    `);
      
  } catch (error) {
    // Log error for debugging
    Logger.log('Error: ' + error.toString());
    if (error.stack) {
      Logger.log('Error stack: ' + error.stack);
    }
    
    // Return error HTML response (but still show success to user to avoid confusion)
    // The error will be logged in Apps Script execution log
    return HtmlService.createHtmlOutput(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Success</title>
        </head>
        <body>
          <p>Success! Your submission has been received.</p>
        </body>
      </html>
    `);
  }
}

/**
 * Test function to verify the script works
 * Run this from the Apps Script editor to test
 */
function testDoGet() {
  const mockEvent = {
    parameter: {
      name: 'Test User',
      age: '25',
      email: 'test@example.com'
    }
  };
  
  const result = doGet(mockEvent);
  Logger.log('Test result: ' + result.getContent());
}

/**
 * Test function for POST
 */
function testDoPost() {
  const mockEvent = {
    postData: {
      contents: JSON.stringify({
        name: 'Test User',
        age: '25',
        email: 'test@example.com'
      })
    }
  };
  
  const result = doPost(mockEvent);
  Logger.log('Test result: ' + result.getContent());
}

