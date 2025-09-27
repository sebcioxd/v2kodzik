import { useQuery } from "@tanstack/react-query";

export interface LastPosts {
    id: string;
    slug: string;
    createdAt: string;
    expiresAt: string;
    private: boolean;
    views: number;
    type?: "post" | "snippet";
    language?: string;
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

// Split into individual hooks
export const useInfo = () => {
    return useQuery<InfoResponse>({
        queryKey: ["info"],
        queryFn: async () => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/info`);
            return response.json();
        },
    });
};

export const useUpdate = (remoteAddress?: string, userAgent?: string) => {
    return useQuery({
        queryKey: ["update", remoteAddress, userAgent],
        enabled: !!remoteAddress && !!userAgent,
        queryFn: async () => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/update`, {
                method: 'POST',
                credentials: 'include',
                body: JSON.stringify({
                    remoteAdress: remoteAddress,
                    userAgent: userAgent,
                }),
            });
            return response.json();
        },
    });
};

export const useOauth = (updateEnabled: boolean) => {
    return useQuery({
        queryKey: ["oauth"],
        enabled: updateEnabled,
        queryFn: async () => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/oauth/set`, {
                method: 'POST',
                credentials: 'include',
            });
            return response.json();
        },
    });
};

export const useStatus = () => {
    return useQuery<Status>({
        queryKey: ["status"],
        queryFn: async () => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/status`);
            return response.json();
        },
    });
};

export const useLastPosts = () => {
    return useQuery<LastPostsResponse>({
        queryKey: ["last-posts"],
        queryFn: async () => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/last-posts`);
            return response.json();
        },
        retry: 3,
        retryDelay: 2000,
    });
};


