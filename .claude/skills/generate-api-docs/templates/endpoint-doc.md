# API Endpoint Reference

## Authentication
All endpoints require JWT authentication via Supabase unless marked as **Public**.
Admin-only endpoints require the `isAdmin` middleware.

## [Domain Name]

### [METHOD] [path]
- **Auth:** [Admin | Authenticated | Public]
- **Request Body:**
  ```json
  {
    "field": "type (required/optional)"
  }
  ```
- **Response:** `TypeName` ([status code])
- **Errors:** [status codes and conditions]
- **Description:** [What this endpoint does]
