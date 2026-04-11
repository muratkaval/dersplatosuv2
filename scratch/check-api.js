async function checkNavApi() {
  try {
    const res = await fetch("http://localhost:3000/api/nav");
    const data = await res.json();
    console.log("Current API Nav Data:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error fetching nav api:", err);
  }
}

checkNavApi();
