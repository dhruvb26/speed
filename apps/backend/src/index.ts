import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {

  const gmailAuth = `https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=${encodeURIComponent("http://localhost:3000/api/auth/gmail/callback")}&response_type=code&scope=SCOPES&access_type=offline&prompt=consent`

  return c.text('Hello Hono!')
})

export default app
