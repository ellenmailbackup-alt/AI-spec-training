# UC-008: Invoice Customer

Allows an admin to download a PDF invoice for a sale and send it to the customer by email, with a copy to the accounting department.

## Metadata
- **Domain:** Finance
- **Primary Actor:** Admin
- **Secondary Actors:** Email Service (Resend)
- **Priority:** Must
- **Status:** Approved
- **Interface:** Admin Dashboard

## Preconditions
- Admin is authenticated and has admin privileges
- A sale exists with a valid invoice number (assigned during sale creation)
- Customer has a valid email address (required for sending; download works without it)

## Main Flow
1. The admin selects a sale from either the Sale Detail page (UC-004) or the Unpaid Invoices page (UC-040).
2. The admin requests to download the invoice.
3. The system generates a PDF invoice containing: the invoice number (FACTUURNR), customer billing details (name, address, VAT number), line items with quantities, unit prices, and line totals, VAT breakdown per applicable rate, subtotal, total VAT, and grand total in EUR, and payment terms and bank details.
4. The system sends the PDF as a file download to the admin's browser.
5. The admin requests to send the invoice by email.
6. The system presents a dialog pre-filled with the email subject ("Factuur [number] - Kruze") and a default message body in Dutch. The dialog shows the recipient (customer email) and confirms CC to accounting.
7. The admin reviews and optionally edits the subject and body, then confirms.
8. The system generates the PDF, attaches it to the email, and sends it to the customer's email address with CC to the accounting email.
9. The system sets the sale status to INVOICED.
10. If no stock movements exist for this sale, the system creates them and sets stockUpdated to true.
11. The system sets the uploadedAccounting flag to true on the sale.
12. The system confirms the email was sent successfully.

## Alternative Flows
- **AF-1: Download Only** -- The admin downloads the PDF (steps 2-4) without sending it by email. No status change or side effects occur.
- **AF-2: Re-send Invoice** -- From the Unpaid Invoices page (UC-040), the admin clicks "Resend" on a previously invoiced sale. The system opens the send dialog (step 6) and repeats steps 7-12.

## Exception Flows
- **EF-1: Email Delivery Failure** -- The Resend service returns an error. The system notifies the admin with a toast message; the invoice remains generated but unsent. No status change occurs.
- **EF-2: PDF Generation Error** -- The system fails to produce the PDF and notifies the admin with a descriptive error message.
- **EF-3: Missing Customer Email** -- The sale's customer has no email address. The Send Invoice button is disabled. The admin can still download the PDF.

## Postconditions
- A PDF invoice has been generated and downloaded, or sent by email, or both.
- If sent: the email was delivered to the customer with CC to accounting.
- If sent: the sale status is set to INVOICED.
- If sent and no prior stock movements existed: stock movements are created and stockUpdated is true.
- If sent: uploadedAccounting is set to true on the sale.
- The invoice number displayed on the PDF matches the sale's invoice number.

## Business Rules
- **BR-1:** Invoices are sent TO the customer's email address with CC to the accounting email (configurable via the `accounting_email` system parameter, defaulting to `boekhouding@example.com`).
- **BR-2:** VAT is shown broken down by applicable rate. Belgian VAT rates are 0%, 6%, 12%, and 21%.
- **BR-3:** Invoice PDFs follow Belgian invoicing requirements: invoice number (FACTUURNR), customer VAT number, line-item detail, and VAT breakdown.
- **BR-4:** The PDF filename follows the pattern `Factuur_[year]_[invoiceNumber].pdf`.
- **BR-5:** The email subject and body are pre-filled in Dutch but editable by the admin before sending.
- **BR-6:** The email subject is limited to 200 characters; the body is limited to 5000 characters.
- **BR-7:** The Send Invoice button is only available when the sale has an invoice number, the customer has an email address, and the sale status is not PAID.

## Implementation Notes
- PDF production is handled by `server/pdfInvoiceService.ts`.
- Email delivery uses the Resend API configured via environment variables.
- The send-invoice endpoint generates the PDF server-side, attaches it, and sends in a single request.

## Implemented By
- Routes: `GET /api/sales/:id/invoice-pdf`, `POST /api/sales/:id/send-invoice`
- Services: `server/pdfInvoiceService.ts`, `server/salesService.ts` (updateSaleStatus)
- Components: `client/src/pages/admin/SaleDetail.tsx`, `client/src/pages/admin/Invoices.tsx`, `client/src/components/admin/SendInvoiceDialog.tsx`

## Related Use Cases
- **UC-003: Create and Manage Sales** -- Invoice numbers are assigned during sale creation; the `/api/invoice-number/next` endpoint belongs there.
- **UC-004: Consult Sale Details** -- One of the two entry points for downloading or sending an invoice.
- **UC-040: Manage Unpaid Invoices** -- The other entry point; the admin can download or resend invoices from the unpaid invoices overview.
