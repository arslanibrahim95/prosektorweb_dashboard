export interface User {
    id: string;
    user_id: string;
    email?: string;
    name?: string;
    avatar_url?: string;
    role: string;
    created_at: string;
    invited_at?: string;
    last_sign_in_at?: string;
}

export interface UsersResponse {
    items: User[];
    total: number;
}
