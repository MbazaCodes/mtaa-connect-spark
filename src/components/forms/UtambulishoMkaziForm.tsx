/**
 * Utambulisho wa Mkazi — Resident Identity Form
 * Rebuilt: dropdowns, document upload, full preview, working submit
 */
import React, { useState, useRef, useCallback } from 'react';
import {
  Loader2, CheckCircle, ArrowLeft, ArrowRight, Eye, FileCheck,
  User, MapPin, Phone, Mail, Calendar, Users, Heart, Briefcase,
  FileText, Home, Zap, Droplet, Globe, AlertCircle,
  Shield, Info, CreditCard, Camera, Upload, X, Image, Check,
  BookOpen, Hash
} from 'lucide-react';
import { FormProps, labels } from './types';
import { ProgressFill } from '../ui/ProgressFill';
import { TANZANIA_ADDRESS_DATA } from '@/lib/addressData';

// ─── Constants ───────────────────────────────────────────────────────────────

const MARITAL_STATUS = [
  { label: 'Hajaoa / Hajaolewa (Single)', value: 'SINGLE' },
  { label: 'Ndoa (Married)', value: 'MARRIED' },
  { label: 'Talaka (Divorced)', value: 'DIVORCED' },
  { label: 'Mjane (Widowed)', value: 'WIDOWED' },
];

const OCCUPATIONS = [
  { label: 'Mfanyabiashara (Business Owner)', value: 'mfanyabiashara' },
  { label: 'Mwalimu (Teacher)', value: 'mwalimu' },
  { label: 'Daktari (Doctor)', value: 'daktari' },
  { label: 'Muuguzi (Nurse)', value: 'muuguzi' },
  { label: 'Mhandisi (Engineer)', value: 'mhandisi' },
  { label: 'Mwanasheria (Lawyer)', value: 'mwanasheria' },
  { label: 'Mhasibu (Accountant)', value: 'mhasibu' },
  { label: 'Askari Polisi (Police Officer)', value: 'askari_polisi' },
  { label: 'Askari Jeshi (Military Officer)', value: 'askari_jeshi' },
  { label: 'Mtumishi wa Serikali (Government Employee)', value: 'mtumishi_serikali' },
  { label: 'Mkulima (Farmer)', value: 'mkulima' },
  { label: 'Mvuvi (Fisherman)', value: 'mvuvi' },
  { label: 'Fundi / Artisan', value: 'fundi' },
  { label: 'Dereva (Driver)', value: 'dereva' },
  { label: 'Bodaboda / Bajaj Driver', value: 'bodaboda' },
  { label: 'Mchuuzi / Muuzaji (Vendor)', value: 'mchuuzi' },
  { label: 'Mama Lishe / Mama Ntilie', value: 'mama_lishe' },
  { label: 'Mtaalamu wa TEHAMA (IT Professional)', value: 'mtaalamu_ict' },
  { label: 'Mfanyakazi wa Benki (Bank Employee)', value: 'mfanyakazi_benki' },
  { label: 'Mfanyakazi wa NGO (NGO Worker)', value: 'mfanyakazi_ngo' },
  { label: 'Mwanafunzi (Student)', value: 'mwanafunzi' },
  { label: 'Mstaafu (Retired)', value: 'mstaafu' },
  { label: 'Mama wa Nyumbani (Homemaker)', value: 'mama_nyumbani' },
  { label: 'Hana Kazi (Unemployed)', value: 'hana_kazi' },
  { label: 'Nyingine (Other)', value: 'nyingine' },
];

const RESIDENCY_STATUS = [
  { label: 'Mkazi wa Kawaida (Regular Resident)', value: 'REGULAR' },
  { label: 'Mgeni (Foreigner)', value: 'FOREIGNER' },
  { label: 'Diaspora (Tanzanian Living Abroad)', value: 'DIASPORA' },
];

const OWNERSHIP_STATUS = [
  { label: 'Namiliki Nyumba (I Own the House)', value: 'OWN' },
  { label: 'Nakodi (I Rent)', value: 'RENT' },
  { label: 'Naishi na Familia (Live with Family)', value: 'FAMILY' },
  { label: 'Naishi Kwa Biashara (Business Stay)', value: 'BUSINESS' },
];

const WORK_PERMIT_OPTIONS = [
  { label: 'Ndiyo — Nina Work Permit', value: 'YES' },
  { label: 'Hapana — Sina Work Permit', value: 'NO' },
  { label: 'Sihitaji (Not Applicable)', value: 'NA' },
];

const YEARS_OPTIONS = Array.from({ length: 51 }, (_, i) => ({ label: `${i} ${i === 1 ? 'mwaka' : 'miaka'}`, value: String(i) }));
const COUNT_OPTIONS = Array.from({ length: 21 }, (_, i) => ({ label: String(i), value: String(i) }));

type Step = 'council' | 'personal' | 'residence' | 'utilities' | 'family' | 'status' | 'documents' | 'preview';

interface UploadedDoc {
  file: File;
  preview: string;
  type: 'selfie' | 'id_front' | 'id_back' | 'support';
  label: string;
}

