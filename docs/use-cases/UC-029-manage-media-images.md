# UC-029: Manage Media Library

An admin uploads, selects, and removes images through a central media library. This is a reusable **extend** use case: other use cases reference it at their own extension points whenever the user needs to attach an image to an entity.

## Metadata
- **Domain:** Media / Operations
- **Primary Actor:** Admin
- **Secondary Actors:** None
- **Priority:** Should
- **Status:** Approved
- **Interface:** Admin Dashboard
- **Stereotype:** \<\<extend\>\>

## Extends
This use case extends the following base use cases at the indicated extension points:

| Base Use Case | Extension Point | Context |
|---------------|----------------|---------|
| UC-001: Manage Products | Attach Image | Product image on create or edit |
| UC-015: Configure System Settings | Attach Category Image | Product type / category image |

Additional base use cases may reference this extend use case in the future (e.g. storefront banners, customer logos).

## Preconditions
- Admin is authenticated and has admin privileges.
- Image storage service (Google Cloud Storage) is configured and accessible.

## Extension Flow — Upload New Image
_Triggered when the admin chooses "upload" at an extension point in a base use case._

1. The admin selects an image file from their device.
2. The system validates the file:
   - Must be a supported image format (JPEG, PNG, GIF, or WebP).
   - Must not exceed 5 MB.
3. The system stores the image in the media library under the appropriate folder.
4. The system returns the image reference to the base use case.
5. The base use case records the reference on its entity.

## Extension Flow — Select from Library
_Triggered when the admin chooses "select from library" at an extension point in a base use case._

1. The system shows all available images in the media library, organised by folder (Products, Categories).
2. The admin selects an existing image.
3. The system returns the image reference to the base use case.
4. The base use case records the reference on its entity.

## Alternative Flows
- **AF-1: Standalone Media Library** — The admin opens the Media Library page directly from the Settings menu. The system shows all uploaded images with previews in a grid. The admin can upload new images, view images in a new tab, or delete images from this page.
- **AF-2: Replace Image** — The admin uploads or selects a new image for an entity that already has one. The system replaces the previous image reference with the new one on the entity.
- **AF-3: Remove Image** — The admin removes an image reference from an entity without deleting the image from the library. The entity reverts to having no image.
- **AF-4: Delete from Library** — The admin deletes an image from the media library. The system removes the image from storage. Existing entity references to this image become broken (the system does not cascade-update references).

## Exception Flows
- **EF-1: Invalid File Type** — The selected file is not a supported image format. The system rejects the upload and informs the admin.
- **EF-2: File Too Large** — The image exceeds 5 MB. The system rejects the upload and informs the admin.
- **EF-3: Storage Unavailable** — The image cannot be stored due to a service error. The system shows an error message and retains the previous image if one existed.

## Postconditions
- The image is stored in the media library and available via a public URL.
- The calling base use case has received the image reference (upload or select flows).

## Business Rules
- **BR-1:** Supported image formats: JPEG, PNG, GIF, WebP.
- **BR-2:** Maximum file size: 5 MB.
- **BR-3:** Images are validated on both client and server (MIME type and file extension).
- **BR-4:** Product images are stored under `images/products/`; category images under `images/categories/`.
- **BR-5:** Category images use a deterministic naming scheme (`category-{id}{ext}`) so re-uploads overwrite the previous file.
- **BR-6:** Deleting an image from the library removes it from storage but does not update entity references.

## Implementation Notes
- Images are stored in Google Cloud Storage (GCS) with public read access via bucket-level IAM.
- Files are uploaded through memory-only Multer middleware (never written to local disk).
- The MediaLibrary component operates in two modes: picker (returns selection to caller) and standalone (full CRUD).
- Image URL resolution supports three formats for backwards compatibility: full GCS URL, absolute path, and legacy relative path.

## Implemented By
- Routes: `POST /api/products/upload-image`, `POST /api/settings/product-types/:id/image`, `GET /api/media`, `POST /api/media/upload`, `DELETE /api/media`
- Services: `server/gcs.ts`
- Components: `client/src/components/admin/MediaLibrary.tsx` (reusable picker/standalone), `client/src/pages/admin/MediaLibrary.tsx` (full page)
