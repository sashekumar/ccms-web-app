-- =======================================================================================
-- Seeding script for predefined Medical Questionnaire (MQ) Templates and Questions
-- Updated: March 2026 (Aligned with seed-lookup-data.sql)
-- =======================================================================================

USE db_ccms;
GO

SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET QUOTED_IDENTIFIER ON;
SET NUMERIC_ROUNDABORT OFF;
GO

PRINT 'Starting data seed for MQ Templates...';

-- Clear existing data
DELETE FROM ccms_query_template_questions;
DELETE FROM ccms_query_templates;

-- Reset Identity
DBCC CHECKIDENT ('ccms_query_template_questions', RESEED, 0);
DBCC CHECKIDENT ('ccms_query_templates', RESEED, 0);

-- Categories from seed-lookup-data.sql (MQ_CATEGORY):
-- 10: Kemasukan (Admission)
-- 20: Pebilan (Billing)
-- 30: Kemalangan (Accident)
-- 40: Dokumen (Docs)
-- 50: Klinikal (Clinical)

SET IDENTITY_INSERT ccms_query_templates ON;

-- 1. Hospital - Admission (Admission)
INSERT INTO ccms_query_templates (
    template_id, template_code, template_category, recipient_type, mode, 
    email_subject, header_message, footer_message, created_by
) VALUES (
    1, 'HOSP_ADM', 'Kemasukan (Admission)', 'HOSP', 'OL',
    'Medical Clarification Request: Admission Justification',
    'Sila berikan maklumat tambahan berikut bagi tujuan penilaian kemasukan wad (Admission Review).',
    'Sila balas dalam tempoh 24 jam. Terima kasih.',
    'SYSTEM'
);

-- 2. Hospital - Billing (Billing)
INSERT INTO ccms_query_templates (
    template_id, template_code, template_category, recipient_type, mode, 
    email_subject, header_message, footer_message, created_by
) VALUES (
    2, 'HOSP_BILL', 'Pebilan (Billing)', 'HOSP', 'OL',
    'Medical Clarification Request: Billing & Charges',
    'Kami memerlukan perincian lanjut berkenaan caj perubatan berikut bagi tujuan proses tuntutan.',
    'Sila sertakan dokumen sokongan atau inbois asal jika perlu.',
    'SYSTEM'
);

-- 3. Policy Holder - Accident (Accident)
INSERT INTO ccms_query_templates (
    template_id, template_code, template_category, recipient_type, mode, 
    email_subject, header_message, footer_message, created_by
) VALUES (
    3, 'PH_ACC', 'Kemalangan (Accident)', 'PH', 'OL',
    'Claim Inquiry: Accident Details',
    'Sila lengkapkan maklumat berkaitan kemalangan yang dialami untuk tujuan pemprosesan tuntutan.',
    'Kerjasama anda amat kami hargai.',
    'SYSTEM'
);

-- 4. Policy Holder - Docs (Docs)
INSERT INTO ccms_query_templates (
    template_id, template_code, template_category, recipient_type, mode, 
    email_subject, header_message, footer_message, created_by
) VALUES (
    4, 'PH_DOCS', 'Dokumen (Docs)', 'PH', 'OL',
    'Claim Inquiry: Missing Documents',
    'Terdapat beberapa dokumen yang diperlukan bagi melengkapkan fail tuntutan anda.',
    'Sila lampirkan dokumen tersebut melalui portal atau emel.',
    'SYSTEM'
);

-- 5. Hospital - Clinical (Clinical)
INSERT INTO ccms_query_templates (
    template_id, template_code, template_category, recipient_type, mode, 
    email_subject, header_message, footer_message, created_by
) VALUES (
    5, 'HOSP_CLIN', 'Klinikal (Clinical)', 'HOSP', 'OL',
    'Medical Clarification Request: Clinical Pathway',
    'Kami memerlukan maklumat klinikal lanjut mengenai pelan rawatan pesakit.',
    'Justifikasi perubatan diperlukan untuk penilaian lanjut.',
    'SYSTEM'
);

SET IDENTITY_INSERT ccms_query_templates OFF;


-- Seed Questions
SET IDENTITY_INSERT ccms_query_template_questions ON;

-- 1. Hospital - Admission Questions
INSERT INTO ccms_query_template_questions (question_id, template_id, question_text, required_lines, sort_order, created_by) VALUES
(1, 1, 'Sila berikan justifikasi keperluan kemasukan wad berbanding rawatan harian.', 5, 1, 'SYSTEM'),
(2, 1, 'Sila lampirkan nota kemasukan dan borang penilaian awal.', 1, 2, 'SYSTEM'),
(3, 1, 'Sila jelaskan tempoh gejala sebelum kemasukan.', 3, 3, 'SYSTEM');

-- 2. Hospital - Billing Questions
INSERT INTO ccms_query_template_questions (question_id, template_id, question_text, required_lines, sort_order, created_by) VALUES
(4, 2, 'Sila berikan perincian caj Farmasi.', 10, 1, 'SYSTEM'),
(5, 2, 'Sila berikan justifikasi kos bahan guna habis yang tinggi.', 5, 2, 'SYSTEM'),
(6, 2, 'Sila lampirkan inbois asal untuk implan.', 1, 3, 'SYSTEM');

-- 3. Policy Holder - Accident Questions
INSERT INTO ccms_query_template_questions (question_id, template_id, question_text, required_lines, sort_order, created_by) VALUES
(7, 3, 'Sila jelaskan keadaan sebenar kemalangan (Tarikh, masa, lokasi, bagaimana berlaku).', 10, 1, 'SYSTEM'),
(8, 3, 'Adakah laporan polis dibuat? Jika ya, sila lampirkan salinan.', 1, 2, 'SYSTEM'),
(9, 3, 'Adakah terdapat tuntutan lain yang difailkan kepada pihak ketiga?', 3, 3, 'SYSTEM');

-- 4. Policy Holder - Docs Questions
INSERT INTO ccms_query_template_questions (question_id, template_id, question_text, required_lines, sort_order, created_by) VALUES
(10, 4, 'Sila lampirkan salinan Kad Pengenalan (NRIC) yang jelas.', 1, 1, 'SYSTEM'),
(11, 4, 'Sila lampirkan penyata bank atau salinan muka depan buku bank untuk tujuan pembayaran.', 1, 2, 'SYSTEM'),
(12, 4, 'Sila lampirkan Laporan Perubatan yang lengkap ditandatangani oleh doktor.', 1, 3, 'SYSTEM');

-- 5. Hospital - Clinical Questions
INSERT INTO ccms_query_template_questions (question_id, template_id, question_text, required_lines, sort_order, created_by) VALUES
(13, 5, 'Sila berikan keputusan ujian diagnostik (Pathology/Radiology) yang menyokong diagnosa.', 5, 1, 'SYSTEM'),
(14, 5, 'Sila jelaskan mengapa rawatan konservatif gagal (jika berkaitan).', 5, 2, 'SYSTEM'),
(15, 5, 'Sila lampirkan nota perubatan (Progress Notes) untuk 48 jam pertama.', 1, 3, 'SYSTEM');

SET IDENTITY_INSERT ccms_query_template_questions OFF;

PRINT '✓ Seeded MQ Templates successfully (including Clinical category).';
GO
