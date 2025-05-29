import { useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";

export interface LastPosts {
    id: string;
    slug: string;
    createdAt: string;
    expiresAt: string;
    private: boolean;
}

export interface LastPostsResponse {
    posts: LastPosts[];
    count: number;
}

export interface Status {
    message: string;
    status: number;
}

export const useFetch = () => {
    const queryClient = useQueryClient();

    const { data: status, isLoading: isStatusLoading, isError: isStatusError } = useQuery<Status>({
        queryKey: ["status"],
        queryFn: async () => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/status`);
            return response.json();
        },
        
    });

    const { data: lastPosts, isLoading: isLastPostsLoading } = useQuery<LastPostsResponse>({
        queryKey: ["last-posts"],
        queryFn: async () => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/last-posts`);
            return response.json();
        },
    });

    return { status, isStatusLoading, isStatusError, lastPosts, isLastPostsLoading };
}


