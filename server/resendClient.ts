import { Resend } from 'resend';
import { parameterService } from './parameterService';

export async function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is not set');
  }

  const fromEmail = await parameterService.getParameter('from_email') || 'facturen@kruze.be';

  return {
    client: new Resend(apiKey),
    fromEmail
  };
}
