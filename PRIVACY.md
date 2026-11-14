Privacy Policy
Last updated: 2026-11-14

AI/GUIDE Agent is a static website. It has no database and runs no analytics.

What is stored, and where
In your own browser (localStorage):

API keys you enter (Google Gemini or Anthropic Claude)
Your Bluesky handle and app password, if added
Your Google OAuth Client ID, backend URL and reader URL, if added
Your study plan, notes, quiz score and voice setting
The Google access token is kept in session storage only. It's cleared when you close the tab, and it expires after about an hour.

"Forget everything" in Settings removes the keys and passwords. Clearing site data removes everything.

Where data is sent
Data goes straight from your browser to these services, and only when you use the matching feature:

Service	What is sent	When
Google Gemini API or Anthropic API, or the site owner's backend worker, which forwards to them	Your messages and tool results (which may include email, calendar or webpage text)	Every chat message
Jina Reader (r.jina.ai), or the backend worker	The URL to read	When the agent reads a webpage
Wikipedia (en.wikipedia.org)	The search words	When the agent searches the web and live Google Search isn't available
Google (Gmail and Calendar APIs)	Read requests. Draft and event data when you click Save or Add	Only after you click "Connect Google"
Bluesky (bsky.social)	Handle, app password and post text	Only when you click "Post to Bluesky"
Your browser's speech service	Your voice, when you use the 🎤 button	Only while recording. Chrome sends audio to Google for recognition
Each service's own privacy policy applies. The free Gemini tier may use prompts to improve Google's products, so avoid sharing sensitive information.

If the site owner runs the optional backend worker, requests pass through their Cloudflare account. The worker doesn't store them, but Cloudflare may keep standard request logs.

Google user data
Scopes: gmail.readonly (read), gmail.compose (create drafts; the app never sends email) and calendar.events (read events, and add an event when you click).
Google data is used only to answer your requests in the chat. It's sent to the AI provider you chose and to no one else.
Use of information received from Google APIs follows the Google API Services User Data Policy, including the Limited Use requirements.
To revoke access, use "Disconnect" in Settings or go to https://myaccount.google.com/permissions.
Contact
Open an issue on this project's GitHub repository.