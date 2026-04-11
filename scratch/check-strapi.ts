import { adminGet } from "../app/admin/lib/strapi-admin";

async function checkStrapiSchema() {
  try {
    const res = await adminGet("/global-setting", "");
    if (res.ok) {
      const keys = Object.keys(res.data?.data?.attributes || res.data?.data || res.data || {});
      console.log("Existing Strapi Keys in global-setting:", keys);
      console.log("Full data sample:", JSON.stringify(res.data, null, 2));
    } else {
      console.error("Failed to fetch global-setting:", res.status, res.data);
    }
  } catch (err) {
    console.error("Error checking schema:", err);
  }
}

checkStrapiSchema();
