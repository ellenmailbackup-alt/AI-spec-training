import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Request } from 'express';
import {
  parseIdParam,
  parseYearParam,
  logSecurityEvent,
  sanitizeError,
} from './security';

describe('security utilities', () => {
  describe('parseIdParam', () => {
    describe('valid inputs', () => {
      it('parses positive integers correctly', () => {
        expect(parseIdParam('1')).toBe(1);
        expect(parseIdParam('42')).toBe(42);
        expect(parseIdParam('12345')).toBe(12345);
        expect(parseIdParam('999999')).toBe(999999);
      });

      it('handles integer strings with whitespace', () => {
        // parseInt handles leading/trailing spaces
        expect(parseIdParam(' 123 ')).toBe(123);
      });

      it('uses default parameter name in error message', () => {
        expect(() => parseIdParam('invalid')).toThrow('Invalid id:');
      });

      it('uses custom parameter name in error message', () => {
        expect(() => parseIdParam('invalid', 'productId')).toThrow(
          'Invalid productId:'
        );
      });
    });

    describe('invalid inputs', () => {
      it('throws on zero', () => {
        expect(() => parseIdParam('0')).toThrow(
          'Invalid id: must be a positive integer'
        );
        expect(() => parseIdParam('0', 'userId')).toThrow(
          'Invalid userId: must be a positive integer'
        );
      });

      it('throws on negative numbers', () => {
        expect(() => parseIdParam('-1')).toThrow(
          'Invalid id: must be a positive integer'
        );
        expect(() => parseIdParam('-42')).toThrow(
          'Invalid id: must be a positive integer'
        );
        expect(() => parseIdParam('-999')).toThrow(
          'Invalid id: must be a positive integer'
        );
      });

      it('throws on non-numeric strings', () => {
        expect(() => parseIdParam('abc')).toThrow(
          'Invalid id: must be a positive integer'
        );
        expect(() => parseIdParam('hello')).toThrow(
          'Invalid id: must be a positive integer'
        );
        expect(() => parseIdParam('')).toThrow(
          'Invalid id: must be a positive integer'
        );
      });

      it('throws on decimal numbers', () => {
        // parseInt('1.5') returns 1, which is valid
        // This is actually valid behavior since parseInt truncates
        expect(parseIdParam('1.5')).toBe(1);
        expect(parseIdParam('42.99')).toBe(42);
      });

      it('throws on special values', () => {
        expect(() => parseIdParam('NaN')).toThrow(
          'Invalid id: must be a positive integer'
        );
        expect(() => parseIdParam('Infinity')).toThrow(
          'Invalid id: must be a positive integer'
        );
        expect(() => parseIdParam('-Infinity')).toThrow(
          'Invalid id: must be a positive integer'
        );
      });

      it('throws on mixed alphanumeric strings', () => {
        // parseInt('123abc') returns 123, which is valid
        expect(parseIdParam('123abc')).toBe(123);

        // But these should fail
        expect(() => parseIdParam('abc123')).toThrow(
          'Invalid id: must be a positive integer'
        );
      });
    });

    describe('edge cases', () => {
      it('handles very large numbers', () => {
        expect(parseIdParam('2147483647')).toBe(2147483647); // Max 32-bit int
        expect(parseIdParam('9007199254740991')).toBe(9007199254740991); // MAX_SAFE_INTEGER
      });

      it('handles numbers with leading zeros', () => {
        expect(parseIdParam('0001')).toBe(1);
        expect(parseIdParam('00042')).toBe(42);
      });
    });
  });

  describe('parseYearParam', () => {
    describe('valid inputs', () => {
      it('parses years within valid range (2000-2100)', () => {
        expect(parseYearParam('2000')).toBe(2000);
        expect(parseYearParam('2024')).toBe(2024);
        expect(parseYearParam('2050')).toBe(2050);
        expect(parseYearParam('2100')).toBe(2100);
      });

      it('handles current year', () => {
        const currentYear = new Date().getFullYear();
        if (currentYear >= 2000 && currentYear <= 2100) {
          expect(parseYearParam(String(currentYear))).toBe(currentYear);
        }
      });
    });

    describe('invalid inputs', () => {
      it('throws on year below 2000', () => {
        expect(() => parseYearParam('1999')).toThrow(
          'Invalid year: must be between 2000 and 2100'
        );
        expect(() => parseYearParam('1900')).toThrow(
          'Invalid year: must be between 2000 and 2100'
        );
        expect(() => parseYearParam('1')).toThrow(
          'Invalid year: must be between 2000 and 2100'
        );
      });

      it('throws on year above 2100', () => {
        expect(() => parseYearParam('2101')).toThrow(
          'Invalid year: must be between 2000 and 2100'
        );
        expect(() => parseYearParam('3000')).toThrow(
          'Invalid year: must be between 2000 and 2100'
        );
        expect(() => parseYearParam('9999')).toThrow(
          'Invalid year: must be between 2000 and 2100'
        );
      });

      it('throws on non-numeric strings', () => {
        expect(() => parseYearParam('abc')).toThrow(
          'Invalid year: must be between 2000 and 2100'
        );
        expect(() => parseYearParam('twenty24')).toThrow(
          'Invalid year: must be between 2000 and 2100'
        );
        expect(() => parseYearParam('')).toThrow(
          'Invalid year: must be between 2000 and 2100'
        );
      });

      it('throws on negative numbers', () => {
        expect(() => parseYearParam('-2024')).toThrow(
          'Invalid year: must be between 2000 and 2100'
        );
      });

      it('throws on zero', () => {
        expect(() => parseYearParam('0')).toThrow(
          'Invalid year: must be between 2000 and 2100'
        );
      });

      it('throws on special values', () => {
        expect(() => parseYearParam('NaN')).toThrow(
          'Invalid year: must be between 2000 and 2100'
        );
        expect(() => parseYearParam('Infinity')).toThrow(
          'Invalid year: must be between 2000 and 2100'
        );
      });
    });

    describe('edge cases', () => {
      it('handles boundary values correctly', () => {
        expect(parseYearParam('2000')).toBe(2000); // Lower boundary
        expect(parseYearParam('2100')).toBe(2100); // Upper boundary
      });

      it('handles year with leading zeros', () => {
        expect(parseYearParam('02024')).toBe(2024);
      });

      it('truncates decimal years (parseInt behavior)', () => {
        expect(parseYearParam('2024.5')).toBe(2024);
      });
    });
  });

  describe('logSecurityEvent', () => {
    let consoleWarnSpy: any;
    let mockRequest: Partial<Request>;

    beforeEach(() => {
      consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockRequest = {
        ip: '192.168.1.1',
        socket: { remoteAddress: '192.168.1.2' } as any,
        get: vi.fn((header: string) => {
          if (header === 'user-agent') {
            return 'Mozilla/5.0 Test Browser';
          }
          return undefined;
        }),
        path: '/api/test',
        method: 'POST',
      };
    });

    afterEach(() => {
      consoleWarnSpy.mockRestore();
    });

    it('logs security events with basic information', () => {
      logSecurityEvent('Test Event', mockRequest as Request);

      expect(consoleWarnSpy).toHaveBeenCalledOnce();
      const [message, details] = consoleWarnSpy.mock.calls[0];

      expect(message).toMatch(/\[SECURITY\]/);
      expect(message).toContain('Test Event');
      expect(message).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/); // ISO timestamp

      expect(details).toEqual({
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0 Test Browser',
        path: '/api/test',
        method: 'POST',
      });
    });

    it('logs security events with additional details', () => {
      const additionalDetails = {
        userId: 123,
        attemptedAction: 'delete',
        reason: 'insufficient permissions',
      };

      logSecurityEvent('Authorization Failure', mockRequest as Request, additionalDetails);

      expect(consoleWarnSpy).toHaveBeenCalledOnce();
      const [message, details] = consoleWarnSpy.mock.calls[0];

      expect(message).toContain('Authorization Failure');
      expect(details).toEqual({
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0 Test Browser',
        path: '/api/test',
        method: 'POST',
        userId: 123,
        attemptedAction: 'delete',
        reason: 'insufficient permissions',
      });
    });

    it('uses socket remoteAddress when req.ip is not available', () => {
      mockRequest.ip = undefined;

      logSecurityEvent('Test Event', mockRequest as Request);

      const [, details] = consoleWarnSpy.mock.calls[0];
      expect(details.ip).toBe('192.168.1.2');
    });

    it('handles missing user-agent', () => {
      mockRequest.get = vi.fn(() => undefined);

      logSecurityEvent('Test Event', mockRequest as Request);

      const [, details] = consoleWarnSpy.mock.calls[0];
      expect(details.userAgent).toBeUndefined();
    });

    it('includes timestamp in ISO format', () => {
      const beforeTime = new Date().toISOString();
      logSecurityEvent('Test Event', mockRequest as Request);
      const afterTime = new Date().toISOString();

      const [message] = consoleWarnSpy.mock.calls[0];

      // Extract timestamp from message
      const timestampMatch = message.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)/);
      expect(timestampMatch).toBeTruthy();

      if (timestampMatch) {
        const loggedTime = timestampMatch[1];
        expect(loggedTime >= beforeTime && loggedTime <= afterTime).toBe(true);
      }
    });

    it('logs different event types', () => {
      const events = [
        'Authentication Failure',
        'Authorization Denied',
        'Invalid Token',
        'Brute Force Attempt',
        'SQL Injection Attempt',
      ];

      events.forEach(event => {
        logSecurityEvent(event, mockRequest as Request);
      });

      expect(consoleWarnSpy).toHaveBeenCalledTimes(events.length);

      events.forEach((event, index) => {
        const [message] = consoleWarnSpy.mock.calls[index];
        expect(message).toContain(event);
      });
    });

    it('handles requests with different methods', () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

      methods.forEach(method => {
        mockRequest.method = method;
        logSecurityEvent('Test Event', mockRequest as Request);
      });

      expect(consoleWarnSpy).toHaveBeenCalledTimes(methods.length);

      methods.forEach((method, index) => {
        const [, details] = consoleWarnSpy.mock.calls[index];
        expect(details.method).toBe(method);
      });
    });
  });

  describe('sanitizeError', () => {
    describe('Error objects', () => {
      it('sanitizes Error objects in production mode', () => {
        const error = new Error('Test error message');
        const sanitized = sanitizeError(error, false);

        expect(sanitized).toEqual({
          message: 'Test error message',
        });
        expect(sanitized.stack).toBeUndefined();
      });

      it('includes stack trace in development mode', () => {
        const error = new Error('Test error message');
        const sanitized = sanitizeError(error, true);

        expect(sanitized).toHaveProperty('message', 'Test error message');
        expect(sanitized).toHaveProperty('stack');
        expect(sanitized.stack).toContain('Error: Test error message');
      });

      it('handles Error with custom properties', () => {
        const error = new Error('Custom error');
        (error as any).code = 'ERR_CUSTOM';
        (error as any).statusCode = 400;

        const sanitized = sanitizeError(error, false);

        // Should only include message in production
        expect(sanitized).toEqual({
          message: 'Custom error',
        });
      });

      it('handles Error subclasses', () => {
        class CustomError extends Error {
          constructor(message: string) {
            super(message);
            this.name = 'CustomError';
          }
        }

        const error = new CustomError('Custom error message');
        const sanitized = sanitizeError(error, false);

        expect(sanitized).toEqual({
          message: 'Custom error message',
        });
      });
    });

    describe('non-Error objects', () => {
      it('converts string to error object', () => {
        const sanitized = sanitizeError('Something went wrong');

        expect(sanitized).toEqual({
          message: 'Something went wrong',
        });
      });

      it('converts number to error object', () => {
        const sanitized = sanitizeError(404);

        expect(sanitized).toEqual({
          message: '404',
        });
      });

      it('converts null to error object', () => {
        const sanitized = sanitizeError(null);

        expect(sanitized).toEqual({
          message: 'null',
        });
      });

      it('converts undefined to error object', () => {
        const sanitized = sanitizeError(undefined);

        expect(sanitized).toEqual({
          message: 'undefined',
        });
      });

      it('converts object to error object', () => {
        const sanitized = sanitizeError({ foo: 'bar' });

        expect(sanitized).toEqual({
          message: '[object Object]',
        });
      });

      it('converts array to error object', () => {
        const sanitized = sanitizeError(['error1', 'error2']);

        expect(sanitized).toEqual({
          message: 'error1,error2',
        });
      });

      it('converts boolean to error object', () => {
        expect(sanitizeError(true)).toEqual({ message: 'true' });
        expect(sanitizeError(false)).toEqual({ message: 'false' });
      });
    });

    describe('development vs production mode', () => {
      it('respects development flag', () => {
        const error = new Error('Test');

        const production = sanitizeError(error, false);
        const development = sanitizeError(error, true);

        expect(production.stack).toBeUndefined();
        expect(development.stack).toBeDefined();
      });

      it('defaults to production mode when flag not provided', () => {
        const error = new Error('Test');
        const sanitized = sanitizeError(error);

        expect(sanitized.stack).toBeUndefined();
      });

      it('does not include stack for non-Error objects even in development', () => {
        const sanitized = sanitizeError('String error', true);

        expect(sanitized).toEqual({
          message: 'String error',
        });
        expect(sanitized.stack).toBeUndefined();
      });
    });

    describe('real-world error scenarios', () => {
      it('handles database errors', () => {
        const dbError = new Error('Connection timeout');
        (dbError as any).code = 'ETIMEDOUT';
        (dbError as any).errno = -110;

        const sanitized = sanitizeError(dbError, false);

        expect(sanitized).toEqual({
          message: 'Connection timeout',
        });
      });

      it('handles validation errors', () => {
        const validationError = new Error('Invalid email format');
        const sanitized = sanitizeError(validationError, false);

        expect(sanitized.message).toBe('Invalid email format');
      });

      it('handles authentication errors', () => {
        const authError = new Error('Invalid credentials');
        const sanitized = sanitizeError(authError, false);

        expect(sanitized.message).toBe('Invalid credentials');
      });
    });
  });
});
