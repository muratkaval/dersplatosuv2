const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

const STRAPI_URL = process.env.STRAPI_URL || "http://localhost:1340";
const STRAPI_TOKEN = process.env.STRAPI_TOKEN;

async function test() {
  console.log("Testing Strapi connection...");
  console.log("URL:", STRAPI_URL);
  
  const headers = {
    'Authorization': `Bearer ${STRAPI_TOKEN}`,
    'Content-Type': 'application/json'
  };

  const endpoints = ['/api/subjects', '/api/categories', '/api/book-categories'];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(`${STRAPI_URL}${endpoint}`, { headers });
      const data = await res.json();
      console.log(`\nEndpoint: ${endpoint}`);
      console.log(`Status: ${res.status}`);
      if (data.data) {
        console.log(`Count: ${data.data.length}`);
        if (data.data.length > 0) {
          console.log(`Sample Name: ${data.data[0].attributes?.name || data.data[0].name}`);
        }
      } else {
        console.log("No data field in response:", JSON.stringify(data).substring(0, 100));
      }
    } catch (err) {
      console.error(`Error fetching ${endpoint}:`, err.message);
    }
  }
}

test();
