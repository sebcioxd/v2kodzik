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
        files={share.files} 
        totalSize={share.totalSize} 
        createdAt={share.createdAt}
        storagePath={share.storagePath} 
      />
    </div>
  );
}
