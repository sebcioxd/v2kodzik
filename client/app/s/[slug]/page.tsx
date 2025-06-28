import SnippetViewer from "@/components/snippet-viewer";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";

interface Snippet {
    id: string;
    slug: string;
    code: string;
    language: string;
    userId: string;
    ipAddress: string;
    userAgent: string;
    expiresAt: string;
    createdAt: string;
    updatedAt: string;
}
interface Response {
    snippet: Snippet;
}

export default async function ShareSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const fetchShare = async (): Promise<Response | null> => {
    try {
      const cookieStore = await cookies();

      const res = await fetch(
        `${process.env.BETTER_AUTH_URL}/v1/snippet/get/${slug}`
        );

      if (!res.ok) {
        return null;
      }
      const data: Response = await res.json();

      return data;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const share = await fetchShare();

  if (!share) {
    return notFound();
  }

  return (
    <div className="text-zinc-200">
      <SnippetViewer
        code={share.snippet.code}
        language={share.snippet.language}
        slug={share.snippet.slug}
        createdAt={share.snippet.createdAt}
        expiresAt={share.snippet.expiresAt}
      />
    </div>
  );
}
