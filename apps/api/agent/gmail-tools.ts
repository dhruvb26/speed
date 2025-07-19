/**
 * Gmail API tools with proper authentication and error handling
 */

import * as fs from 'fs';
import * as path from 'path';
import { EmailMessage, GmailAuthHeaders, GmailListParams, GmailMessageResponse, GmailMessageDetails } from './models.js';

interface TokenData {
  access_token: string;
  refresh_token: string;
  token_uri?: string;
  client_id?: string;
  client_secret?: string;
  scope?: string;
  token_type?: string;
  expiry_date?: number;
}

export class GmailTools {
  private tokenPath: string;
  private baseUrl: string = 'https://gmail.googleapis.com';

  constructor(tokenPath: string = '../utils/token.json') {
    if (!path.isAbsolute(tokenPath)) {
      // Resolve relative to current working directory
      this.tokenPath = path.resolve(tokenPath);
    } else {
      this.tokenPath = tokenPath;
    }
    
    console.log(`[GmailTools] Initialized with token path: ${this.tokenPath}`);
  }

  private async refreshToken(tokenData: TokenData): Promise<string> {
    console.log('[GmailTools] Refreshing access token...');
    
    // For now, we'll skip token refresh since we don't have the required OAuth client credentials
    // The user should re-authenticate if the token is expired
    console.log('[GmailTools] Token refresh not implemented - please re-authenticate if token is expired');
    throw new Error('Token refresh not implemented - please re-authenticate if token is expired');
  }

  private async getAuthHeaders(): Promise<GmailAuthHeaders> {
    console.log(`[GmailTools] Getting auth headers from token file: ${this.tokenPath}`);
    
    if (!fs.existsSync(this.tokenPath)) {
      console.error(`[GmailTools] Token file not found at ${this.tokenPath}`);
      throw new Error(`Token file not found at ${this.tokenPath}`);
    }

    try {
      const tokenData: TokenData = JSON.parse(fs.readFileSync(this.tokenPath, 'utf8'));
      console.log('[GmailTools] Token file loaded successfully');
      
      let accessToken = tokenData.access_token;
      
      // Check if token is expired
      if (tokenData.expiry_date) {
        const expiryDate = new Date(tokenData.expiry_date);
        const now = new Date();
        const timeUntilExpiry = expiryDate.getTime() - now.getTime();
        
        console.log(`[GmailTools] Token expires at: ${expiryDate.toISOString()}`);
        console.log(`[GmailTools] Time until expiry: ${Math.round(timeUntilExpiry / 1000 / 60)} minutes`);
        
        // If token expires within 5 minutes, refresh it
        if (timeUntilExpiry < 5 * 60 * 1000) {
          console.log('[GmailTools] Token expires soon, refreshing...');
          accessToken = await this.refreshToken(tokenData);
        } else {
          console.log('[GmailTools] Token is still valid, using existing token');
        }
      } else {
        console.warn('[GmailTools] No expiry date found in token data');
      }
      
      if (!accessToken) {
        console.error('[GmailTools] No access token found in token file');
        throw new Error('No access token found in token file');
      }
      
      console.log('[GmailTools] Auth headers prepared successfully');
      return {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      };
    } catch (error) {
      console.error(`[GmailTools] Failed to get auth headers: ${error}`);
      throw new Error(`Failed to get auth headers: ${error}`);
    }
  }

