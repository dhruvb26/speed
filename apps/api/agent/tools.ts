/**
 * Main tools file that exports Gmail and Slack tool instances
 * and integrates them with LangChain tools
 */

import { GmailTools } from './gmail-tools.js';
import { DynamicTool } from '@langchain/core/tools';

// Initialize tool instances
const gmailTools = new GmailTools();

// Create LangChain tools from our Gmail and Slack tools
export const listEmailsTool = new DynamicTool({
  name: 'list_emails',
  description: 'List recent emails from Gmail. Parameters: maxResults (number, default 10), query (string, optional)',
  func: async (input: string) => {
    try {
      let params: any = {};
      
      // Handle undefined, empty, or invalid JSON input
      if (input && input.trim() !== '') {
        try {
          params = JSON.parse(input);
        } catch (parseError) {
          // If JSON parsing fails, treat as empty params
          params = {};
        }
      }
      
      const maxResults = params.maxResults || 10;
      const query = params.query;
      
      const emails = await gmailTools.listEmails(maxResults, query);
      return JSON.stringify(emails, null, 2);
    } catch (error) {
      return `Error listing emails: ${error}`;
    }
  },
});

export const getEmailDetailsTool = new DynamicTool({
  name: 'get_email_details',
  description: 'Get detailed information about a specific email. Parameters: messageId (string)',
  func: async (input: string) => {
    try {
      let params: any = {};
      
      // Handle undefined, empty, or invalid JSON input
      if (input && input.trim() !== '') {
        try {
          params = JSON.parse(input);
        } catch (parseError) {
          return `Error: Invalid JSON input provided`;
        }
      }
      
      const messageId = params.messageId;
      
      if (!messageId) {
        throw new Error('messageId is required');
      }
      
      const email = await gmailTools.getEmailDetails(messageId);
      return JSON.stringify(email, null, 2);
    } catch (error) {
      return `Error getting email details: ${error}`;
    }
  },
});

export const sendEmailTool = new DynamicTool({
  name: 'send_email',
  description: 'Send an email via Gmail. Parameters: to (string), subject (string), body (string)',
  func: async (input: string) => {
    try {
      let params: any = {};
      
      // Handle undefined, empty, or invalid JSON input
      if (input && input.trim() !== '') {
        try {
          params = JSON.parse(input);
        } catch (parseError) {
          return `Error: Invalid JSON input provided`;
        }
      }
      
      const { to, subject, body } = params;
      
      if (!to || !subject || !body) {
        throw new Error('to, subject, and body are required');
      }
      
      const result = await gmailTools.sendEmail(to, subject, body);
      return JSON.stringify(result, null, 2);
    } catch (error) {
      return `Error sending email: ${error}`;
    }
  },
});




// Export all tools as an array for easy use with LangChain agents
export const allTools = [
  listEmailsTool,
  getEmailDetailsTool,
  sendEmailTool,

];

// Export the tool instances for direct use
export { gmailTools }; 