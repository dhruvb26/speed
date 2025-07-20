import { Hono } from "hono";
import { authenticateUserForToolkit } from "../utils/composio_tools";
import type { Result } from "@/types/api-response";
import { drizzle } from "drizzle-orm/postgres-js";
import { createDb } from "@/db";
import { integrationsTable, usersTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { tools_auth_response } from "@/types/tools";
import { Composio } from '@composio/core';
import { LangchainProvider } from '@composio/langchain';

const tools = new Hono();

tools.get("/toolkit", async (c) => {
    
    try{
        const { entityId, toolkit } = c.req.query();
        if (!entityId || !toolkit) {
            return c.json<Result<never, string>>(
                {
                    error: "entityId and toolkit are required",
                    data: null,
                },
                400
            );
        }
        const redirectUrl = await authenticateUserForToolkit(entityId, toolkit);
        const db = createDb();
        const user = await db.select().from(usersTable).where(eq(usersTable.id, entityId));
        if (!user) {
            return c.json<Result<never, string>>(
                {
                    error: "User not found",
                    data: null,
                },
                404
            );
        }
        //update the toolkit in the integration table for the user
        // await db.update(composio_integrations).set({ toolkit: toolkit }).where(eq(integrationsTable.id, user.id));
        return c.json<Result<tools_auth_response, string>>(
            {
                error: null,
                data: { redirectUrl: redirectUrl as string },
            },
            200
        );
    } catch (error) {
        return c.json<Result<never, string>>(
            {
                error: "Internal server error",
                data: null,
            },
            500
        );
    }
});

// tools.get("/tools", async (c) => {
//     const { entityId } = c.req.query();
//     const { toolkit } = c.req.query();
//     const db = createDb();
//     const allToolkits = await db.select().from(integrationsTable).where(eq(integrationsTable.userId, entityId));
//     if (toolkit in allToolkits.map(toolkit => toolkit.provider)){
//         return c.json<Result<tools_auth_response, string>>(
//             {
//                 error: "Toolkit not found",
//                 data: null,
//             },
//             404
//         );
//     }
//     const composio = new Composio({
//         apiKey: process.env.COMPOSIO_API_KEY,
//         provider: new LangchainProvider(),
//       });

//       const tools = await composio.tools.get(entityId, toolkit);


//     return c.json<Result<tools_auth_response, string>>(
//         {
//             error: null,
//             data: tools
//         },
//         200
//     );
// });

export default tools;   