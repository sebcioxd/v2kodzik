interface File {
  id: string;
  name: string;
  size: number;
  shareId: string;
}

interface Share {
  id: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  storagePath: string;
  files: File[];
  totalSize: number;
}

import Files from "@/components/files";
import { notFound } from "next/navigation";
export default async function ShareSlugPage({ params }: { params: Promise<{ slug: string }>}) {

  const { slug } = await params;

  const fetchShare = async () => {
    try {
      const res = await fetch(`https://api.dajkodzik.pl/v1/share/${slug}`);
      if (!res.ok) {
        return null;
      }
      const data = await res.json();
      
      // For private shares, we'll render the page but with minimal info
      // The Files component will handle authentication and fetching full details
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
        files={share.files || []} // May be undefined for private shares
        totalSize={share.totalSize || 0} // May be undefined for private shares
        createdAt={share.createdAt}
        storagePath={share.storagePath || ""} // May be undefined for private shares
        slug={slug}
      />
    </div>
  );
}
