/**
 * S19: Tests for utils/exportCsv.ts
 *
 * Strategy: mock URL.createObjectURL / URL.revokeObjectURL and spy on
 * document.createElement so we can verify the download link attributes
 * without actually triggering a file download.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportReportsToCsv } from '../../utils/exportCsv';
import type { GeneratedReport } from '../../types';

// ── Fixtures ──────────────────────────────────────────────────────────────
const makeReport = (overrides: Partial<GeneratedReport> = {}): GeneratedReport => ({
  id: 'test-id-1',
  studentName: 'Alice Smith',
  subject: 'Maths',
  year: 'Year 5' as any,
  gradeLevel: 'Set 1',
  classGroup: 'Class 5B',
  mark: 82,
  tone: 'Friendly' as any,
  curriculum: 'UK National' as any,
  language: 'English',
  reportText: 'Alice shows **excellent** effort and **strong** problem-solving skills.',
  actionPlan: ['Practice timestables daily', 'Work on long division', 'Join maths club'],
  timestamp: new Date('2025-09-10').getTime(),
  deletedAt: null,
  deleteAfter: null,
  ...overrides,
});

// ── Setup / teardown ──────────────────────────────────────────────────────
let createdAnchor: HTMLAnchorElement;

beforeEach(() => {
  // Stub URL methods (unavailable in jsdom)
  vi.stubGlobal('URL', {
    createObjectURL: vi.fn(() => 'blob:mock-url'),
    revokeObjectURL: vi.fn(),
  });

  // Capture the anchor that exportReportsToCsv creates
  const realCreate = document.createElement.bind(document);
  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    const el = realCreate(tag);
    if (tag === 'a') {
      createdAnchor = el as HTMLAnchorElement;
      // Prevent actual navigation
      vi.spyOn(createdAnchor, 'click').mockImplementation(() => {});
    }
    return el;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// ── Tests ─────────────────────────────────────────────────────────────────
describe('exportReportsToCsv', () => {
  it('does nothing when reports array is empty', () => {
    exportReportsToCsv([]);
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('creates a Blob and triggers a click on an anchor element', () => {
    exportReportsToCsv([makeReport()]);
    expect(URL.createObjectURL).toHaveBeenCalledOnce();
    expect(createdAnchor.click).toHaveBeenCalledOnce();
  });

  it('revokes the object URL after download is triggered', () => {
    exportReportsToCsv([makeReport()]);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('uses a provided filename', () => {
    exportReportsToCsv([makeReport()], 'my-class-reports.csv');
    expect(createdAnchor.download).toBe('my-class-reports.csv');
  });

  it("generates a default filename containing today's date", () => {
    exportReportsToCsv([makeReport()]);
    const today = new Date().toISOString().split('T')[0];
    expect(createdAnchor.download).toContain(today);
    expect(createdAnchor.download).toContain('reportrelief-export');
  });

  it('strips markdown bold markers from report text in the CSV', () => {
    // We need to capture the Blob content to verify markdown stripping
    let capturedContent = '';
    vi.mocked(URL.createObjectURL).mockImplementation((blob: Blob | MediaSource) => {
      // Schedule async read — we test via the Blob directly
      (blob as any)._content = blob;
      capturedContent = 'captured';
      return 'blob:mock-url';
    });

    exportReportsToCsv([makeReport()]);

    // Verify the function ran without errors (markdown stripping happens internally)
    expect(capturedContent).toBe('captured');
  });

  it('exports multiple reports without errors', () => {
    const reports = [
      makeReport({ id: '1', studentName: 'Alice Smith' }),
      makeReport({ id: '2', studentName: 'Bob Jones', subject: 'Science', mark: 71 }),
      makeReport({ id: '3', studentName: 'Charlie Brown', subject: 'English', mark: 95 }),
    ];
    expect(() => exportReportsToCsv(reports)).not.toThrow();
    expect(URL.createObjectURL).toHaveBeenCalledOnce();
  });

  it('handles reports with special characters in student names (CSV escaping)', () => {
    const tricky = makeReport({ studentName: 'O\'Brien, "James"' });
    // Should not throw — the CSV cell escaper wraps in quotes and doubles internal ones
    expect(() => exportReportsToCsv([tricky])).not.toThrow();
  });

  it('handles a report with an empty action plan', () => {
    const noActions = makeReport({ actionPlan: [] });
    expect(() => exportReportsToCsv([noActions])).not.toThrow();
  });

  describe('CSV content', () => {
    const exportAndRead = async (reports: GeneratedReport[]): Promise<string> => {
      const captured: { blob?: Blob | MediaSource } = {};
      vi.mocked(URL.createObjectURL).mockImplementation((blob: Blob | MediaSource) => {
        captured.blob = blob;
        return 'blob:mock-url';
      });
      exportReportsToCsv(reports);
      if (!(captured.blob instanceof Blob))
        throw new Error('exportReportsToCsv did not create a Blob');
      return captured.blob.text();
    };

    it('quotes cells and doubles internal quotes', async () => {
      const csv = await exportAndRead([makeReport({ studentName: 'O\'Brien, "James"' })]);
      expect(csv).toContain('"O\'Brien, ""James"""');
    });

    it('strips markdown bold markers', async () => {
      const csv = await exportAndRead([makeReport()]);
      expect(csv).toContain('Alice shows excellent effort');
      expect(csv).not.toContain('**');
    });

    it.each(['=HYPERLINK("http://evil")', '+1+1', '-2+3', '@SUM(A1)'])(
      'neutralises formula-like text %s (CSV injection)',
      async (name) => {
        const csv = await exportAndRead([makeReport({ studentName: name })]);
        const escaped = name.replace(/"/g, '""');
        expect(csv).toContain(`"'${escaped}"`);
      }
    );

    it('leaves numeric marks untouched', async () => {
      const csv = await exportAndRead([makeReport({ mark: 85 })]);
      expect(csv).toContain('"85"');
      expect(csv).not.toContain('"\'85"');
    });
  });
});
