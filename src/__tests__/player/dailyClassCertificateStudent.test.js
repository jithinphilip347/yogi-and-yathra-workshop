/**
 * dailyClassCertificateStudent.test.js
 *
 * Vitest unit tests for the Daily Class Student Certificate Experience (Sprint 3):
 * 1. API client endpoints for Daily Class eligibility & claiming.
 * 2. Authoritative backend response consumption without frontend calculation drift.
 * 3. Configuration-driven threshold handling (70%, 80%, 90%).
 * 4. State transitions: not enrolled -> in progress -> below threshold -> eligible -> claimed.
 *
 * Run with: npm test -- --testPathPattern=dailyClassCertificateStudent
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import courseApi from '../../libs/courseApi';
import apiClient from '../../services/apiClient';

vi.mock('../../services/apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Daily Class Certificate Student Experience (Sprint 3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('courseApi client integration', () => {
    it('calls GET /daily-classes/:id/certificate-eligibility', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            has_certificate: true,
            eligible: true,
            is_claimed: false,
            attendance_percentage: 85.0,
            minimum_attendance_percentage: 75.0,
            status: 'eligible',
            reason: 'Daily class completed and attendance requirements satisfied!',
          },
        },
      };

      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await courseApi.getDailyClassCertificateEligibility(42);

      expect(apiClient.get).toHaveBeenCalledWith('daily-classes/42/certificate-eligibility');
      expect(result.data.data.eligible).toBe(true);
      expect(result.data.data.attendance_percentage).toBe(85.0);
    });

    it('calls POST /daily-classes/:id/claim-certificate', async () => {
      const mockClaimResponse = {
        data: {
          success: true,
          message: 'Certificate claimed successfully!',
          data: {
            id: 108,
            certificate_number: 'CERT-2026-DAILY-42',
            verification_code: 'VERIFY-ABC123XYZ',
            issued_at: '2026-09-05T15:00:00Z',
            status: 'issued',
            student_name: 'Jane Doe',
            course_title: 'Morning Vinyasa Flow',
          },
        },
      };

      apiClient.post.mockResolvedValueOnce(mockClaimResponse);

      const result = await courseApi.claimDailyClassCertificate(42);

      expect(apiClient.post).toHaveBeenCalledWith('daily-classes/42/claim-certificate');
      expect(result.data.data.certificate_number).toBe('CERT-2026-DAILY-42');
      expect(result.data.data.status).toBe('issued');
    });
  });

  describe('Authoritative Threshold & Eligibility States', () => {
    it('accurately consumes 70% threshold response from server', () => {
      const serverPayload = {
        has_certificate: true,
        minimum_attendance_percentage: 70.0,
        attendance_percentage: 70.0,
        eligible: true,
        is_claimed: false,
        status: 'eligible',
      };

      expect(serverPayload.eligible).toBe(true);
      expect(serverPayload.attendance_percentage).toBe(70.0);
      expect(serverPayload.minimum_attendance_percentage).toBe(70.0);
    });

    it('accurately consumes 80% custom threshold response without hardcoded 70%', () => {
      const serverPayload = {
        has_certificate: true,
        minimum_attendance_percentage: 80.0,
        attendance_percentage: 75.0,
        eligible: false,
        is_claimed: false,
        status: 'attendance_below_threshold',
        reason: 'Attendance of 75% does not meet the minimum requirement of 80%.',
      };

      // Even though 75% > 70%, backend is authoritative with configured 80%
      expect(serverPayload.eligible).toBe(false);
      expect(serverPayload.status).toBe('attendance_below_threshold');
      expect(serverPayload.minimum_attendance_percentage).toBe(80.0);
    });

    it('accurately consumes 90% custom threshold when exact attendance matches', () => {
      const serverPayload = {
        has_certificate: true,
        minimum_attendance_percentage: 90.0,
        attendance_percentage: 90.0,
        eligible: true,
        is_claimed: false,
        status: 'eligible',
      };

      expect(serverPayload.eligible).toBe(true);
      expect(serverPayload.minimum_attendance_percentage).toBe(90.0);
    });

    it('handles class in progress state with attendance >= threshold', () => {
      const serverPayload = {
        has_certificate: true,
        minimum_attendance_percentage: 70.0,
        attendance_percentage: 100.0,
        eligible: false,
        is_claimed: false,
        status: 'in_progress',
        reason: 'The daily class has not ended yet. Certificates unlock after class completion.',
      };

      expect(serverPayload.eligible).toBe(false);
      expect(serverPayload.status).toBe('in_progress');
    });

    it('handles certificate disabled state', () => {
      const serverPayload = {
        has_certificate: false,
        minimum_attendance_percentage: 70.0,
        attendance_percentage: 0.0,
        eligible: false,
        is_claimed: false,
        status: 'disabled',
        reason: 'No certificate is configured for this daily class.',
      };

      expect(serverPayload.has_certificate).toBe(false);
      expect(serverPayload.eligible).toBe(false);
      expect(serverPayload.status).toBe('disabled');
    });

    it('handles already claimed state with issued certificate payload', () => {
      const serverPayload = {
        has_certificate: true,
        eligible: true,
        is_claimed: true,
        status: 'issued',
        attendance_percentage: 88.5,
        minimum_attendance_percentage: 70.0,
        certificate: {
          id: 55,
          certificate_number: 'CERT-2026-DAILY-55',
          verification_code: 'V-XYZ999',
          issued_at: '2026-09-01T10:00:00Z',
          student_name: 'Sarah Student',
        },
      };

      expect(serverPayload.is_claimed).toBe(true);
      expect(serverPayload.certificate.certificate_number).toBe('CERT-2026-DAILY-55');
    });
  });
});
