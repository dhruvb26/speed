import { OpenAIToolSet } from 'composio-core';
import { Composio } from '@composio/core';



const toolkit_map = {
    GMAIL: '1f329907-6d80-40a0-8a16-21578e1575a6',
    SLACK: '1956dfeb-967d-4f23-81c8-10690baec081',
    NOTION: 'b774e378-16b9-49e5-92b9-0f552bbf9984',
    GOOGLE_CALENDAR: '162d43dd-d7c9-4c26-b9ae-076c688223e8',
    GOOGLE_MEET: '45b8b46a-e957-4538-9eac-f1521ad1be57',
    GOOGLE_DOCS: '6c2eb464-8a39-485c-9cc5-8a158d40a1f1',
    GOOGLE_DRIVE: '5bbc34ca-04b3-447d-9f14-3fdc80666c7e',
    LINEAR: 'e90cfe62-edd2-4496-bce5-8e1fdfc20104'


}

// Updated example usage with specific integration
export async function authenticateUserForToolkit(entityId: string, toolkit: string) {
  const toolset = new OpenAIToolSet({ apiKey: 'tjwldcin2vcn9bt1coa7y' });

  const integration = await toolset.integrations.get({integrationId: toolkit_map[toolkit as keyof typeof toolkit_map] });
  const expectedInputFields = await toolset.integrations.getRequiredParams({
    integrationId: integration.id as string
  });
  // Collect auth params from your users
  console.log(expectedInputFields);
  const connectedAccount = await toolset.connectedAccounts.initiate({
      integrationId: integration.id as string,
      entityId: entityId,
      redirectUri: 'https://www.youtube.com',
  });

  console.log(connectedAccount.redirectUrl);
  return connectedAccount.redirectUrl;
}
