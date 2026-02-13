import { NextResponse } from "next/server"
import { requirePermission } from "@/lib/auth/permission-guard"
import { PermissionId } from "@/lib/auth/permission-codes"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
    try {
        await requirePermission(req, PermissionId.PERMISSION_VIEW)

        const permissions = await prisma.permission.findMany({
            orderBy: { code: "asc" }
        })

        return NextResponse.json(permissions)
    } catch (error) {
        if (error instanceof Response) return error
        return NextResponse.json(
            { message: error instanceof Error ? error.message : "Internal Server Error" },
            { status: 500 }
        )
    }
}
