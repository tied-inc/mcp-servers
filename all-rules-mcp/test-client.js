#!/usr/bin/env node

/**
 * Simple test client for MCP Server
 * Tests the list_ai_rules and search_ai_rules tools
 */

import http from 'http';

const SERVER_URL = 'http://localhost:3001';
const MCP_ENDPOINT = '/mcp';

// Helper function to make HTTP requests
function makeRequest(method, path, data) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve(response);
        } catch (e) {
          resolve({ statusCode: res.statusCode, body });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Test the MCP server
async function testMCPServer() {
  console.log('🧪 Testing MCP Server...\n');

  try {
    // Test 1: List all AI rules
    console.log('📋 Test 1: List all AI rules');
    const listRequest = {
      method: 'tools/call',
      params: {
        name: 'list_ai_rules',
        arguments: {}
      }
    };

    const listResponse = await makeRequest('POST', MCP_ENDPOINT, listRequest);
    console.log('✅ List rules response:', JSON.stringify(listResponse, null, 2));
    console.log('');

    // Test 2: Search AI rules
    console.log('🔍 Test 2: Search AI rules');
    const searchRequest = {
      method: 'tools/call',
      params: {
        name: 'search_ai_rules',
        arguments: {
          query: 'React components',
          limit: 3
        }
      }
    };

    const searchResponse = await makeRequest('POST', MCP_ENDPOINT, searchRequest);
    console.log('✅ Search rules response:', JSON.stringify(searchResponse, null, 2));
    console.log('');

    // Test 3: Search with filters
    console.log('🎯 Test 3: Search with filters');
    const filterSearchRequest = {
      method: 'tools/call',
      params: {
        name: 'search_ai_rules',
        arguments: {
          query: 'code',
          limit: 2,
          filters: {
            language: 'javascript'
          }
        }
      }
    };

    const filterSearchResponse = await makeRequest('POST', MCP_ENDPOINT, filterSearchRequest);
    console.log('✅ Filtered search response:', JSON.stringify(filterSearchResponse, null, 2));

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await makeRequest('GET', '/');
    console.log('🟢 Server is running');
    return true;
  } catch (error) {
    console.log('🔴 Server is not running. Please start it with: npm run dev');
    return false;
  }
}

// Main execution
async function main() {
  console.log('🚀 MCP Server Test Client\n');
  
  const serverRunning = await checkServer();
  if (serverRunning) {
    await testMCPServer();
  }
}

main().catch(console.error);