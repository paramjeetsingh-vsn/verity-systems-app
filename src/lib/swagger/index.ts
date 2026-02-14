import { openApiSpec } from "./openapi"
import { authPaths } from "./auth-paths"
import { securePaths } from "./secure-paths"
import { adminPaths } from "./admin-paths"

export const swaggerSpec = {
    ...openApiSpec,
    paths: {
        ...authPaths,
        ...securePaths,
        ...adminPaths
    }
}
