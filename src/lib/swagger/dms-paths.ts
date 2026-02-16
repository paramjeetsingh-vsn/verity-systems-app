
export const dmsPaths = {
    "/api/secure/dms/documents/{id}/workflow": {
        post: {
            tags: ["DMS"],
            summary: "Execute document workflow action",
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: "id",
                    in: "path",
                    required: true,
                    schema: { type: "string" }
                }
            ],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["action"],
                            properties: {
                                action: {
                                    type: "string",
                                    enum: ["submit", "approve", "reject", "archive"],
                                    example: "submit"
                                },
                                comment: {
                                    type: "string",
                                    example: "Final review completed"
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                200: { description: "Workflow action successful" },
                400: { description: "Invalid action or request" },
                403: { description: "Forbidden" },
                404: { description: "Document not found" }
            }
        }
    }
}