  async listEmails(maxResults: number = 10, query?: string): Promise<EmailMessage[]> {
    console.log(`[GmailTools] Listing emails - maxResults: ${maxResults}, query: ${query || 'none'}`);
    
    try {
      const url = `${this.baseUrl}/gmail/v1/users/me/messages`;
      const headers = await this.getAuthHeaders();
      
      const params = new URLSearchParams({
        maxResults: maxResults.toString(),
      });

      if (query) {
        params.append('q', query);
      }

      const fullUrl = `${url}?${params}`;
      console.log(`[GmailTools] Making request to: ${fullUrl}`);
      
      const response = await fetch(fullUrl, {
        headers,
      });

      if (!response.ok) {
        console.error(`[GmailTools] List emails request failed: ${response.status} ${response.statusText}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: GmailMessageResponse = await response.json();
      console.log(`[GmailTools] Received ${data.messages?.length || 0} message IDs`);
      
      const emails: EmailMessage[] = [];

      if (data.messages) {
        console.log(`[GmailTools] Fetching details for ${data.messages.length} messages...`);
        for (const message of data.messages) {
          console.log(`[GmailTools] Fetching details for message ID: ${message.id}`);
          const emailDetails = await this.getEmailDetails(message.id);
          if (emailDetails) {
            emails.push(emailDetails);
          }
        }
      } else {
        console.log('[GmailTools] No messages found');
      }

      console.log(`[GmailTools] Successfully retrieved ${emails.length} emails`);
      return emails;
    } catch (error) {
      console.error(`[GmailTools] Failed to list emails: ${error}`);
      throw new Error(`Failed to list emails: ${error}`);
    }
  }

  async getEmailDetails(messageId: string): Promise<EmailMessage | null> {
    console.log(`[GmailTools] Getting details for message ID: ${messageId}`);
    
    try {
      const url = `${this.baseUrl}/gmail/v1/users/me/messages/${messageId}`;
      const headers = await this.getAuthHeaders();
      
      console.log(`[GmailTools] Making request to: ${url}`);
      const response = await fetch(url, { headers });

      if (!response.ok) {
        console.error(`[GmailTools] Get email details failed: ${response.status} ${response.statusText}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: GmailMessageDetails = await response.json();
      const payload = data.payload;
      const headersList = payload.headers;

      console.log(`[GmailTools] Processing email headers (${headersList.length} headers)`);

      // Extract email components
      let subject = '';
      let sender = '';
      let recipient = '';

      for (const header of headersList) {
        const name = header.name.toLowerCase();
        if (name === 'subject') {
          subject = header.value;
        } else if (name === 'from') {
          sender = header.value;
        } else if (name === 'to') {
          recipient = header.value;
        }
      }

      console.log(`[GmailTools] Email details - Subject: "${subject}", From: "${sender}", To: "${recipient}"`);

      // Extract body
      const body = this.extractBody(payload);
      console.log(`[GmailTools] Extracted body length: ${body.length} characters`);

      // Convert Gmail timestamp (milliseconds) to Date
      const timestampMs = parseInt(data.internalDate || '0');
      const timestamp = timestampMs > 0 ? new Date(timestampMs) : new Date();
      console.log(`[GmailTools] Email timestamp: ${timestamp.toISOString()}`);

      const emailMessage: EmailMessage = {
        id: messageId,
        threadId: data.threadId,
        subject,
        sender,
        recipient,
        body,
        timestamp,
        labels: data.labelIds || [],
        isRead: !data.labelIds.includes('UNREAD'),
      };

      console.log(`[GmailTools] Email processed successfully - Read: ${emailMessage.isRead}, Labels: ${emailMessage.labels.join(', ')}`);
      return emailMessage;
    } catch (error) {
      console.error(`[GmailTools] Error getting email details for ${messageId}: ${error}`);
      return null;
    }
  }

  private extractBody(payload: GmailMessageDetails['payload']): string {
    console.log(`[GmailTools] Extracting body from payload`);
    
    // Check if email has parts
    if (payload.parts) {
      console.log(`[GmailTools] Email has ${payload.parts.length} parts`);
      for (const part of payload.parts) {
        console.log(`[GmailTools] Checking part - MIME type: ${part.mimeType}, has data: ${!!part.body.data}`);
        if (part.mimeType === 'text/plain' && part.body.data) {
          console.log('[GmailTools] Found text/plain part, decoding...');
          return this.decodeBase64(part.body.data);
        }
      }
      console.log('[GmailTools] No text/plain part found in multipart email');
    } else if (payload.body?.data) {
      console.log('[GmailTools] Single part email, decoding body...');
      return this.decodeBase64(payload.body.data);
    }
    
    console.log('[GmailTools] No body data found');
    return '';
  }

  private decodeBase64(data: string): string {
    try {
      console.log(`[GmailTools] Decoding base64 data (length: ${data.length})`);
      // Gmail uses URL-safe base64 encoding
      const buffer = Buffer.from(data, 'base64url');
      const decoded = buffer.toString('utf8');
      console.log(`[GmailTools] Successfully decoded to ${decoded.length} characters`);
      return decoded;
    } catch (error) {
      console.error(`[GmailTools] Error decoding base64: ${error}`);
      return '';
    }
  }

  async sendEmail(to: string, subject: string, body: string): Promise<Record<string, any>> {
    console.log(`[GmailTools] Sending email - To: ${to}, Subject: "${subject}"`);
    console.log(`[GmailTools] Email body length: ${body.length} characters`);
    
    try {
      // Create email message
      const emailLines = [
        `To: ${to}`,
        `Subject: ${subject}`,
        '',
        body
      ];
      const email = emailLines.join('\n');
      console.log(`[GmailTools] Constructed email message (${email.length} characters)`);

      // Encode email as base64url
      const encodedEmail = Buffer.from(email).toString('base64url');
      console.log(`[GmailTools] Encoded email to base64url (${encodedEmail.length} characters)`);

      const url = `${this.baseUrl}/gmail/v1/users/me/messages/send`;
      const headers = await this.getAuthHeaders();
      
      console.log(`[GmailTools] Making send request to: ${url}`);
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ raw: encodedEmail }),
      });

      if (!response.ok) {
        console.error(`[GmailTools] Send email failed: ${response.status} ${response.statusText}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log(`[GmailTools] Email sent successfully - Message ID: ${result.id}`);
      return result;
    } catch (error) {
      console.error(`[GmailTools] Failed to send email: ${error}`);
      throw new Error(`Failed to send email: ${error}`);
    }
  }
} 