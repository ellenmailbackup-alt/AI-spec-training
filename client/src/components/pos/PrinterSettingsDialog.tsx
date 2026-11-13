/**
 * Printer Settings Dialog
 *
 * Allows users to connect/disconnect Star mPOP printer
 * and view printer status
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { starPrinter, type PrinterStatus } from '@/services/starPrinter';
import { Printer, Wifi, WifiOff, AlertCircle, CheckCircle } from 'lucide-react';

interface PrinterSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PrinterSettingsDialog({ open, onOpenChange }: PrinterSettingsDialogProps) {
  const [status, setStatus] = useState<PrinterStatus>({
    connected: false,
    printerName: null,
    error: null
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // Subscribe to printer status changes
  useEffect(() => {
    const unsubscribe = starPrinter.onStatusChange(setStatus);
    return unsubscribe;
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await starPrinter.connect();
    } catch (error) {
      console.error('Connection error:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await starPrinter.disconnect();
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    try {
      await starPrinter.printTest();
      alert('Testbon afgedrukt! Controleer de printer.');
    } catch (error) {
      console.error('Test print error:', error);
      alert('Fout bij testafdruk: ' + (error instanceof Error ? error.message : 'Onbekende fout'));
    } finally {
      setIsTesting(false);
    }
  };

  const handleOpenDrawer = async () => {
    try {
      await starPrinter.openCashDrawer();
      alert('Kassalade geopend!');
    } catch (error) {
      console.error('Cash drawer error:', error);
      alert('Fout bij openen kassalade: ' + (error instanceof Error ? error.message : 'Onbekende fout'));
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Printer Instellingen
          </DialogTitle>
          <DialogDescription>
            Beheer de verbinding met de Star mPOP kassaprinter
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Status Display */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              {status.connected ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <WifiOff className="h-5 w-5 text-gray-400" />
              )}
              <div>
                <p className="font-medium">
                  {status.connected ? 'Verbonden' : 'Niet verbonden'}
                </p>
                {status.printerName && (
                  <p className="text-sm text-muted-foreground">{status.printerName}</p>
                )}
              </div>
            </div>
            {status.connected ? (
              <Wifi className="h-5 w-5 text-green-600" />
            ) : (
              <WifiOff className="h-5 w-5 text-gray-400" />
            )}
          </div>

          {/* Error Display */}
          {status.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{status.error}</AlertDescription>
            </Alert>
          )}

          {/* Connection Info */}
          {!status.connected && (
            <Alert>
              <AlertDescription>
                Klik op "Verbinden" om de Star mPOP printer te koppelen via Bluetooth.
                Zorg dat de printer is ingeschakeld en binnen bereik is.
              </AlertDescription>
            </Alert>
          )}

          {/* Connection Buttons */}
          <div className="flex gap-2">
            {!status.connected ? (
              <Button
                onClick={handleConnect}
                disabled={isConnecting}
                className="flex-1"
              >
                {isConnecting ? 'Verbinden...' : 'Verbinden'}
              </Button>
            ) : (
              <Button
                onClick={handleDisconnect}
                variant="outline"
                className="flex-1"
              >
                Verbinding verbreken
              </Button>
            )}
          </div>

          {/* Test Buttons */}
          {status.connected && (
            <div className="space-y-2 pt-4 border-t">
              <p className="text-sm font-medium text-muted-foreground">Test functies</p>
              <div className="flex gap-2">
                <Button
                  onClick={handleTest}
                  disabled={isTesting}
                  variant="outline"
                  className="flex-1"
                >
                  {isTesting ? 'Afdrukken...' : 'Test afdruk'}
                </Button>
                <Button
                  onClick={handleOpenDrawer}
                  variant="outline"
                  className="flex-1"
                >
                  Open kassalade
                </Button>
              </div>
            </div>
          )}

          {/* Browser Compatibility Warning */}
          {!('bluetooth' in navigator) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Web Bluetooth wordt niet ondersteund in deze browser.
                Gebruik Chrome, Edge of Opera voor Bluetooth printer ondersteuning.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
