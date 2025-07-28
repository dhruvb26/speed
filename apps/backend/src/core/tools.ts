import { Composio } from "@composio/core";
import { LangchainProvider } from "@composio/langchain";
import { ConnectedAccountListResponse } from "@composio/core";
import "dotenv/config";

const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY,
  provider: new LangchainProvider(),
});

// this will have all the active toolkits and their authConfigId
const toolConfigMap: Record<string, { authConfigId: string; slug: string }> = {
  gmail: {
    authConfigId: process.env.GMAIL_AUTH_CONFIG_ID!,
    slug: "gmail",
  },
};

export function getAllToolkits() {
  return Object.keys(toolConfigMap).map((key) => toolConfigMap[key].slug);
}

export async function initiateComposioConnection(
  userId: string,
  slug: string
): Promise<string> {
  try {
    const connRequest = await composio.connectedAccounts.initiate(
      userId,
      toolConfigMap[slug].authConfigId
    );

    if (!connRequest.redirectUrl) {
      throw new Error("No redirect URL received from Composio");
    }

    return connRequest.redirectUrl;
  } catch (error) {
    console.error("Error initiating Composio connection:", error);

    throw error;
  }
}

export async function getTools(userId: string, toolkits: string[]) {
  try {
    const tools = await composio.tools.get(userId, {
      toolkits,
    });
    return tools;
  } catch (error) {
    return [];
  }
}

export async function checkConnectionStatus(
  userId: string,
  slug: string
): Promise<boolean> {
  try {
    const connections: ConnectedAccountListResponse =
      await composio.connectedAccounts.list({
        userIds: [userId],
      });

    if (!connections.items || connections.items.length === 0) {
      return false;
    }

    const connectionItem = connections.items.find((conn) => {
      return (
        conn.authConfig?.id === toolConfigMap[slug].authConfigId &&
        conn.status === "ACTIVE" &&
        conn.toolkit?.slug === slug
      );
    });

    return !!connectionItem;
  } catch (error) {
    return false;
  }
}
