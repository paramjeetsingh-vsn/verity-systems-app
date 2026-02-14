export const authPaths = {
    "/api/auth/login": {
        post: {
            tags: ["Auth"],
            summary: "Login",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["email", "password"],
                            properties: {
                                email: { type: "string", example: "admin@dms.com" },
                                password: { type: "string", example: "Admin@123" }
                            }
                        }
                    }
                }
            },
            responses: {
                200: {
                    description: "Login successful"
                },
                401: {
                    description: "Invalid credentials"
                }
            }
        }
    },
    "/api/auth/logout": {
        post: {
            tags: ["Auth"],
            summary: "Logout",
            security: [{ bearerAuth: [] }],
            responses: {
                200: { description: "Logout successful" }
            }
        }
    },
    "/api/auth/refresh": {
        post: {
            tags: ["Auth"],
            summary: "Refresh Access Token",
            responses: {
                200: { description: "Token refreshed" },
                401: { description: "Invalid refresh token" }
            }
        }
    }
}
