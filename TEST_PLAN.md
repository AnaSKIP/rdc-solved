# Test Plan: Document Upload → OCR → Enrichment → Validation → Transfer

## Overview

This test plan validates the complete flow of processing a claim document (e.g., a Boletim de Ocorrência) from upload through OCR extraction, data enrichment, validation, and final transfer to the Kanban board.

---

## Prerequisites

- Supabase project is running and accessible
- User is authenticated (`anamaria@rdccobrancas.com.br`)
- A real PDF document (Boletim de Ocorrência or similar) is available for testing
- Edge functions are deployed: `process-pdf`, `enrich-infocar-sci`, `processar-pdf-leads`

---

## Test Cases

### Test 1: Document Upload & Attachment Display

**Objective:** Verify that uploaded documents are stored and displayed in the case detail view.

**Steps:**

1. Navigate to the Kanban board (`/kanban`)
2. Click on any existing case card to open the case detail view
3. Scroll to the "Anexos" section (below "Dinâmica do Acidente" on the left panel)
4. Click "Anexar" and select a PDF file (e.g., a Boletim de Ocorrência)
5. Wait for the upload to complete

**Expected Results:**

- ✅ A success toast appears: "Documento(s) anexado(s)"
- ✅ The uploaded file appears in the "Anexos" list with its file name
- ✅ The file type icon is displayed (red for PDF, blue for image)
- ✅ Clicking the "eye" icon opens the FilePreviewModal
- ✅ Clicking the "download" icon downloads the file

---

### Test 2: OCR Extraction via process-pdf

**Objective:** Verify that the `process-pdf` edge function extracts structured data from a PDF.

**Steps:**

1. Open a case that has a PDF attachment
2. Click the "Enriquecer" button in the "Dados do Causador & Acidente" section
3. Observe the toast notifications during processing

**Expected Results:**

- ✅ Toast "Analisando Documentos" appears
- ✅ Toast "Ação executada: Extração de PDF" appears with extracted data
- ✅ Fields are populated: Nome Causador, CPF/CNPJ, Placa Causador, Marca/Modelo, etc.
- ✅ The "Dinâmica do Acidente" field is populated with the accident description
- ✅ If the PDF is scanned/handwritten, the response includes `needsHandwritingOcr: true`

---

### Test 3: External Enrichment (Infocar/SCI)

**Objective:** Verify that the `enrich-infocar-sci` function enriches data using the extracted placa.

**Steps:**

1. After OCR extraction (Test 2), observe the enrichment phase
2. Check if the "Consultando Bases Externas" toast appears

**Expected Results:**

- ✅ If credentials are configured: external data populates missing fields
- ✅ If credentials are not configured: a clear message indicates "Credenciais não configuradas"
- ✅ No crashes or unhandled errors

---

### Test 4: Batch Processing (5-Step Pipeline)

**Objective:** Verify that the batch processing pipeline executes all 5 steps in sequence.

**Steps:**

1. Navigate to the Intake Dashboard (`/intake`)
2. Ensure there are leads with status "AGUARDANDO PROCESSAMENTO"
3. Click "Processar N Leads (OCR + IA)"
4. Enter password to confirm
5. Observe the progress bar and step indicators

**Expected Results:**

- ✅ The 5-step indicator is displayed: Upload → OCR → Enriquecimento → Validação → Transferência
- ✅ The current step is highlighted in indigo
- ✅ Completed steps show a green checkmark (✓)
- ✅ Progress bar advances as leads are processed
- ✅ After completion, leads are removed from the Intake Dashboard
- ✅ Processed claims appear on the Kanban board

---

### Test 5: Attachments Persistence

**Objective:** Verify that attachments are correctly linked to claims after transfer.

**Steps:**

1. After batch processing (Test 4), go to the Kanban board
2. Open a newly transferred case
3. Check the "Anexos" section

**Expected Results:**

- ✅ All documents from the original lead are displayed in the "Anexos" section
- ✅ No documents are missing
- ✅ Each document is viewable and downloadable

---

### Test 6: Right-Side Panel — No Docs Tab

**Objective:** Verify that the "Docs" tab has been removed from the right-side panel.

**Steps:**

1. Open any case detail view
2. Look at the right-side panel (Chatter)

**Expected Results:**

- ✅ The tabs shown are: Notas, E-mail, WhatsApp, Atividades, Campanha IA
- ✅ There is NO "Docs" tab
- ✅ No FilePreviewModal is rendered in the right panel

---

### Test 7: Handwritten Document OCR

**Objective:** Verify handwriting OCR configuration is active.

**Steps:**

1. Upload a scanned or handwritten document (image format: JPG/PNG)
2. Trigger OCR via the "Enriquecer" button

**Expected Results:**

- ✅ The system attempts Tesseract.js OCR with `por+eng` language
- ✅ OCR configuration includes: binarization, contrast enhancement, denoising
- ✅ If Tesseract.js fails to load, the system gracefully falls back without crashing
- ✅ The response includes `ocrMethod` indicating which method was used

---

## Test Execution Log

| Test   | Date | Status     | Notes |
| ------ | ---- | ---------- | ----- |
| Test 1 |      | ⏳ Pending |       |
| Test 2 |      | ⏳ Pending |       |
| Test 3 |      | ⏳ Pending |       |
| Test 4 |      | ⏳ Pending |       |
| Test 5 |      | ⏳ Pending |       |
| Test 6 |      | ⏳ Pending |       |
| Test 7 |      | ⏳ Pending |       |

---

## Notes

- The `process-pdf` edge function uses `pdf-parse` for digital PDFs and `tesseract.js` (with `por+eng` language and handwriting preprocessing) as a fallback for scanned/image documents.
- The 5-step pipeline (Upload → OCR → Enrichment → Validation → Transfer) is implemented in `src/services/intake.ts` with individual step functions that can be called independently.
- Each step has its own error handling and returns a structured `StepResult` object.
- The step indicator is displayed in the Intake Dashboard during batch processing.
