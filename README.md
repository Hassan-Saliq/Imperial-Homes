# Imperial Homes

Premium real estate and construction website for Imperial Homes with:

- Smooth page transitions
- Floating AI sales assistant
- WhatsApp and call quick actions
- Joint venture lead capture
- Node backend for AI replies, inquiry storage, and owner notifications

## Run locally

```bash
npm start
```

The site runs on `http://localhost:3000` by default.

## Environment setup

Create a `.env` file from `.env.example` and fill in the values you want to use.

- `OPENAI_API_KEY` enables real AI replies
- `OWNER_WEBHOOK_URL` sends instant lead notifications to your API
- `RESEND_API_KEY` with `OWNER_EMAIL_FROM` and `OWNER_EMAIL_TO` sends email alerts
- `TWILIO_*` values send WhatsApp notifications to the owner

Without external credentials, the assistant still works with built-in business logic and stores inquiries in `data/*.jsonl`.

## API routes

- `GET /api/health`
- `POST /api/chat`
- `POST /api/lead`
