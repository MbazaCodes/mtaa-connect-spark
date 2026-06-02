import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouterView } from '@/components/layout/AppShell';

export function Agreement() {
  const { user, refreshProfile } = useAuth();
  const { setView } = useRouterView();
  const [role, setRole] = useState<'SELLER'|'LANDLORD'>('SELLER');
  const [tin, setTin] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessDetails, setBusinessDetails] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert('Please sign in');
    setLoading(true);
    try {
      // Insert request for staff approval
      await supabase.from('agreement_requests').insert([{ 
        user_id: user.id,
        requested_role: role,
        tin,
        business_name: businessName,
        business_details: businessDetails,
        status: 'pending'
      }]);

      alert('Request submitted. Staff will review and approve.');
      // Optionally refresh profile after approval workflow
      setView('profile');
    } catch (err) {
      console.error(err);
      alert('Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4">Agreement</h1>
      <p className="text-sm text-stone-600 mb-4">Request to become a seller, landlord or other service provider. Staff will approve.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Role</label>
          <div className="flex gap-2">
            <label className="inline-flex items-center gap-2">
              <input type="radio" name="role" checked={role === 'SELLER'} onChange={() => setRole('SELLER')} /> Seller
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="radio" name="role" checked={role === 'LANDLORD'} onChange={() => setRole('LANDLORD')} /> Landlord
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">TIN</label>
          <input value={tin} onChange={(e) => setTin(e.target.value)} className="w-full input-field" placeholder="Tax Identification Number" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Business / Asset Name</label>
          <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="w-full input-field" placeholder="Business name or property title" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Details</label>
          <textarea value={businessDetails} onChange={(e) => setBusinessDetails(e.target.value)} className="w-full input-field" rows={4} placeholder="Provide business registration, location, contact details..." />
        </div>

        <div className="flex items-center gap-2">
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Submitting...' : 'Request Approval'}</button>
          <button type="button" className="btn-secondary" onClick={() => setView('dashboard')}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

export default Agreement;
