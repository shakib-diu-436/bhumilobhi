import { useState } from 'react';
import type { FormEvent } from 'react';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { api } from '../services/api';
import type { DeedVerificationResult } from '../types/api';

const MAX_FILE_BYTES = 10 * 1024 * 1024;

export default function DeedVerification() {
  const [deedId, setDeedId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<DeedVerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setResult(null);
    const normalizedDeedId = deedId.trim();
    if (!normalizedDeedId) return setError('Enter a deed identifier.');
    if (normalizedDeedId.length > 40) return setError('Deed ID must be 40 characters or fewer.');
    if (!file) return setError('Choose a file to compare.');
    if (file.size === 0) return setError('The selected file is empty.');
    if (file.size > MAX_FILE_BYTES) return setError('Files must be 10 MB or smaller.');

    setLoading(true);
    try {
      setResult(await api.verifyDeed(normalizedDeedId, file));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not compare the document digest.');
    } finally {
      setLoading(false);
    }
  }

  const resultTone = result?.status === 'MATCH' ? 'green' : result?.status === 'MISMATCH' ? 'red' : 'amber';
  return <><PageHeader eyebrow="DOCUMENT INTEGRITY / DEED WORKSPACE" title="Deed file integrity" description="Compare an uploaded document’s SHA-256 digest with the reference digest stored for a deed record." />
    <div className="notice-banner notice-warning"><div className="notice-symbol">i</div><div><strong>A digest match is not legal verification</strong><p>A matching hash establishes that file bytes match a stored reference. It does not prove who created the document, its legal validity, or its status in an official registry.</p></div><StatusBadge tone="amber">Integrity only</StatusBadge></div>
    <div className="verification-grid"><section className="panel verification-form-panel"><div className="panel-heading"><div><h2>Compare a deed file</h2><p>Uploads are hashed in memory and discarded after comparison.</p></div></div>
      <form onSubmit={verify} className="stack-form"><label htmlFor="deed-id">Deed ID</label><input id="deed-id" value={deedId} onChange={event => { setDeedId(event.target.value); setResult(null); }} placeholder="Enter a stored deed ID" maxLength={40} required />
        <label htmlFor="deed-file">Document file</label><input id="deed-file" type="file" onChange={event => { setFile(event.target.files?.[0] || null); setResult(null); }} required aria-describedby="deed-file-hint" /><div id="deed-file-hint" className="form-hint">Maximum size 10 MB. File contents are not stored.</div>
        <button className="button button-primary" type="submit" disabled={loading}>{loading ? 'Comparing digest…' : 'Compare file integrity'} <span>→</span></button>
      </form>
      {loading && <LoadingState label="Calculating SHA-256 and checking the stored reference…" />}
      {error && <ErrorState message={error} />}
      {result && <div className={`verification-result deed-result deed-result-${result.status.toLowerCase()}`} role="status"><StatusBadge tone={resultTone}>{result.status.replace('_', ' ')}</StatusBadge><h3>{result.deed_id}</h3><p>{result.message}</p><div className="deed-digest"><span>Uploaded SHA-256</span><code>{result.uploaded_sha256}</code></div>{!result.reference_available && <p className="deed-reference-note">No reference digest is stored for this deed yet. This upload was not treated as a reference or as a successful verification.</p>}</div>}
    </section>
      <section className="panel integrity-panel"><div className="integrity-illustration"><div className="integrity-ring">◇</div><span className="integrity-node node-a"/><span className="integrity-node node-b"/><span className="integrity-node node-c"/></div><div className="eyebrow">SHA-256 INTEGRITY CHECK</div><h2>Reference comparison</h2><p>The backend compares the uploaded bytes against the digest already stored with the deed record. It does not create a reference from the file being checked.</p><div className="integrity-steps"><div><span>01</span><strong>Read file bytes</strong></div><div><span>02</span><strong>Calculate digest</strong></div><div><span>03</span><strong>Compare stored value</strong></div></div></section></div>
  </>;
}
