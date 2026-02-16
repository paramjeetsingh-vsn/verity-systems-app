import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permission-guard";
import { handleApiError } from "@/lib/dms/api-error-handler";
import { AuditService } from "@/services/dms/audit-service";
import * as z from "zod";

const cleanupSchema = z.object({
    retentionMonths: z.number().int().min(1).optional().default(24)
});

/**
 * POST /api/secure/system/audit/cleanup
 * 
 * Manually safeguards audit log retention.
 * Deletes logs older than the specified months.
 * Requires ADMIN_ACCESS.
 */
export async function POST(req: Request) {
    try {
        // 1. Authenticate & Authorize (Admin Only)
        // Ensure only administrators can trigger data destruction
        const user = await requirePermission(req, "ADMIN_ACCESS");

        // 2. Parse Body
        const body = await req.json().catch(() => ({}));
        const validation = cleanupSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: "Invalid parameters", details: validation.error.format() },
                { status: 400 }
            );
        }

        const { retentionMonths } = validation.data;

        // 3. Perform Cleanup
        const result = await AuditService.cleanupOldLogs({
            tenantId: user.tenantId,
            retentionMonths
        });

        return NextResponse.json(result);
    } catch (error: any) {
        return handleApiError(error);
    }
}
