# Torolalana - Madagascar Government Services Portal

A comprehensive government services portal built with Payload CMS 3.51.0 and
Next.js 15, enabling citizens to discover, apply for, and track government
services online.

## Features

-   **Service Catalog**: Browse and search government services by category
-   **Form Builder**: Dynamic form creation with external API integration
-   **Application Tracking**: Real-time tracking of service applications with
    unique tracking IDs
-   **Multi-Tenant Support**: Support for multiple government agencies
-   **Rich Text Content**: Lexical-based rich text editor for service
    descriptions
-   **Search Functionality**: Full-text search across services
-   **Access Control**: Secure application tracking with proper authentication

## Tech Stack

-   **Framework**: Next.js 15.4.4
-   **CMS**: Payload CMS 3.51.0
-   **Database**: PostgreSQL (via @payloadcms/db-postgres)
-   **Rich Text**: Lexical (@payloadcms/richtext-lexical)
-   **UI**: React 19, Tailwind CSS, Radix UI components
-   **Form Builder**: @payloadcms/plugin-form-builder
-   **Multi-Tenant**: @payloadcms/plugin-multi-tenant
-   **Search**: @payloadcms/plugin-search

## Quick Start

### Prerequisites

-   Node.js ^18.20.2 || >=20.9.0
-   pnpm ^9 || ^10
-   PostgreSQL database

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd torolalana
```

2. Install dependencies:

```bash
pnpm install
```

3. Copy environment variables:

```bash
cp .env.example .env
```

4. Configure your `.env` file with your database connection and secrets (see
   [Environment Variables](#environment-variables))

5. Generate Payload types:

```bash
pnpm generate:types
```

6. Start the development server:

```bash
pnpm dev
```

7. Open `http://localhost:3000` in your browser

8. Access the admin panel at `http://localhost:3000/admin` and create your first
   admin user

## Environment Variables

See `.env.example` for all required environment variables. Key variables
include:

-   `DATABASE_URL`: PostgreSQL connection string
-   `PAYLOAD_SECRET`: Secret key for Payload CMS (generate a random string)
-   `NEXT_PUBLIC_SERVER_URL`: Public URL of your application
-   `WEBHOOK_SECRET`: Secret key for webhook authentication (generate a random string)

## Multi-Tenant Setup

This application supports multiple government agencies (tenants) through the
multi-tenant plugin.

### Adding a New Tenant

1. Log in to the admin panel
2. Navigate to **Tenants** collection
3. Create a new tenant with:
    - Name (e.g., "Ministry of Health")
    - Slug (URL-friendly identifier)
    - Domain (optional, for subdomain-based routing)

### Tenant-Scoped Collections

The following collections are tenant-scoped:

-   **Services**: Each service belongs to a tenant
-   **Forms**: Forms are associated with tenants

### Access Control

-   Super admins can access all tenants
-   Regular admins are assigned to specific tenants
-   Public users see services from all tenants

## Form Creation Guide

### Creating a Form for a Service

1. Navigate to **Forms** in the admin panel
2. Click **Create New**
3. Configure the form:

    - **Title**: Name of the form
    - **Fields**: Add form fields (text, email, select, checkbox, etc.)
    - **Submit Button Label**: Customize the submit button text
    - **Confirmation Type**: Choose message or redirect
    - **External Integration** (optional): Configure API integration

4. Save the form

5. Link the form to a service:
    - Navigate to **Services**
    - Edit the service
    - Select the form in the **Formulaire de soumission associé** field

### External API Integration

Forms can be configured to send submission data to external APIs:

1. In the form editor, expand **External API Integration**
2. Select integration type:
    - **REST API**: Send data to a REST endpoint
    - **Webhook**: Trigger a webhook
    - **Custom**: Custom integration logic
3. Configure:
    - **API URL**: Endpoint URL
    - **HTTP Method**: POST, PUT, or PATCH
    - **Custom Headers**: Add authentication headers
    - **Field Mapping**: Map form fields to API fields

### OAuth Token Management

For APIs requiring OAuth authentication, the system automatically manages token
caching and refresh. Configure OAuth credentials in your integration strategy.

## Application Tracking

### How It Works

1. User submits a form through the service application page
2. System creates a form submission
3. An application record is automatically created with:
    - Unique tracking ID (format: `APP-YYYYMMDD-XXXX`)
    - Status: "pending"
    - Link to the service and submission
4. User is redirected to confirmation page with tracking ID

### Tracking an Application

Users can track applications at `/track` using:

-   Tracking ID
-   Email address (optional, for verification)

### Application Statuses

-   **pending**: Application received
-   **processing**: Under review
-   **approved**: Approved
-   **rejected**: Rejected
-   **info_required**: Additional information needed

## Development

### Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── (frontend)/        # Public-facing pages
│   └── (payload)/         # Payload admin panel
├── collections/           # Payload collections
├── components/            # React components
├── hooks/                 # Payload hooks
├── endpoints/             # Custom API endpoints
├── integrations/          # External API integration
├── lib/                   # Utilities
└── utilities/             # Helper functions
```

### Available Scripts

-   `pnpm dev`: Start development server
-   `pnpm build`: Build for production
-   `pnpm start`: Start production server
-   `pnpm generate:types`: Generate TypeScript types from Payload schema
-   `pnpm test`: Run tests
-   `pnpm lint`: Run linter

### Type Generation

After modifying Payload collections, regenerate types:

```bash
pnpm generate:types
```

This updates `src/payload-types.ts` with the latest schema types.

## Deployment

### Production Build

1. Set environment variables in your hosting platform
2. Build the application:

```bash
pnpm build
```

3. Start the production server:

```bash
pnpm start
```

### Database Migrations

Payload automatically handles database migrations. On first run, it will create
the necessary tables.

### Environment Setup

Ensure all environment variables are set in your production environment. See
`.env.example` for reference.

## API Endpoints

### Public Endpoints

-   `GET /api/track-application?trackingId=XXX&email=XXX`: Track an application
-   `GET /api/application-by-submission?submissionId=XXX`: Get application by submission ID
-   `GET /api/search`: Search services (via search plugin)

### Webhook Endpoints

-   `POST /api/update-application-status`: Update application status (requires webhook secret)

#### Update Application Status Webhook

Allows external services to update the status of an application.

**Authentication:**
- Requires `WEBHOOK_SECRET` environment variable
- Send secret in `Authorization` header: `Authorization: Bearer <WEBHOOK_SECRET>`

**Request Body:**
```json
{
  "trackingId": "APP-20240101-XXXX",
  "status": "processing",
  "note": "Application is being reviewed" // optional
}
```

**Valid Status Values:**
- `pending`
- `processing`
- `approved`
- `rejected`
- `info_required`

**Response:**
```json
{
  "success": true,
  "trackingId": "APP-20240101-XXXX",
  "status": "processing",
  "message": "Application status updated successfully"
}
```

**Example cURL:**
```bash
curl -X POST https://yourdomain.com/api/update-application-status \
  -H "Authorization: Bearer your-webhook-secret" \
  -H "Content-Type: application/json" \
  -d '{
    "trackingId": "APP-20240101-XXXX",
    "status": "approved",
    "note": "Application approved by reviewing officer"
  }'
```

### Admin Endpoints

-   All Payload admin endpoints are available at `/admin/api/*`
-   GraphQL endpoint: `/api/graphql`
-   GraphQL Playground: `/api/graphql-playground`

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

MIT

## Support

For issues and questions, please open an issue on the repository.
