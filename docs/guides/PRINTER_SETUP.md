# Star mPOP Printer Integration

This document describes the Star mPOP Bluetooth printer integration for the KruzeApp POS system.

## Overview

The system integrates the Star mPOP printer for automatic receipt printing and cash drawer control using Web Bluetooth API. When a sale is completed:

1. **Receipt is automatically printed** to the connected Star mPOP printer
2. **Cash drawer opens automatically** when cash is selected as payment method
3. **Receipts include** company info, itemized products, VAT breakdown, payment details, and change

## Features

- ✅ Bluetooth connection to Star mPOP printer via Web Bluetooth API
- ✅ Automatic receipt printing after each sale
- ✅ Automatic cash drawer opening for cash payments
- ✅ ESC/POS formatted receipts with proper Dutch formatting
- ✅ VAT breakdown on receipts
- ✅ Payment method display (including split payments)
- ✅ Change calculation and display
- ✅ Printer settings UI for connection management
- ✅ Test printing and cash drawer test functions
- ✅ Auto-reconnection to previously paired printer
- ✅ Graceful fallback if printer is not connected

## Files Created/Modified

### New Files

1. **`/client/src/services/starPrinter.ts`**
   - Bluetooth printer connection service
   - Cash drawer control
   - Raw data transmission to printer
   - Connection status management
   - Auto-reconnection logic

2. **`/client/src/services/receiptPrinter.ts`**
   - Receipt formatting with ESC/POS commands
   - Star printer command generation
   - Dutch currency and date formatting
   - Company header, items, VAT breakdown, payments

3. **`/client/src/components/pos/PrinterSettingsDialog.tsx`**
   - Printer connection management UI
   - Connection status display
   - Test printing function
   - Manual cash drawer test
   - Browser compatibility warnings

4. **`/client/src/types/web-bluetooth.d.ts`**
   - TypeScript definitions reference for Web Bluetooth API

### Modified Files

1. **`/client/src/pages/pos/POSPage.tsx`**
   - Added Printer button to header
   - Added PrinterSettingsDialog component
   - Imports printer settings dialog

2. **`/client/src/components/pos/PaymentDialog.tsx`**
   - Integrated automatic receipt printing after sale
   - Integrated automatic cash drawer opening for cash payments
   - Added error handling for printer failures
   - Fetches receipt data and sends to printer

3. **`/home/user/KruzeApp/tsconfig.json`**
   - Added `web-bluetooth` types

4. **`/home/user/KruzeApp/package.json`**
   - Added `@types/web-bluetooth` dev dependency

## Usage Instructions

### Initial Setup

1. **Ensure Browser Compatibility**
   - Chrome, Edge, or Opera required (Web Bluetooth support)
   - Firefox and Safari do not support Web Bluetooth API

2. **Power On Star mPOP**
   - Turn on the Star mPOP printer
   - Ensure it's in Bluetooth pairing mode
   - Keep printer within Bluetooth range (~10 meters)

### Connecting the Printer

1. Navigate to the POS page
2. Click the **"Printer"** button in the top-right corner
3. Click **"Verbinden"** (Connect)
4. Select **"mPOP"** or **"STAR"** device from the browser's Bluetooth pairing dialog
5. Wait for connection confirmation
6. The printer status will show **"Verbonden"** (Connected)

### Testing the Printer

1. Open Printer Settings (click "Printer" button)
2. Click **"Test afdruk"** to print a test receipt
3. Click **"Open kassalade"** to test the cash drawer
4. Verify that both functions work correctly

### Daily Operations

#### Making a Sale

1. Add products to cart
2. Select customer
3. Click **"Afrekenen"** (Checkout)
4. Select payment method:
   - If **Cash** is selected, the cash drawer will open automatically
   - Enter cash tendered amount if paying with cash
5. Click **"Verkoop afronden"** (Complete Sale)
6. Receipt will **automatically print** to the Star printer
7. Cash drawer will **automatically open** (if cash payment)
8. Receipt dialog will appear for browser print (backup)

#### If Printer Disconnects

The printer service automatically attempts to reconnect to the last paired device. If reconnection fails:

