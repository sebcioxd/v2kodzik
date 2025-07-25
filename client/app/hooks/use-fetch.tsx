import { useQuery } from "@tanstack/react-query";

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

interface InfoResponse {
    remoteAdress: string;
    remoteAdress_v6: string;
    userAgent: string;
    referer: string;
    bunVersion: string;
    port: number;
    transport: string;
    host: string;
}

export const useFetch = () => {
    const { 
        data: info, 
        isLoading: isInfoLoading, 
        isError: isInfoError 
    } = useQuery<InfoResponse>({
        queryKey: ["info"],
        queryFn: async () => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/info`);
            return response.json();
        },
    });

    const { 
        data: update, 
        isLoading: isUpdateLoading, 
        isError: isUpdateError 
    } = useQuery({
        queryKey: ["update", info?.remoteAdress, info?.userAgent],
        enabled: !!info?.remoteAdress && !!info?.userAgent,
        queryFn: async () => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/update`, {
                method: 'POST',
                credentials: 'include',
                body: JSON.stringify({
                    remoteAdress: info?.remoteAdress,
                    userAgent: info?.userAgent,
                }),
            });
            return response.json();
        },
    });

    const { 
        data: oauth, 
        isLoading: isOauthLoading, 
        isError: isOauthError 
    } = useQuery({
        queryKey: ["oauth"],
        enabled: !!update,
        queryFn: async () => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/oauth/set`, {
                method: 'POST',
                credentials: 'include',
            });
            return response.json();
        },
    });

    const { 
        data: status, 
        isLoading: isStatusLoading, 
        isError: isStatusError 
    } = useQuery<Status>({
        queryKey: ["status"],
        queryFn: async () => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/status`);
            return response.json();
        },
    });

    const { 
        data: lastPosts, 
        isLoading: isLastPostsLoading, 
        isError: isLastPostsError 
    } = useQuery<LastPostsResponse>({
        queryKey: ["last-posts"],
        queryFn: async () => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/last-posts`);
            return response.json();
        },
        retry: 3,
        retryDelay: 2000,
    });

    return {
        status,
        isStatusLoading,
        isStatusError,
        lastPosts,
        isLastPostsLoading,
        isLastPostsError,
        info,
        isInfoLoading,
        isInfoError,
        update,
        isUpdateLoading,
        isUpdateError,
        oauth,
        isOauthLoading,
        isOauthError,
    };
};


