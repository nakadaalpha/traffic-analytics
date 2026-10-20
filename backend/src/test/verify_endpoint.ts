import { trackClick } from '../controllers/tracking.controller';
import { anonymizeIp } from '../services/security.service';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';

function createMockResponse() {
  const res: Partial<Response> & {
    statusCode: number;
    ended: boolean;
    sentData: any;
  } = {
    statusCode: 200,
    ended: false,
    sentData: null,
    status(code: number) {
      this.statusCode = code;
      return this as Response;
    },
    end() {
      this.ended = true;
      return this as Response;
    },
    json(data: any) {
      this.sentData = data;
      this.ended = true;
      return this as Response;
    },
    send(data: any) {
      this.sentData = data;
      this.ended = true;
      return this as Response;
    },
  };
  return res as Response & { statusCode: number; ended: boolean; sentData: any };
}

async function runSecurityTests() {
  console.log('[Test] Starting Multi-Tenant Security & Tracking Tests...');

  // Test 1: IP Anonymization (GDPR compliance)
  {
    const ipv4 = '192.168.1.188';
    const maskedV4 = anonymizeIp(ipv4);
    if (maskedV4 !== '192.168.1.0') {
      throw new Error(`IPv4 Masking failed: expected 192.168.1.0, got ${maskedV4}`);
    }

    const ipv6 = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
    const maskedV6 = anonymizeIp(ipv6);
    if (!maskedV6.endsWith('::')) {
      throw new Error(`IPv6 Masking failed: got ${maskedV6}`);
    }
    console.log('✓ Test 1: IP Anonymization functions correctly.');
  }

  // Test 2: Valid Multi-Tenant Payload with Project ID & Write Key
  {
    const req = {
      body: {
        projectId: 'prj_default',
        writeKey: 'pk_live_demo12345',
        elementId: 'navbar-cart-btn',
        pagePath: '/shop',
        sessionId: 'sess_sec_test_1',
      },
      headers: {
        'user-agent': 'SecureBrowser/1.0',
        'x-forwarded-for': '203.0.113.195',
        origin: 'http://localhost:3000',
      },
      cookies: {},
      socket: { remoteAddress: '127.0.0.1' },
    } as unknown as Request;

    const res = createMockResponse();
    trackClick(req, res);

    if (res.statusCode !== 204 || !res.ended) {
      throw new Error(`Test 2 Failed: Expected 204 No Content, got ${res.statusCode}`);
    }
    console.log('✓ Test 2: Multi-Tenant click with valid write key returns HTTP 204.');
  }

  // Test 3: Authenticated user tracking with JWT cookie
  {
    const testSecret = 'secret-jwt-key-dev';
    process.env.JWT_SECRET = testSecret;
    const token = jwt.sign({ userId: 88, role: 'client' }, testSecret);

    const req = {
      body: {
        projectId: 'prj_default',
        writeKey: 'pk_live_demo12345',
        elementId: 'profile-save-username',
        pagePath: '/profile',
        sessionId: 'sess_user_88',
      },
      headers: {
        'user-agent': 'SecureAuthBrowser/1.0',
        origin: 'http://localhost:3000',
      },
      cookies: { token },
      socket: { remoteAddress: '127.0.0.1' },
    } as unknown as Request;

    const res = createMockResponse();
    trackClick(req, res);

    if (res.statusCode !== 204) {
      throw new Error(`Test 3 Failed: Expected status 204 with JWT, got ${res.statusCode}`);
    }
    console.log('✓ Test 3: Authenticated JWT session tracks securely.');
  }

  await new Promise((resolve) => setTimeout(resolve, 500));
  console.log('\n🛡️ ALL MULTI-TENANT SECURITY TESTS PASSED!');
}

runSecurityTests().catch((err) => {
  console.error('❌ Security test failed:', err);
  process.exit(1);
});