1. Click the **"Printer"** button
2. Click **"Verbinding verbreken"** (Disconnect)
3. Click **"Verbinden"** (Connect) to re-pair
4. Select the printer from the Bluetooth dialog

## Technical Details

### Web Bluetooth API

The integration uses the **Web Bluetooth API** to communicate directly with the Star mPOP printer from the browser. This approach:

- ✅ Works directly in the browser (no native app needed)
- ✅ No middleware or bridge software required
- ✅ Direct Bluetooth Low Energy (BLE) connection
- ❌ Requires Chrome/Edge/Opera browser
- ❌ Not supported in Firefox/Safari

### ESC/POS Commands

Receipts are formatted using **Star ESC/POS commands**:

- `ESC @ (0x1B 0x40)` - Initialize printer
- `ESC BEL (0x1B 0x07)` - Open cash drawer
- `ESC d (0x1B 0x64)` - Feed and cut paper
- Text encoding with proper Dutch character support (CP858)
- Alignment, bold, and size formatting commands

### Star Printer Service UUID

- **Service UUID**: `49535343-fe7d-4ae5-8fa9-9fafd205e455`
- **Characteristic UUID**: `49535343-8841-43f4-a8d4-ecbe34729bb3`
- **MTU**: 512 bytes per chunk (with 50ms delay between chunks)

### Receipt Format

```
            Company Name
         Address Line
      Postal Code + City
         Tel: Phone
          Email
      BTW: VAT Number
      KVK: KVK Number
------------------------------------------------
Bon                                         #123
01-01-2024                              14:30
Klant: Customer Name
------------------------------------------------
Product Name
  2x €5,00 (250g)                       €10,00
Another Product
  1x €3,50                               €3,50
------------------------------------------------
Subtotaal                                €13,50
------------------------------------------------
BTW overzicht:
  9% BTW                                  €0,28
  21% BTW                                 €1,98
------------------------------------------------
TOTAAL                                   €13,50
------------------------------------------------
Betaling:
  Cash                                   €20,00
------------------------------------------------
Wisselgeld                                €6,50
------------------------------------------------
       Bedankt voor uw bezoek!
              Tot ziens!
```

## Troubleshooting

### Printer Not Found in Bluetooth Dialog

- Ensure Star mPOP is powered on
- Check that printer is in Bluetooth range
- Turn printer off and on again
- Refresh the browser page

### Receipt Not Printing

1. Check printer connection status in Printer Settings
2. Verify printer has paper loaded
3. Check printer is not in error state (lights)
4. Try disconnecting and reconnecting
5. Test with "Test afdruk" button

### Cash Drawer Not Opening

1. Verify cash drawer is properly connected to mPOP
2. Test with "Open kassalade" button in settings
3. Check drawer cable connection
4. Ensure "Cash" payment method is selected

### Browser Not Supported Warning

- Web Bluetooth requires Chrome, Edge, or Opera
- Switch to a supported browser
- Alternatively, use browser's print dialog (fallback)

### TypeScript Errors

If you encounter TypeScript errors related to Web Bluetooth:

1. Ensure `@types/web-bluetooth` is installed: `npm install --save-dev @types/web-bluetooth`
2. Verify `tsconfig.json` includes `"web-bluetooth"` in types array
3. Run `npm run check` to verify no errors

## Future Enhancements

Potential improvements for future development:

- [ ] Network printing support (StarWebPRNT) for Wi-Fi connected printers
- [ ] Receipt customization options (logo upload, footer text)
- [ ] Print job queue for handling multiple receipts
- [ ] Receipt reprint functionality
- [ ] Kitchen printer support for separate kitchen receipts
- [ ] Label printing for product labels
- [ ] End-of-day reports printing
- [ ] Support for other printer brands (Epson, Citizen)

## Support

For issues or questions:

1. Check browser console for error messages
2. Verify printer status in Printer Settings
3. Review this documentation
4. Check Star Micronics documentation: https://www.starmicronics.com/support/

## References

- [Web Bluetooth API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API)
- [Star Micronics mPOP](https://www.starmicronics.com/products/mpop/)
- [ESC/POS Command Reference](https://www.starmicronics.com/support/commandemulator.aspx)
