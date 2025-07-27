import { OpenAIToolSet } from 'composio-core';
import { createDb } from '@/db';
import { composioIntegrations } from '@/db/schema';
import "dotenv/config";
import { v4 as uuidv4 } from 'uuid';
import { Composio } from '@composio/core';
import fs from "fs";

const composio = new Composio({
    apiKey: process.env.COMPOSIO_API_KEY,
  });

const db = createDb();

const toolkit_map = {
    GMAIL: 'ac_-GPNm4XGBzIA',
    GOOGLEDRIVE: 'ac_c7mHxAvwsQkt',

}

// Updated example usage with specific integration
export async function authenticateUserForToolkit(entityId: string, toolkit: string,threadId?: string) {
  // Initiate the OAuth connection request
  const connRequest = await composio.connectedAccounts.initiate(entityId, toolkit_map[toolkit as keyof typeof toolkit_map],{
    callbackUrl: `http://localhost:3000/chat/${threadId}`,
  });
  console.log(connRequest)

  // Destructure redirectUrl for easier access
  const { redirectUrl, id } = connRequest;
  console.log("Generated redirect URL:", redirectUrl);


  
  return redirectUrl;
}


// for (const toolkit in toolkit_map) {
//   authenticateUserForToolkit("user_308BwV2pzGvbyVgD28IXAw8GTdp", toolkit);
  
// }

// // Instead of requesting all at once:
// const tools = await composio.tools.get("user_308BwV2pzGvbyVgD28IXAw8GTdp", {
//     toolkits: Object.keys(toolkit_map),
// });

// // Try this sequential approach:
// const allTools = [];

// for (const toolkit of Object.keys(toolkit_map)) {
//   try {
//     console.log(`Fetching tools for ${toolkit}...`);
//     const tools = await composio.tools.get("user_308BwV2pzGvbyVgD28IXAw8GTdp", {
//       toolkits: [toolkit],
//     });
//     allTools.push(...tools);
//     console.log(`Successfully fetched ${tools.length} tools for ${toolkit}`);
//   } catch (error) {
//     console.error(`Failed to fetch tools for ${toolkit}:`, error);
//   }
// }

// // write to a file
// fs.writeFileSync("tools.json", JSON.stringify(allTools, null, 2));

