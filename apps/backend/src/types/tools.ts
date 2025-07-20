interface tools_auth {
    entityId: string;
    toolkit: string;
}

interface tools_auth_response {
    redirectUrl: string;
}

export type { tools_auth, tools_auth_response };