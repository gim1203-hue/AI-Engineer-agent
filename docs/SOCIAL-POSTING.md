# Auto-posting to TikTok and Instagram

The Content Studio already writes posts, captions and video scripts for every platform, and it can **post to Bluesky** when you click. TikTok and Instagram auto-posting can't run from a static website alone, for three reasons:

1. **App approval.** Both platforms only allow posting through an approved developer app.
2. **A secret key.** Their sign-in flow uses a *client secret* that must live on a server, never in browser code.
3. **Video and image files.** You post media, not just text. The media has to be uploaded, or hosted at a public URL.

This guide covers the path when you're ready. Until then, use **Copy** and **Download** on the draft card and post the content yourself. It takes seconds.

---

## TikTok: Content Posting API
1. Create a developer account at https://developers.tiktok.com and **create an app**.
2. Add the **Login Kit** and **Content Posting API** products.
3. Request the scopes `user.info.basic` and `video.publish` (or `video.upload` to send to the user's TikTok drafts instead).
4. Add a **redirect URI** pointing to your backend, for example `https://YOUR-WORKER.workers.dev/tiktok/callback`.
5. Submit the app for review. **Until TikTok audits the app, every post is forced to private (SELF_ONLY)**. That's fine for testing.

**Backend work needed** (add routes to `worker/worker.js`):
- `/tiktok/login` redirects to TikTok's OAuth page.
- `/tiktok/callback` exchanges the code for an access token using `TIKTOK_CLIENT_SECRET`, a worker secret, and stores the token in Cloudflare KV.
- `/tiktok/post` takes a video (upload it, or use a public URL with `PULL_FROM_URL`), calls `POST https://open.tiktokapis.com/v2/post/publish/video/init/`, then polls the status.
- On the site, a "Post to TikTok" button on the draft card calls `/tiktok/post`. **Keep it as a click, never automatic.**

The upside of `video.upload`: the video lands in your TikTok inbox as a draft, and you finish it in the app with music, effects and the final caption.

## Instagram: Graph API (Content Publishing)
1. Switch your Instagram to a **Professional account** (Business or Creator).
2. Create an app at https://developers.facebook.com with **Instagram API with Instagram Login**.
3. Request `instagram_business_basic` and `instagram_business_content_publish`, then go through **App Review** to use it beyond your own test accounts.
4. Publishing is a two-step process: `POST /{ig-user-id}/media` with an `image_url` or `video_url` (a public URL) and a `caption`, then `POST /{ig-user-id}/media_publish` with the returned container id.
5. The token exchange needs your app secret, so it also goes in the worker.

Limits: about 100 API posts per account per 24 hours, and images must be JPEG at a public URL.

## X (Twitter)
X's API pricing and free-tier limits change often. Check https://developer.x.com before building. Posting needs OAuth 2.0 with PKCE, plus a backend to keep tokens refreshed.

## Rules to follow on every platform
- **A human clicks Post.** Agents that post automatically get accounts banned and are easy to hijack through prompt injection.
- Don't mass-post, follow or comment automatically. That breaks every platform's terms.
- Label AI-generated content where the platform requires it.
