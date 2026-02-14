
export const adminPaths = {
    "/api/admin/users": {
        get: {
            tags: ["Admin"],
            summary: "List all users",
            security: [{ bearerAuth: [] }],
            parameters: [
                { name: "page", in: "query", schema: { type: "integer", default: 1 } },
                { name: "limit", in: "query", schema: { type: "integer", default: 50 } }
            ],
            responses: {
                200: { description: "List of users" },
                403: { description: "Forbidden" }
            }
        },
        post: {
            tags: ["Admin"],
            summary: "Invite a new user",
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["email", "fullName", "roleIds"],
                            properties: {
                                email: { type: "string" },
                                fullName: { type: "string" },
                                roleIds: { type: "array", items: { type: "integer" } }
                            }
                        }
                    }
                }
            },
            responses: {
                201: { description: "User invited" },
                403: { description: "Forbidden" }
            }
        }
    },
    "/api/admin/roles": {
        get: {
            tags: ["Admin"],
            summary: "List all roles",
            security: [{ bearerAuth: [] }],
            responses: {
                200: { description: "List of roles" },
                403: { description: "Forbidden" }
            }
        }
    },
    "/api/admin/audit-events": {
        get: {
            tags: ["Admin"],
            summary: "List audit events",
            security: [{ bearerAuth: [] }],
            parameters: [
                { name: "page", in: "query", schema: { type: "integer", default: 1 } },
                { name: "limit", in: "query", schema: { type: "integer", default: 50 } }
            ],
            responses: {
                200: { description: "List of audit events" },
                403: { description: "Forbidden" }
            }
        }
    }
}
