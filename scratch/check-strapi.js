// Diagnostic script to check Strapi schema
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function checkStrapi() {
  const rawBase = "http://localhost:1340";
  const strapiOrigin = rawBase.replace(/\/api\/?$/, "");
  const token = process.env.STRAPI_TOKEN; // Assuming it's in the env

  if (!token) {
    console.error("STRAPI_TOKEN not found in env");
    return;
  }

  try {
    const res = await fetch(`${strapiOrigin}/api/global-setting?populate=*`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) {
      console.log("Current Strapi Fields:", Object.keys(data.data?.attributes || data.data || {}));
      console.log("Data Sample:", JSON.stringify(data, null, 2));
    } else {
      console.error("Strapi Error:", data);
    }
  } catch (err) {
    console.error("Connect error:", err.message);
  }
}

checkStrapi();
