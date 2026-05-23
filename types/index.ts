export interface Message {
    id?: string;
    role: "user" | "assistant";
    content: string;
    createdAt?: Date;
}

export interface ChatSession {
    id: string;
    videoId: string;
    videoTitle?: string;
    videoAuthor?: string;
    createdAt: string;
    messages?: Message[];
}

export interface User {
    id: string;
    email: string;
    name?: string;
}

export interface AuthState {
    user: User | null;
    token: string | null;
    isLoading: boolean;
}

