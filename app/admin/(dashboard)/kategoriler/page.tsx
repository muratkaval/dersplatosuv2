import { requireAdminToken } from "@/app/admin/lib/auth";
import { adminGet } from "@/app/admin/lib/strapi-admin";
import CategoryManagement from "./category-management";

export const metadata = { title: "Kategoriler ve Branşlar | Admin" };

export default async function KategorilerPage() {
  const token = await requireAdminToken();

  const [campsRes, booksRes, subsRes] = await Promise.all([
    adminGet("/categories?sort[0]=sira:asc&sort[1]=name:asc&pagination[pageSize]=100", token),
    adminGet("/book-categories?sort[0]=sira:asc&sort[1]=name:asc&pagination[pageSize]=100", token),
    adminGet("/subjects?sort[0]=sira:asc&sort[1]=name:asc&pagination[pageSize]=100", token),
  ]);

  return (
    <>
      <div className="admin-topbar">
        <div className="topbar-title">
          <h1><span className="ms">local_offer</span> Kategoriler ve Branşlar</h1>
          <p>Tüm sistemdeki kategorileri ve branşları tek yerden yönetin</p>
        </div>
      </div>

      <div className="admin-content">
        <CategoryManagement 
          initialCamps={campsRes.data?.data || []} 
          initialBooks={booksRes.data?.data || []} 
          initialSubjects={subsRes.data?.data || []} 
        />
      </div>
    </>
  );
}

