const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000/api';
const OUTPUT_FILE = path.join(__dirname, 'output.html');
let authToken = '';

// HTML template
const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Test Results</title>
    <style>
        /* Screen styles */
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 10px;
            border-bottom: 2px solid #eee;
        }
        .test-case {
            border: 1px solid #ddd;
            margin-bottom: 20px;
            border-radius: 4px;
            overflow: hidden;
            page-break-inside: avoid;
        }
        .test-header {
            padding: 10px 15px;
            background-color: #f8f9fa;
            border-bottom: 1px solid #ddd;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .test-name {
            font-weight: bold;
            color: #333;
        }
        .timestamp {
            color: #666;
            font-size: 0.9em;
        }
        .test-content {
            padding: 15px;
        }
        .url {
            color: #0066cc;
            margin-bottom: 10px;
            word-break: break-all;
        }
        .request, .response {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            margin: 10px 0;
            overflow-x: auto;
        }
        pre {
            margin: 0;
            white-space: pre-wrap;
            font-size: 13px;
            font-family: 'Consolas', 'Monaco', monospace;
        }
        .status {
            padding: 3px 8px;
            border-radius: 3px;
            font-weight: bold;
        }
        .pass {
            background-color: #d4edda;
            color: #155724;
        }
        .fail {
            background-color: #f8d7da;
            color: #721c24;
        }
        .error-details {
            color: #721c24;
            background-color: #f8d7da;
            padding: 10px;
            border-radius: 4px;
            margin-top: 10px;
        }

        /* Print styles */
        @media print {
            body {
                background: white;
                margin: 0;
                padding: 0;
                font-size: 12px;
            }
            .container {
                box-shadow: none;
                padding: 0;
                margin: 0;
            }
            h1 {
                font-size: 24px;
                margin: 20px 0;
            }
            .test-case {
                border: 1px solid #999;
                margin: 10px 0;
                break-inside: avoid;
            }
            .test-header {
                background-color: #eee !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            .request, .response {
                border: 1px solid #ddd;
                background-color: #fff !important;
            }
            pre {
                font-size: 11px;
            }
            .pass {
                background-color: #eee !important;
                border: 1px solid #155724;
                color: #155724 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            .fail {
                background-color: #eee !important;
                border: 1px solid #721c24;
                color: #721c24 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            .error-details {
                border: 1px solid #721c24;
                background-color: #fff !important;
            }
            .url {
                color: #333 !important;
                text-decoration: underline;
            }
            @page {
                margin: 2cm;
                size: A4;
            }
            /* Add page numbers */
            @page {
                @bottom-right {
                    content: counter(page);
                }
            }
            /* Ensure headers are repeated on each page */
            .test-header {
                position: relative;
            }
            /* Improve readability of JSON */
            pre {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>API Test Results</h1>
        <div id="test-results"></div>
    </div>
</body>
</html>
`;

// Initialize HTML file
fs.writeFileSync(OUTPUT_FILE, htmlTemplate);

// Helper function to log results
const logResult = (testName, url, requestData, success, response, error = null) => {
    const timestamp = new Date().toISOString();
    
    const testCase = `
        <div class="test-case">
            <div class="test-header">
                <span class="test-name">${testName} [${url.split('/').pop() === 'register' ? 'POST' : 
                                                      url.split('/').pop() === 'login' ? 'POST' :
                                                      testName.startsWith('Create') ? 'POST' :
                                                      testName.startsWith('Get') ? 'GET' :
                                                      testName.startsWith('Update') ? 'PUT' :
                                                      testName.startsWith('Delete') ? 'DELETE' : 'N/A'}]</span>
                <span class="status ${success ? 'pass' : 'fail'}">${success ? 'PASS' : 'FAIL'}</span>
                <span class="timestamp">${timestamp}</span>
            </div>
            <div class="test-content">
                <div class="url">
                    <strong>URL:</strong> ${url}
                </div>
                <div class="request">
                    <strong>Request:</strong>
                    <pre>${JSON.stringify(requestData, null, 2)}</pre>
                </div>
                ${success 
                    ? `<div class="response">
                         <strong>Response:</strong>
                         <pre>${JSON.stringify(response, null, 2)}</pre>
                       </div>`
                    : `<div class="error-details">
                         <strong>Error:</strong>
                         <pre>${error.response 
                             ? `Status Code: ${error.response.status}\n${JSON.stringify(error.response.data, null, 2)}`
                             : error.message}</pre>
                       </div>`
                }
            </div>
        </div>
    `;

    // Read current file content
    const content = fs.readFileSync(OUTPUT_FILE, 'utf8');
    // Insert new test case before the closing div and body/html tags
    const updatedContent = content.replace('</div>\n</body>', `${testCase}</div>\n</body>`);
    fs.writeFileSync(OUTPUT_FILE, updatedContent);
    
    // Also log to console for immediate feedback
    console.log(`[${timestamp}] ${testName}: ${success ? 'PASS' : 'FAIL'}`);
};

const runTests = async () => {
    try {
        // Test 1: Register User
        const registerUrl = `${BASE_URL}/auth/register`;
        const registerData = {
            username: "testuser_" + Date.now(),
            email: `test${Date.now()}@example.com`,
            password: "password123"
        };
        try {
            const registerResponse = await axios.post(registerUrl, registerData);
            logResult('Register User', registerUrl, registerData, true, registerResponse.data);
        } catch (error) {
            logResult('Register User', registerUrl, registerData, false, null, error);
        }

        // Test 2: Login User
        const loginUrl = `${BASE_URL}/auth/login`;
        const loginData = {
            email: registerData.email,
            password: registerData.password
        };
        try {
            const loginResponse = await axios.post(loginUrl, loginData);
            authToken = loginResponse.data.token;
            logResult('Login User', loginUrl, loginData, true, loginResponse.data);
        } catch (error) {
            logResult('Login User', loginUrl, loginData, false, null, error);
        }

        // Test 3: Create Strategy
        let createdStrategyId;
        const createStrategyUrl = `${BASE_URL}/strategies`;
        const strategyData = {
            name: "Test Strategy",
            description: "A test trading strategy",
            rules: ["Buy when price crosses above MA", "Sell when price crosses below MA"],
            timeframe: "1h",
            market: "BTCUSDT"
        };
        try {
            const createStrategyResponse = await axios.post(
                createStrategyUrl,
                strategyData,
                {
                    headers: { Authorization: `Bearer ${authToken}` }
                }
            );
            createdStrategyId = createStrategyResponse.data._id;
            logResult('Create Strategy', createStrategyUrl, 
                     { ...strategyData, headers: { Authorization: 'Bearer [TOKEN]' } },
                     true, createStrategyResponse.data);
        } catch (error) {
            logResult('Create Strategy', createStrategyUrl,
                     { ...strategyData, headers: { Authorization: 'Bearer [TOKEN]' } },
                     false, null, error);
        }

        // Test 4: Get All Strategies
        const getAllUrl = `${BASE_URL}/strategies`;
        try {
            const getAllResponse = await axios.get(
                getAllUrl,
                {
                    headers: { Authorization: `Bearer ${authToken}` }
                }
            );
            logResult('Get All Strategies', getAllUrl,
                     { headers: { Authorization: 'Bearer [TOKEN]' } },
                     true, getAllResponse.data);
        } catch (error) {
            logResult('Get All Strategies', getAllUrl,
                     { headers: { Authorization: 'Bearer [TOKEN]' } },
                     false, null, error);
        }

        // Test 5: Get Strategy by ID
        if (createdStrategyId) {
            const getOneUrl = `${BASE_URL}/strategies/${createdStrategyId}`;
            try {
                const getOneResponse = await axios.get(
                    getOneUrl,
                    {
                        headers: { Authorization: `Bearer ${authToken}` }
                    }
                );
                logResult('Get Strategy by ID', getOneUrl,
                         { headers: { Authorization: 'Bearer [TOKEN]' } },
                         true, getOneResponse.data);
            } catch (error) {
                logResult('Get Strategy by ID', getOneUrl,
                         { headers: { Authorization: 'Bearer [TOKEN]' } },
                         false, null, error);
            }
        }

        // Test 6: Update Strategy
        if (createdStrategyId) {
            const updateUrl = `${BASE_URL}/strategies/${createdStrategyId}`;
            const updateData = {
                name: "Updated Strategy Name",
                description: "Updated strategy description",
                rules: ["Updated rule 1", "Updated rule 2"],
                timeframe: "4h",
                market: "ETHUSDT"
            };
            try {
                const updateResponse = await axios.put(
                    updateUrl,
                    updateData,
                    {
                        headers: { Authorization: `Bearer ${authToken}` }
                    }
                );
                logResult('Update Strategy', updateUrl,
                         { ...updateData, headers: { Authorization: 'Bearer [TOKEN]' } },
                         true, updateResponse.data);
            } catch (error) {
                logResult('Update Strategy', updateUrl,
                         { ...updateData, headers: { Authorization: 'Bearer [TOKEN]' } },
                         false, null, error);
            }
        }

        // Test 7: Delete Strategy
        if (createdStrategyId) {
            const deleteUrl = `${BASE_URL}/strategies/${createdStrategyId}`;
            try {
                const deleteResponse = await axios.delete(
                    deleteUrl,
                    {
                        headers: { Authorization: `Bearer ${authToken}` }
                    }
                );
                logResult('Delete Strategy', deleteUrl,
                         { headers: { Authorization: 'Bearer [TOKEN]' } },
                         true, deleteResponse.data);
            } catch (error) {
                logResult('Delete Strategy', deleteUrl,
                         { headers: { Authorization: 'Bearer [TOKEN]' } },
                         false, null, error);
            }
        }

    } catch (error) {
        logResult('Test Suite', 'N/A', {}, false, null, { message: `Fatal error: ${error.message}` });
    }
};

// Run the tests
console.log('Starting API tests...');
runTests().then(() => {
    console.log('\nTests completed. Check output.html file for results.');
}); 