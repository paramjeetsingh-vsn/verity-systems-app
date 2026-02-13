import { NextResponse } from "next/server"
import { requirePermission } from "@/lib/auth/permission-guard"
import { PermissionId } from "@/lib/auth/permission-codes"

export async function GET(req: Request) {
    try {
        const user = await requirePermission(req, PermissionId.ADMIN_ACCESS)

        return NextResponse.json({
            message: "Welcome Admin",
            user
        })
    } catch (err: any) {
        return NextResponse.json(
            { message: err.message },
            { status: err.status ?? 401 }
        )
    }
}
