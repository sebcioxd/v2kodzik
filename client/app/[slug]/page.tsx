interface File {
  id: string;
  fileName: string;
  size: number;
  shareId: string;
  storagePath: string;
}

interface Share { // or api response
  id: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  storagePath: string;
  expiresAt: string;
  files: File[];
  totalSize: number;
  private: boolean;
}


import Files from "@/components/files";
import { notFound } from "next/navigation";
import { cookies } from 'next/headers'

export default async function ShareSlugPage({ params }: { params: Promise<{ slug: string }>}) {

  const { slug } = await params;

  const fetchShare = async (): Promise<Share | null> => {
    try {
      // Get the cookies from the incoming request
      const cookieStore = await cookies()
      
      const res = await fetch(`${process.env.BETTER_AUTH_URL}/v1/share/${slug}`);
      
      if (!res.ok) {
        return null;
      }
      const data: Share = await res.json();

      if (data.private) {
        const cookieRes = await fetch(`${process.env.BETTER_AUTH_URL}/v1/share/verify-cookie/${slug}`, {
          credentials: 'include',
          headers: {
            Cookie: cookieStore.toString(), // Forward the cookies
          },
        });
        const cookieData = await cookieRes.json();
        
        if (cookieData.success) {
          // Return the full data from cookie verification instead of the minimal data
          return {
            ...data,
            files: cookieData.files,
            totalSize: cookieData.totalSize,
            storagePath: cookieData.storagePath,
            private: false,
          };
        }
        
        return data;
      }
    
      return data;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  const share = await fetchShare();

  if (!share) {
    return notFound();
  }
  
  
  return (
    <div className="text-zinc-200">
      <Files 
        files={share.files || []}
        totalSize={share.totalSize || 0}
        createdAt={share.createdAt}
        storagePath={share.storagePath || ""}
        slug={slug}
        fileId={share.id}
        expiresAt={share.expiresAt}
        private={share.private}
        
      />
    </div>
  );
}
