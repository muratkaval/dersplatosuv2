import { getCamps } from "@/app/lib/strapi";

export default async function DebugCampsPage() {
  const camps = await getCamps();
  
  return (
    <div style={{ background: "white", color: "black", padding: "40px", fontFamily: "monospace" }}>
      <h1>Debug Camps API Response</h1>
      <pre>{JSON.stringify(camps[0]?.instructors?.[0], null, 2)}</pre>
      <hr />
      <h2>Title: {camps[0]?.title}</h2>
    </div>
  );
}