interface FormValues {
  region: string;
  district: string;
  ward: string;
  village_street: string;
  marital_status: string;
  occupation: string;
  employer_name: string;
  neighborhood: string;
  house_number: string;
  block_number: string;
  plot_number: string;
  electricity_bill: string;
  water_bill: string;
  property_tax: string;
  family_count: string;
  dependents_count: string;
  children_count: string;
  elderly_count: string;
  residency_status: string;
  ownership_status: string;
  years_at_residence: string;
  work_permit: string;
  passport_number: string;
  country_of_origin: string;
  terms_accepted: boolean;
  data_confirmed: boolean;
}

export const UtambulishoMkaziForm: React.FC<FormProps> = ({
  onSubmit,
  isLoading,
  lang = 'sw',
  userProfile,
}) => {
  const t = labels[lang];

  const [step, setStep] = useState<Step>('council');
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues | 'selfie' | 'id_front', string>>>({});
  const [submitting, setSubmitting] = useState(false);

  const [vals, setVals] = useState<FormValues>({
    region: userProfile?.region || '',
    district: userProfile?.district || '',
    ward: userProfile?.ward || '',
    village_street: userProfile?.street || '',
    marital_status: (userProfile as any)?.marital_status || '',
    occupation: (userProfile as any)?.occupation || '',
    employer_name: '',
    neighborhood: '',
    house_number: '',
    block_number: '',
    plot_number: '',
    electricity_bill: '',
    water_bill: '',
    property_tax: '',
    family_count: '1',
    dependents_count: '0',
    children_count: '0',
    elderly_count: '0',
    residency_status: userProfile?.is_diaspora ? 'DIASPORA' : 'REGULAR',
    ownership_status: '',
    years_at_residence: '0',
    work_permit: 'NA',
    passport_number: (userProfile as any)?.passport_number || '',
    country_of_origin: (userProfile as any)?.country_of_citizenship || '',
    terms_accepted: false,
    data_confirmed: false,
  });

  const [docs, setDocs] = useState<UploadedDoc[]>([]);

  const selfieRef = useRef<HTMLInputElement>(null);
  const idFrontRef = useRef<HTMLInputElement>(null);
  const idBackRef = useRef<HTMLInputElement>(null);
  const supportRef = useRef<HTMLInputElement>(null);

  // ─── Address cascades ────────────────────────────────────────────────────
  const regions = TANZANIA_ADDRESS_DATA.map(r => r.name);
  const districts = vals.region
    ? TANZANIA_ADDRESS_DATA.find(r => r.name === vals.region)?.districts.map(d => d.name) || []
    : [];
  const wards = vals.region && vals.district
    ? TANZANIA_ADDRESS_DATA.find(r => r.name === vals.region)
        ?.districts.find(d => d.name === vals.district)?.wards || []
    : [];

  // ─── Helpers ─────────────────────────────────────────────────────────────
  const set = (key: keyof FormValues, value: string | boolean) =>
    setVals(prev => ({ ...prev, [key]: value }));

  const clearError = (key: string) =>
    setErrors(prev => { const n = { ...prev }; delete (n as any)[key]; return n; });

  const addDoc = useCallback((file: File, type: UploadedDoc['type'], label: string) => {
    const preview = URL.createObjectURL(file);
    setDocs(prev => {
      const filtered = prev.filter(d => d.type !== type || type === 'support');
      return [...filtered, { file, preview, type, label }];
    });
  }, []);

  const removeDoc = (idx: number) =>
    setDocs(prev => { URL.revokeObjectURL(prev[idx].preview); return prev.filter((_, i) => i !== idx); });

  const getDoc = (type: UploadedDoc['type']) => docs.find(d => d.type === type);

  // ─── Steps config ────────────────────────────────────────────────────────
  const STEPS: { key: Step; label: string; sw: string }[] = [
    { key: 'council',   label: 'Location',   sw: 'Eneo' },
    { key: 'personal',  label: 'Personal',   sw: 'Binafsi' },
    { key: 'residence', label: 'Residence',  sw: 'Makazi' },
    { key: 'utilities', label: 'Utilities',  sw: 'Huduma' },
    { key: 'family',    label: 'Family',     sw: 'Familia' },
    { key: 'status',    label: 'Status',     sw: 'Hadhi' },
    { key: 'documents', label: 'Documents',  sw: 'Nyaraka' },
    { key: 'preview',   label: 'Preview',    sw: 'Hakiki' },
  ];

  const stepIdx = STEPS.findIndex(s => s.key === step);
  const progress = ((stepIdx + 1) / STEPS.length) * 100;

  // ─── Validation per step ─────────────────────────────────────────────────
  const validate = (): boolean => {
    const e: typeof errors = {};

    if (step === 'council') {
      if (!vals.region) e.region = t.required;
      if (!vals.district) e.district = t.required;
      if (!vals.ward) e.ward = t.required;
      if (!vals.village_street.trim()) e.village_street = t.required;
    }
    if (step === 'personal') {
      if (!vals.marital_status) e.marital_status = t.required;
      if (!vals.occupation) e.occupation = t.required;
    }
    if (step === 'residence') {
      if (!vals.neighborhood.trim()) e.neighborhood = t.required;
      if (!vals.house_number.trim()) e.house_number = t.required;
      if (!vals.ownership_status) e.ownership_status = t.required;
    }
    if (step === 'status') {
      if (!vals.residency_status) e.residency_status = t.required;
      if (!vals.terms_accepted) e.terms_accepted = lang === 'sw' ? 'Lazima uthibitishe' : 'Required';
      if (!vals.data_confirmed) e.data_confirmed = lang === 'sw' ? 'Lazima ukubali' : 'Required';
    }
    if (step === 'documents') {
      if (!getDoc('selfie')) e.selfie = lang === 'sw' ? 'Picha ya uso inahitajika' : 'Selfie photo required';
      if (!getDoc('id_front')) e.id_front = lang === 'sw' ? 'Picha ya ID inahitajika' : 'ID photo required';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (!validate()) return;
    const next = STEPS[stepIdx + 1];
    if (next) setStep(next.key);
  };

  const handlePrev = () => {
    const prev = STEPS[stepIdx - 1];
    if (prev) setStep(prev.key);
  };

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    try {
      const files = docs.map(d => d.file);
      const payload: Record<string, unknown> = {
        ...vals,
        family_count: Number(vals.family_count),
        dependents_count: Number(vals.dependents_count),
        children_count: Number(vals.children_count),
        elderly_count: Number(vals.elderly_count),
        years_at_residence: Number(vals.years_at_residence),
        document_types: docs.map(d => d.type),
        service_name: 'Utambulisho wa Mkazi',
      };
      await onSubmit(payload, files);
    } catch (err) {
      console.error('Submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Shared styles ────────────────────────────────────────────────────────
  const input = "w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white text-sm";
  const errInput = "w-full px-4 py-3 border border-red-400 rounded-xl focus:ring-2 focus:ring-red-400 outline-none bg-red-50 text-sm";
  const lbl = "block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5";
  const section = "bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-3 rounded-xl border-l-4 border-emerald-500 mb-4";

  const Field = ({ name, label, required, children, hint }: {
    name: string; label: string; required?: boolean; children: React.ReactNode; hint?: string;
  }) => (
    <div>
      <label className={lbl}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {(errors as any)[name] && (
        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
          <AlertCircle size={11} /> {(errors as any)[name]}
        </p>
      )}
      {hint && !((errors as any)[name]) && (
        <p className="text-stone-400 text-xs mt-1">{hint}</p>
      )}
    </div>
  );

  const Select = ({ name, value, onChange, options, placeholder, required }: {
    name: string; value: string; onChange: (v: string) => void;
    options: { label: string; value: string }[]; placeholder?: string; required?: boolean;
  }) => (
    <select
      value={value}
      onChange={e => { onChange(e.target.value); clearError(name); }}
      className={(errors as any)[name] ? errInput : input}
    >
      <option value="">{placeholder || t.select}</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );

  const TextInput = ({ name, value, onChange, placeholder, type = 'text' }: {
    name: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
  }) => (
    <input
      type={type}
      value={value}
      onChange={e => { onChange(e.target.value); clearError(name); }}
      placeholder={placeholder}
      className={(errors as any)[name] ? errInput : input}
    />
  );

  // ─── Document upload box ──────────────────────────────────────────────────
  const DocBox = ({ type, label, hint, inputRef, accept = 'image/*,.pdf', multiple = false, required = false }: {
    type: UploadedDoc['type']; label: string; hint: string;
    inputRef: React.RefObject<HTMLInputElement | null>;
    accept?: string; multiple?: boolean; required?: boolean;
  }) => {
    const existing = type === 'support' ? docs.filter(d => d.type === 'support') : [getDoc(type)].filter(Boolean) as UploadedDoc[];
    const hasDoc = existing.length > 0;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      files.forEach(f => { addDoc(f, type, label); clearError(type); });
      e.target.value = '';
    };

    return (
      <div>
        <label className={lbl}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-4 cursor-pointer transition-all text-center
            ${hasDoc ? 'border-emerald-400 bg-emerald-50' : (errors as any)[type] ? 'border-red-400 bg-red-50' : 'border-stone-300 hover:border-emerald-400 hover:bg-emerald-50/40'}`}
        >
          {hasDoc ? (
            <div className="space-y-2">
              {existing.map((doc, i) => (
                <div key={i} className="flex items-center gap-3 bg-white rounded-lg p-2 shadow-sm">
                  {doc.file.type.startsWith('image/') ? (
                    <img src={doc.preview} className="w-12 h-12 object-cover rounded-lg" alt="" />
                  ) : (
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <FileText size={20} className="text-red-600" />
                    </div>
                  )}
                  <div className="flex-1 text-left">
                    <p className="text-xs font-bold text-stone-700 truncate">{doc.file.name}</p>
                    <p className="text-xs text-stone-400">{(doc.file.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); const idx = docs.findIndex(d => d === doc); removeDoc(idx); }}
                    className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <p className="text-xs text-emerald-600 font-medium mt-1">
                {multiple ? (lang === 'sw' ? 'Bonyeza kuongeza zaidi' : 'Click to add more') : (lang === 'sw' ? 'Bonyeza kubadilisha' : 'Click to change')}
              </p>
            </div>
          ) : (
            <div className="py-2">
              <Upload size={24} className="mx-auto text-stone-400 mb-2" />
              <p className="text-sm font-semibold text-stone-600">{lang === 'sw' ? 'Bonyeza kupakia' : 'Click to upload'}</p>
              <p className="text-xs text-stone-400 mt-1">{hint}</p>
            </div>
          )}
        </div>
        <input ref={inputRef} type="file" accept={accept} multiple={multiple} onChange={handleChange} className="hidden" />
        {(errors as any)[type] && (
          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
            <AlertCircle size={11} /> {(errors as any)[type]}
          </p>
        )}
      </div>
    );
  };

  // ─── Progress bar ────────────────────────────────────────────────────────
  const ProgressBar = () => (
    <div className="mb-6">
      <div className="flex justify-between mb-2">
        {STEPS.map((s, i) => (
          <div key={s.key} className={`flex flex-col items-center ${i <= stepIdx ? 'text-emerald-600' : 'text-stone-300'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all
              ${i < stepIdx ? 'bg-emerald-600 border-emerald-600 text-white'
                : i === stepIdx ? 'bg-emerald-50 border-emerald-600 text-emerald-600'
                : 'bg-stone-100 border-stone-200 text-stone-400'}`}>
              {i < stepIdx ? <Check size={14} /> : i + 1}
            </div>
          </div>
        ))}
      </div>
      <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
        <ProgressFill progress={progress} className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-500" />
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-xs text-stone-500 font-medium">
          {lang === 'sw' ? `Hatua ${stepIdx + 1} kati ya ${STEPS.length}` : `Step ${stepIdx + 1} of ${STEPS.length}`}
        </span>
        <span className="text-xs font-bold text-emerald-600">{Math.round(progress)}%</span>
      </div>
    </div>
  );

  // ─── Preview ─────────────────────────────────────────────────────────────
  const Preview = () => (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
        <Eye size={20} className="text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-amber-800 text-sm">
            {lang === 'sw' ? 'Hakiki Maombi Yako' : 'Review Your Application'}
          </p>
          <p className="text-xs text-amber-700 mt-0.5">
            {lang === 'sw' ? 'Angalia kwa makini kisha bonyeza Wasilisha.' : 'Check carefully then click Submit.'}
          </p>
        </div>
      </div>

      {/* Applicant (from profile) */}
      <Section icon={<User size={16} />} title={lang === 'sw' ? 'Taarifa za Muombaji' : 'Applicant Details'}>
        <Row label={lang === 'sw' ? 'Jina Kamili' : 'Full Name'}
          value={`${userProfile?.first_name || ''} ${userProfile?.middle_name || ''} ${userProfile?.last_name || ''}`.trim()} />
        <Row label="NIDA" value={userProfile?.nida_number || '—'} />
        <Row label={lang === 'sw' ? 'Simu' : 'Phone'} value={userProfile?.phone || '—'} />
        <Row label="Email" value={userProfile?.email || '—'} />
        <Row label={lang === 'sw' ? 'Jinsia' : 'Gender'} value={userProfile?.gender || '—'} />
        <Row label={lang === 'sw' ? 'Tarehe ya Kuzaliwa' : 'Date of Birth'}
          value={(userProfile as any)?.date_of_birth || '—'} />
      </Section>

      {/* Location */}
      <Section icon={<MapPin size={16} />} title={lang === 'sw' ? 'Eneo la Makazi' : 'Location'}>
        <Row label={lang === 'sw' ? 'Mkoa' : 'Region'} value={vals.region} />
        <Row label={lang === 'sw' ? 'Wilaya' : 'District'} value={vals.district} />
        <Row label={lang === 'sw' ? 'Kata' : 'Ward'} value={vals.ward} />
        <Row label={lang === 'sw' ? 'Kijiji/Mtaa' : 'Village/Street'} value={vals.village_street} />
      </Section>

      {/* Personal */}
      <Section icon={<Briefcase size={16} />} title={lang === 'sw' ? 'Taarifa Binafsi' : 'Personal Info'}>
        <Row label={lang === 'sw' ? 'Hali ya Ndoa' : 'Marital Status'}
          value={MARITAL_STATUS.find(m => m.value === vals.marital_status)?.label || vals.marital_status} />
        <Row label={lang === 'sw' ? 'Kazi' : 'Occupation'}
          value={OCCUPATIONS.find(o => o.value === vals.occupation)?.label || vals.occupation} />
        {vals.employer_name && <Row label={lang === 'sw' ? 'Mwajiri' : 'Employer'} value={vals.employer_name} />}
      </Section>

      {/* Residence */}
      <Section icon={<Home size={16} />} title={lang === 'sw' ? 'Makazi' : 'Residence'}>
        <Row label={lang === 'sw' ? 'Kitongoji' : 'Neighborhood'} value={vals.neighborhood} />
        <Row label={lang === 'sw' ? 'Namba ya Nyumba' : 'House No.'} value={vals.house_number} />
        {vals.plot_number && <Row label="Plot No." value={vals.plot_number} />}
        {vals.block_number && <Row label="Block" value={vals.block_number} />}
        <Row label={lang === 'sw' ? 'Umiliki' : 'Ownership'}
          value={OWNERSHIP_STATUS.find(o => o.value === vals.ownership_status)?.label || vals.ownership_status} />
        <Row label={lang === 'sw' ? 'Miaka ya Kukaa' : 'Years at Residence'} value={vals.years_at_residence} />
      </Section>

      {/* Utilities */}
      <Section icon={<Zap size={16} />} title={lang === 'sw' ? 'Huduma za Umma' : 'Utilities'}>
        <Row label={lang === 'sw' ? 'Namba ya Stima' : 'Electricity No.'} value={vals.electricity_bill || '—'} />
        <Row label={lang === 'sw' ? 'Namba ya Maji' : 'Water No.'} value={vals.water_bill || '—'} />
        <Row label={lang === 'sw' ? 'Kodi ya Nyumba' : 'Property Tax No.'} value={vals.property_tax || '—'} />
      </Section>

      {/* Family */}
      <Section icon={<Users size={16} />} title={lang === 'sw' ? 'Familia' : 'Family'}>
        <Row label={lang === 'sw' ? 'Jumla Familia' : 'Total Family'} value={vals.family_count} />
        <Row label={lang === 'sw' ? 'Wategemezi' : 'Dependents'} value={vals.dependents_count} />
        <Row label={lang === 'sw' ? 'Watoto (<18)' : 'Children (<18)'} value={vals.children_count} />
        <Row label={lang === 'sw' ? 'Wazee (>60)' : 'Elderly (>60)'} value={vals.elderly_count} />
      </Section>

      {/* Status */}
      <Section icon={<Globe size={16} />} title={lang === 'sw' ? 'Hadhi ya Ukazi' : 'Residency Status'}>
        <Row label={lang === 'sw' ? 'Hadhi' : 'Status'}
          value={RESIDENCY_STATUS.find(r => r.value === vals.residency_status)?.label || vals.residency_status} />
        <Row label="Work Permit"
          value={WORK_PERMIT_OPTIONS.find(w => w.value === vals.work_permit)?.label || '—'} />
        {vals.passport_number && <Row label={lang === 'sw' ? 'Pasipoti' : 'Passport'} value={vals.passport_number} />}
        {vals.country_of_origin && <Row label={lang === 'sw' ? 'Nchi ya Asili' : 'Country of Origin'} value={vals.country_of_origin} />}
      </Section>

      {/* Documents */}
      <Section icon={<FileText size={16} />} title={lang === 'sw' ? 'Nyaraka Zilizopakiwa' : 'Uploaded Documents'}>
        {docs.map((d, i) => (
          <div key={i} className="flex items-center gap-3 py-1.5">
            {d.file.type.startsWith('image/') ? (
              <img src={d.preview} className="w-10 h-10 object-cover rounded-lg border border-stone-200" alt="" />
            ) : (
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <FileText size={18} className="text-red-500" />
              </div>
            )}
            <div>
              <p className="text-xs font-bold text-stone-700">{d.label}</p>
              <p className="text-xs text-stone-400">{d.file.name}</p>
            </div>
            <CheckCircle size={16} className="text-emerald-500 ml-auto" />
          </div>
        ))}
      </Section>

      {/* Fee */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex justify-between items-center">
        <span className="font-bold text-emerald-800">{lang === 'sw' ? 'Ada ya Maombi:' : 'Application Fee:'}</span>
        <span className="text-xl font-black text-emerald-600">TSh 5,000</span>
      </div>
    </div>
  );

  const Section = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
    <div className="bg-white border border-stone-100 rounded-xl overflow-hidden shadow-sm">
      <div className="bg-emerald-50 px-4 py-2.5 border-b border-emerald-100 flex items-center gap-2">
        <span className="text-emerald-600">{icon}</span>
        <h4 className="font-bold text-emerald-900 text-sm">{title}</h4>
      </div>
      <div className="p-4 grid grid-cols-2 gap-x-6 gap-y-3">{children}</div>
    </div>
  );

  const Row = ({ label, value }: { label: string; value: string | number }) => (
    <>
      <p className="text-xs text-stone-500">{label}</p>
      <p className="text-xs font-bold text-stone-800 text-right">{value || '—'}</p>
    </>
  );

  // ─── Render steps ─────────────────────────────────────────────────────────

  const renderStep = () => {
    switch (step) {

      // ── STEP 1: Location ──────────────────────────────────────────────────
      case 'council':
        return (
          <div className="space-y-5">
            <div className={section}>
              <p className="font-bold text-emerald-800 text-sm flex items-center gap-2">
                <MapPin size={16} /> {lang === 'sw' ? 'ENEO LA MAKAZI' : 'RESIDENCE LOCATION'}
              </p>
              <p className="text-xs text-emerald-600 mt-0.5">
                {lang === 'sw' ? 'Chagua mkoa, wilaya, kata na mtaa wako' : 'Select your region, district, ward and street'}
              </p>
            </div>

            <Field name="region" label={lang === 'sw' ? 'Mkoa' : 'Region'} required>
              <Select name="region" value={vals.region}
                onChange={v => { set('region', v); set('district', ''); set('ward', ''); clearError('region'); }}
                options={regions.map(r => ({ label: r, value: r }))}
                placeholder={lang === 'sw' ? 'Chagua Mkoa' : 'Select Region'} />
            </Field>

            <Field name="district" label={lang === 'sw' ? 'Wilaya' : 'District'} required>
              <Select name="district" value={vals.district}
                onChange={v => { set('district', v); set('ward', ''); clearError('district'); }}
                options={districts.map(d => ({ label: d, value: d }))}
                placeholder={lang === 'sw' ? 'Chagua Wilaya' : 'Select District'} />
            </Field>

            <Field name="ward" label={lang === 'sw' ? 'Kata' : 'Ward'} required>
              <Select name="ward" value={vals.ward}
                onChange={v => { set('ward', v); clearError('ward'); }}
                options={wards.map(w => ({ label: w, value: w }))}
                placeholder={lang === 'sw' ? 'Chagua Kata' : 'Select Ward'} />
            </Field>

            <Field name="village_street" label={lang === 'sw' ? 'Kijiji / Mtaa' : 'Village / Street'} required>
              <TextInput name="village_street" value={vals.village_street}
                onChange={v => { set('village_street', v); clearError('village_street'); }}
                placeholder={lang === 'sw' ? 'Mfano: Mtaa wa Uhuru' : 'E.g. Uhuru Street'} />
            </Field>

            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex gap-2">
              <Info size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-700">
                {lang === 'sw'
                  ? 'Madhumuni ya fomu hii: KUJITAMBULISHA MKAZI — Serikali ya Mtaa'
                  : 'Purpose: RESIDENCY IDENTIFICATION — Local Government'}
              </p>
            </div>
          </div>
        );

      // ── STEP 2: Personal ─────────────────────────────────────────────────
      case 'personal':
        return (
          <div className="space-y-5">
            <div className={section}>
              <p className="font-bold text-emerald-800 text-sm flex items-center gap-2">
                <User size={16} /> {lang === 'sw' ? 'TAARIFA BINAFSI' : 'PERSONAL INFORMATION'}
              </p>
            </div>

            {/* Profile auto-fill display */}
            {userProfile && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle size={16} className="text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">
                    {lang === 'sw' ? 'Taarifa kutoka NIDA (Hazibadilishwi)' : 'From NIDA (Read-only)'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    [lang === 'sw' ? 'Jina Kamili' : 'Full Name', `${userProfile.first_name} ${userProfile.middle_name || ''} ${userProfile.last_name}`.trim()],
                    ['NIDA', userProfile.nida_number || '—'],
                    [lang === 'sw' ? 'Simu' : 'Phone', userProfile.phone || '—'],
                    ['Email', userProfile.email || '—'],
                    [lang === 'sw' ? 'Jinsia' : 'Gender', userProfile.gender || '—'],
                    [lang === 'sw' ? 'Tarehe ya Kuzaliwa' : 'DOB', (userProfile as any)?.date_of_birth || '—'],
                  ].map(([lbl, val]) => (
                    <div key={String(lbl)} className="bg-white rounded-lg px-3 py-2">
                      <p className="text-[10px] text-stone-400 uppercase tracking-wide">{lbl}</p>
                      <p className="text-xs font-bold text-stone-800">{val}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Field name="marital_status" label={lang === 'sw' ? 'Hali ya Ndoa' : 'Marital Status'} required>
              <Select name="marital_status" value={vals.marital_status}
                onChange={v => { set('marital_status', v); clearError('marital_status'); }}
                options={MARITAL_STATUS} />
            </Field>

            <Field name="occupation" label={lang === 'sw' ? 'Kazi / Shughuli' : 'Occupation'} required>
              <Select name="occupation" value={vals.occupation}
                onChange={v => { set('occupation', v); clearError('occupation'); }}
                options={OCCUPATIONS} placeholder={lang === 'sw' ? 'Chagua Kazi' : 'Select Occupation'} />
            </Field>

            <Field name="employer_name" label={lang === 'sw' ? 'Jina la Mwajiri (Hiari)' : 'Employer Name (Optional)'}>
              <TextInput name="employer_name" value={vals.employer_name}
                onChange={v => set('employer_name', v)}
                placeholder={lang === 'sw' ? 'Mfano: Serikali, Kampuni XYZ' : 'E.g. Government, Company XYZ'} />
            </Field>
          </div>
        );

      // ── STEP 3: Residence ────────────────────────────────────────────────
      case 'residence':
        return (
          <div className="space-y-5">
            <div className={section}>
              <p className="font-bold text-emerald-800 text-sm flex items-center gap-2">
                <Home size={16} /> {lang === 'sw' ? 'TAARIFA ZA MAKAZI' : 'RESIDENCE DETAILS'}
              </p>
            </div>

            <Field name="neighborhood" label={lang === 'sw' ? 'Kitongoji' : 'Neighborhood'} required>
              <TextInput name="neighborhood" value={vals.neighborhood}
                onChange={v => { set('neighborhood', v); clearError('neighborhood'); }}
                placeholder={lang === 'sw' ? 'Mfano: Upanga, Kariakoo' : 'E.g. Upanga, Kariakoo'} />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field name="house_number" label={lang === 'sw' ? 'Namba ya Nyumba' : 'House No.'} required>
                <TextInput name="house_number" value={vals.house_number}
                  onChange={v => { set('house_number', v); clearError('house_number'); }}
                  placeholder="HN 123" />
              </Field>
              <Field name="plot_number" label="Plot No.">
                <TextInput name="plot_number" value={vals.plot_number}
                  onChange={v => set('plot_number', v)} placeholder="Plot 45" />
              </Field>
            </div>

            <Field name="block_number" label={lang === 'sw' ? 'Block / Eneo' : 'Block / Area'}>
              <TextInput name="block_number" value={vals.block_number}
                onChange={v => set('block_number', v)} placeholder="Block F" />
            </Field>

            <Field name="ownership_status" label={lang === 'sw' ? 'Umiliki wa Nyumba' : 'House Ownership'} required>
              <Select name="ownership_status" value={vals.ownership_status}
                onChange={v => { set('ownership_status', v); clearError('ownership_status'); }}
                options={OWNERSHIP_STATUS} />
            </Field>

            <Field name="years_at_residence" label={lang === 'sw' ? 'Miaka ya Kukaa Hapa' : 'Years at this Residence'} required>
              <Select name="years_at_residence" value={vals.years_at_residence}
                onChange={v => set('years_at_residence', v)}
                options={YEARS_OPTIONS} />
            </Field>
          </div>
        );

      // ── STEP 4: Utilities ────────────────────────────────────────────────
      case 'utilities':
        return (
          <div className="space-y-5">
            <div className={section}>
              <p className="font-bold text-emerald-800 text-sm flex items-center gap-2">
                <Zap size={16} /> {lang === 'sw' ? 'HUDUMA NA BILI (Hiari)' : 'UTILITIES & BILLS (Optional)'}
              </p>
              <p className="text-xs text-emerald-600 mt-0.5">
                {lang === 'sw' ? 'Husaidia kuthibitisha makazi yako' : 'Helps verify your residence'}
              </p>
            </div>

            <Field name="electricity_bill" label={lang === 'sw' ? 'Namba ya Stima (TANESCO)' : 'Electricity Bill No. (TANESCO)'}
              hint={lang === 'sw' ? 'Mfano: 12345678' : 'E.g. 12345678'}>
              <div className="relative">
                <Zap size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <TextInput name="electricity_bill" value={vals.electricity_bill}
                  onChange={v => set('electricity_bill', v)} placeholder="12345678" />
              </div>
            </Field>

            <Field name="water_bill" label={lang === 'sw' ? 'Namba ya Maji (DAWASA)' : 'Water Bill No. (DAWASA)'}>
              <div className="relative">
                <Droplet size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <TextInput name="water_bill" value={vals.water_bill}
                  onChange={v => set('water_bill', v)} placeholder="87654321" />
              </div>
            </Field>

            <Field name="property_tax" label={lang === 'sw' ? 'Namba ya Kodi ya Nyumba' : 'Property Tax No.'}>
              <div className="relative">
                <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <TextInput name="property_tax" value={vals.property_tax}
                  onChange={v => set('property_tax', v)} placeholder="PT-12345" />
              </div>
            </Field>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex gap-2">
              <Shield size={16} className="text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">
                {lang === 'sw'
                  ? 'Taarifa hizi zinalindwa na hazitumiki kwa madhumuni mengine.'
                  : 'This information is protected and not used for other purposes.'}
              </p>
            </div>
          </div>
        );

      // ── STEP 5: Family ───────────────────────────────────────────────────
      case 'family':
        return (
          <div className="space-y-5">
            <div className={section}>
              <p className="font-bold text-emerald-800 text-sm flex items-center gap-2">
                <Users size={16} /> {lang === 'sw' ? 'FAMILIA NA WATEGEMEZI' : 'FAMILY AND DEPENDENTS'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field name="family_count" label={lang === 'sw' ? 'Jumla ya Wanafamilia' : 'Total Family Members'} required>
                <Select name="family_count" value={vals.family_count}
                  onChange={v => set('family_count', v)} options={COUNT_OPTIONS} />
              </Field>
              <Field name="dependents_count" label={lang === 'sw' ? 'Wategemezi' : 'Dependents'} required>
                <Select name="dependents_count" value={vals.dependents_count}
                  onChange={v => set('dependents_count', v)} options={COUNT_OPTIONS} />
              </Field>
              <Field name="children_count" label={lang === 'sw' ? 'Watoto (chini ya 18)' : 'Children (under 18)'}>
                <Select name="children_count" value={vals.children_count}
                  onChange={v => set('children_count', v)} options={COUNT_OPTIONS} />
              </Field>
              <Field name="elderly_count" label={lang === 'sw' ? 'Wazee (zaidi ya 60)' : 'Elderly (over 60)'}>
                <Select name="elderly_count" value={vals.elderly_count}
                  onChange={v => set('elderly_count', v)} options={COUNT_OPTIONS} />
              </Field>
            </div>
          </div>
        );

      // ── STEP 6: Status ───────────────────────────────────────────────────
      case 'status':
        return (
          <div className="space-y-5">
            <div className={section}>
              <p className="font-bold text-emerald-800 text-sm flex items-center gap-2">
                <Globe size={16} /> {lang === 'sw' ? 'HADHI YA UKAZI' : 'RESIDENCY STATUS'}
              </p>
            </div>

            <Field name="residency_status" label={lang === 'sw' ? 'Hadhi ya Ukazi' : 'Residency Status'} required>
              <Select name="residency_status" value={vals.residency_status}
                onChange={v => { set('residency_status', v); clearError('residency_status'); }}
                options={RESIDENCY_STATUS} />
            </Field>

            <Field name="work_permit" label="Work Permit">
              <Select name="work_permit" value={vals.work_permit}
                onChange={v => set('work_permit', v)} options={WORK_PERMIT_OPTIONS} />
            </Field>

            {(vals.residency_status === 'FOREIGNER' || vals.residency_status === 'DIASPORA') && (
              <>
                <Field name="passport_number" label={lang === 'sw' ? 'Namba ya Pasipoti' : 'Passport Number'}>
                  <TextInput name="passport_number" value={vals.passport_number}
                    onChange={v => set('passport_number', v)} placeholder="AB123456" />
                </Field>
                <Field name="country_of_origin" label={lang === 'sw' ? 'Nchi ya Asili' : 'Country of Origin'}>
                  <TextInput name="country_of_origin" value={vals.country_of_origin}
                    onChange={v => set('country_of_origin', v)} placeholder={lang === 'sw' ? 'Mfano: Kenya' : 'E.g. Kenya'} />
                </Field>
              </>
            )}

            {/* Terms */}
            <div className="space-y-3 pt-2">
              {[
                { key: 'terms_accepted' as const, sw: 'Nathibitisha kuwa taarifa nilizotoa ni sahihi na za kweli', en: 'I confirm the information provided is correct and true' },
                { key: 'data_confirmed' as const, sw: 'Nakubali kutoa taarifa hizi kwa Serikali ya Mtaa', en: 'I consent to provide this information to the Local Government' },
              ].map(item => (
                <label key={item.key} className="flex items-start gap-3 cursor-pointer bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                  <input
                    type="checkbox"
                    checked={vals[item.key]}
                    onChange={e => { set(item.key, e.target.checked); clearError(item.key); }}
                    className="w-4 h-4 mt-0.5 text-emerald-600 rounded"
                  />
                  <span className="text-xs text-emerald-800 font-medium">{lang === 'sw' ? item.sw : item.en}</span>
                </label>
              ))}
              {(errors.terms_accepted || errors.data_confirmed) && (
                <p className="text-red-500 text-xs flex items-center gap-1">
                  <AlertCircle size={11} /> {errors.terms_accepted || errors.data_confirmed}
                </p>
              )}
            </div>
          </div>
        );

      // ── STEP 7: Documents ────────────────────────────────────────────────
      case 'documents':
        return (
          <div className="space-y-5">
            <div className={section}>
              <p className="font-bold text-emerald-800 text-sm flex items-center gap-2">
                <Camera size={16} /> {lang === 'sw' ? 'PAKIA NYARAKA' : 'UPLOAD DOCUMENTS'}
              </p>
              <p className="text-xs text-emerald-600 mt-0.5">
                {lang === 'sw' ? 'Picha lazima ziwe wazi na zisomeke' : 'Photos must be clear and legible'}
              </p>
            </div>

            {/* Selfie */}
            <DocBox
              type="selfie"
              label={lang === 'sw' ? 'Picha ya Uso (Selfie)' : 'Face Photo (Selfie)'}
              hint={lang === 'sw' ? 'Picha yako wazi ukitazama kamera · JPG/PNG · Max 5MB' : 'Clear face photo looking at camera · JPG/PNG · Max 5MB'}
              inputRef={selfieRef}
              accept="image/*"
              required
            />

            {/* ID Front */}
            <DocBox
              type="id_front"
              label={lang === 'sw' ? 'Picha ya Mbele ya ID' : 'ID Front Photo'}
              hint={lang === 'sw' ? 'NIDA, Pasipoti, au Kitambulisho kingine · JPG/PNG/PDF' : 'NIDA, Passport, or other ID · JPG/PNG/PDF'}
              inputRef={idFrontRef}
              accept="image/*,.pdf"
              required
            />

            {/* ID Back */}
            <DocBox
              type="id_back"
              label={lang === 'sw' ? 'Picha ya Nyuma ya ID (Hiari)' : 'ID Back Photo (Optional)'}
              hint={lang === 'sw' ? 'Upande wa nyuma wa kitambulisho chako' : 'Back side of your ID card'}
              inputRef={idBackRef}
              accept="image/*,.pdf"
            />

            {/* Support docs */}
            <DocBox
              type="support"
              label={lang === 'sw' ? 'Nyaraka za Ziada (Hiari)' : 'Additional Documents (Optional)'}
              hint={lang === 'sw' ? 'Bili ya stima/maji, hati ya nyumba, n.k. · Max 10MB kila moja' : 'Electricity/water bill, property deed, etc. · Max 10MB each'}
              inputRef={supportRef}
              accept="image/*,.pdf"
              multiple
            />

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex gap-2">
              <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">
                {lang === 'sw'
                  ? 'Nyaraka zako zinalindwa na hazishirikishwi na mtu yeyote bila idhini yako.'
                  : 'Your documents are protected and not shared without your consent.'}
              </p>
            </div>
          </div>
        );

      // ── STEP 8: Preview ──────────────────────────────────────────────────
      case 'preview':
        return <Preview />;

      default:
        return null;
    }
  };

  // ─── Main render ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <ProgressBar />

      <div className="min-h-[300px]">
        {renderStep()}
      </div>

      {/* Navigation buttons */}
      <div className="flex gap-3 pt-4 border-t border-stone-100">
        {stepIdx > 0 && (
          <button
            type="button"
            onClick={handlePrev}
            className="flex-1 py-3.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm"
          >
            <ArrowLeft size={18} />
            {lang === 'sw' ? 'Nyuma' : 'Previous'}
          </button>
        )}

        {step !== 'preview' ? (
          <button
            type="button"
            onClick={handleNext}
            className="flex-1 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
          >
            {step === 'documents' ? (
              <><Eye size={18} /> {lang === 'sw' ? 'Hakiki Maombi' : 'Preview Application'}</>
            ) : (
              <>{lang === 'sw' ? 'Endelea' : 'Continue'} <ArrowRight size={18} /></>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFinalSubmit}
            disabled={submitting || isLoading}
            className="flex-1 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-60"
          >
            {submitting || isLoading ? (
              <><Loader2 size={18} className="animate-spin" /> {lang === 'sw' ? 'Inawasilisha...' : 'Submitting...'}</>
            ) : (
              <><FileCheck size={18} /> {lang === 'sw' ? 'Thibitisha na Wasilisha' : 'Confirm & Submit'}</>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default UtambulishoMkaziForm;
