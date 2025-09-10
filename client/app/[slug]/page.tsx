
interface File {
  id: string;
  fileName: string;
  size: number;
  shareId: string;
  storagePath: string;
  lastModified: number;
  contentType: string;
}

interface Share {
  id: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  storagePath: string;
  expiresAt: string;
  files: File[];
  totalSize: number;
  private: boolean;
  autoVerified?: boolean;
  verifiedByCookie?: boolean;
  autoVerifiedPrivateStatus?: boolean;
  views: number;
}

import Files from "@/components/files";
import { notFound } from "next/navigation";
import { cookies } from 'next/headers'


export default async function ShareSlugPage({ params }: { params: Promise<{ slug: string }>}) {

  const { slug } = await params;

  const fetchShare = async (): Promise<Share | null> => {
    try {
      const cookieHeader = (await cookies()).toString();
      
      const res = await fetch(`${process.env.BETTER_AUTH_URL}/v1/share/${slug}`, {
        credentials: "include",
        headers: {
          Cookie: cookieHeader,
        },
      });
      
      if (!res.ok) {
        return null;
      }
      const data: Share = await res.json();

      if (data.private) {
        const cookieRes = await fetch(`${process.env.BETTER_AUTH_URL}/v1/share/verify-cookie/${slug}`, {
          credentials: 'include',
          headers: {
            Cookie: cookieHeader, 
          },
        });
        const cookieData = await cookieRes.json();
        
        if (cookieData.success) {
          return {
            ...data,
            files: cookieData.files,
            totalSize: cookieData.totalSize,
            storagePath: cookieData.storagePath,
            private: false,
            verifiedByCookie: true,
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
        autoVerified={share.autoVerified}
        verifiedByCookie={share.verifiedByCookie}
        autoVerifiedPrivateStatus={share.autoVerifiedPrivateStatus}
        views={share.views}
      />
    </div>
  );
}
