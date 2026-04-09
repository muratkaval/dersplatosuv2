"use client";

import { useRouter } from "next/navigation";

export default function BookSelector({ 
  books, 
  selectedBook 
}: { 
  books: any[], 
  selectedBook: string 
}) {
  const router = useRouter();

  return (
    <select 
      name="book" 
      defaultValue={selectedBook || ""} 
      onChange={(e) => {
        const value = e.target.value;
        if (value) {
          router.push(`/admin/soru-cozumleri?book=${value}`);
        } else {
          router.push("/admin/soru-cozumleri");
        }
      }}
    >
      <option value="">-- Kitap seçin --</option>
      {books.map((b: any) => (
        <option key={b.documentId} value={b.documentId}>
          {b.title}
        </option>
      ))}
    </select>
  );
}
