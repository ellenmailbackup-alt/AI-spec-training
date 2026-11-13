/**
 * Star mPOP Printer Service
 *
 * Handles Bluetooth connection and communication with Star mPOP printer
 * using Web Bluetooth API and Star ESC/POS commands.
 */

export interface PrinterStatus {
  connected: boolean;
  printerName: string | null;
  error: string | null;
}

export class StarPrinterService {
  private device: BluetoothDevice | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private statusCallbacks: Set<(status: PrinterStatus) => void> = new Set();

  // Star Line Mode service UUID (for Star printers)
  private readonly SERVICE_UUID = '49535343-fe7d-4ae5-8fa9-9fafd205e455';
  private readonly CHARACTERISTIC_UUID = '49535343-8841-43f4-a8d4-ecbe34729bb3';

  constructor() {
    this.loadSavedDevice();
  }

  /**
   * Get current printer status
   */
  getStatus(): PrinterStatus {
    return {
      connected: this.isConnected(),
      printerName: this.device?.name || null,
      error: null
    };
  }

  /**
   * Subscribe to printer status changes
   */
  onStatusChange(callback: (status: PrinterStatus) => void): () => void {
    this.statusCallbacks.add(callback);
    // Send initial status
    callback(this.getStatus());

    return () => {
      this.statusCallbacks.delete(callback);
    };
  }

  /**
   * Notify all subscribers of status change
   */
  private notifyStatusChange(status: PrinterStatus) {
    this.statusCallbacks.forEach(callback => callback(status));
  }

  /**
   * Check if printer is connected
   */
  isConnected(): boolean {
    return this.device?.gatt?.connected || false;
  }

  /**
   * Connect to Star mPOP printer via Bluetooth
   */
  async connect(): Promise<void> {
    try {
      console.log('Requesting Bluetooth device...');

      // Request device - accept all devices to ensure compatibility
      // This allows the user to see and select any Bluetooth device
      this.device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [this.SERVICE_UUID]
      });

      console.log('Connecting to GATT Server...');
      const server = await this.device.gatt!.connect();

      console.log('Getting Service...');
      const service = await server.getPrimaryService(this.SERVICE_UUID);

      console.log('Getting Characteristic...');
      this.characteristic = await service.getCharacteristic(this.CHARACTERISTIC_UUID);

      // Handle disconnection
      this.device.addEventListener('gattserverdisconnected', this.onDisconnected);

      // Save device for auto-reconnect
      if (this.device.id) {
        localStorage.setItem('starPrinterDeviceId', this.device.id);
      }

      console.log('Printer connected successfully');
      this.notifyStatusChange({
        connected: true,
        printerName: this.device.name || 'Star Printer',
        error: null
      });
    } catch (error) {
      console.error('Failed to connect to printer:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.notifyStatusChange({
        connected: false,
        printerName: null,
        error: `Connection failed: ${errorMessage}`
      });
      throw error;
    }
  }

  /**
   * Load previously connected device
   */
  private async loadSavedDevice() {
    try {
      const savedDeviceId = localStorage.getItem('starPrinterDeviceId');
      if (!savedDeviceId) return;

      const devices = await navigator.bluetooth.getDevices();
      const savedDevice = devices.find(d => d.id === savedDeviceId);

      if (savedDevice) {
        this.device = savedDevice;
        // Try to reconnect
        await this.reconnect();
      }
    } catch (error) {
      console.warn('Failed to load saved device:', error);
    }
  }

  /**
   * Reconnect to previously connected device
   */
  async reconnect(): Promise<void> {
    if (!this.device) {
      throw new Error('No device to reconnect to');
    }

    try {
      const server = await this.device.gatt!.connect();
      const service = await server.getPrimaryService(this.SERVICE_UUID);
      this.characteristic = await service.getCharacteristic(this.CHARACTERISTIC_UUID);

      this.notifyStatusChange({
        connected: true,
        printerName: this.device.name || 'Star Printer',
        error: null
      });
    } catch (error) {
      console.error('Reconnection failed:', error);
      throw error;
    }
  }

  /**
   * Handle disconnection
   */
  private onDisconnected = () => {
    console.log('Printer disconnected');
    this.characteristic = null;
    this.notifyStatusChange({
      connected: false,
      printerName: this.device?.name || null,
      error: 'Printer disconnected'
    });
  };

  /**
   * Disconnect from printer
   */
  async disconnect(): Promise<void> {
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    this.device = null;
    this.characteristic = null;
    localStorage.removeItem('starPrinterDeviceId');

    this.notifyStatusChange({
      connected: false,
      printerName: null,
      error: null
    });
  }

  /**
   * Send raw data to printer
   */
  async sendData(data: Uint8Array): Promise<void> {
    if (!this.isConnected() || !this.characteristic) {
      throw new Error('Printer not connected');
    }

    try {
      // Split data into chunks if needed (Bluetooth MTU is typically 20-512 bytes)
      const chunkSize = 512;
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        await this.characteristic.writeValue(chunk);
        // Small delay between chunks to prevent buffer overflow
        if (i + chunkSize < data.length) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
    } catch (error) {
      console.error('Failed to send data to printer:', error);
      throw error;
    }
  }

  /**
   * Open cash drawer
   */
  async openCashDrawer(): Promise<void> {
    console.log('Opening cash drawer...');

    // Star mPOP cash drawer open command (ESC/POS)
    // ESC BEL (0x07) - Standard cash drawer pulse
    const command = new Uint8Array([
      0x1B, 0x07  // ESC BEL
    ]);

    await this.sendData(command);
    console.log('Cash drawer command sent');
  }

  /**
   * Print test page
   */
  async printTest(): Promise<void> {
    const commands: number[] = [];

    // Initialize printer
    commands.push(0x1B, 0x40); // ESC @ - Initialize

    // Set alignment to center
    commands.push(0x1B, 0x1D, 0x61, 0x01);

    // Print test text
    const text = 'Star mPOP Test\nPrinter Connected!\n\n';
    commands.push(...Array.from(new TextEncoder().encode(text)));

    // Cut paper
    commands.push(0x1B, 0x64, 0x02); // ESC d 2 - Feed and cut

    await this.sendData(new Uint8Array(commands));
  }
}

// Singleton instance
export const starPrinter = new StarPrinterService();
