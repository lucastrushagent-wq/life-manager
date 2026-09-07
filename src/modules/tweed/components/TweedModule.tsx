import { useEffect, useState } from 'react'
import {
  Plus, X, Pencil, Trash2, AlertTriangle, Clock, Phone, Stethoscope,
  ShieldCheck, PawPrint, Save, ExternalLink, CalendarClock, Pill,
} from 'lucide-react'
import { PhilosophyBox } from '../../../core/PhilosophyBox'
import { useTweed, formatAge, daysUntil } from '../hooks/useTweed'
import { SCHEDULE_ACTIVITIES, MEDICAL_TYPES, CLAIM_STATUSES } from '../schema'
import type {
  TweedProfile, TweedInsurance, TweedMedicalRecord,
  ScheduleActivity, MedicalType, ClaimStatus,
} from '../types'

type View = 'day_to_day' | 'vet'

const ACTIVITY_ICONS: Record<ScheduleActivity, string> = {
  meal: '🍽️', walk: '🦮', medication: '💊', play: '🎾',
  toilet: '🚽', grooming: '🛁', bedtime: '🌙', other: '•',
}

const CLAIM_LABELS: Record<ClaimStatus, string> = {
  not_claimable: 'Not claimable',
  not_submitted: 'Not submitted',
  submitted: 'Submitted',
  paid: 'Paid',
  rejected: 'Rejected',
}

const CLAIM_COLORS: Record<ClaimStatus, string> = {
  not_claimable: 'bg-gray-100 text-gray-500',
  not_submitted: 'bg-amber-100 text-amber-700',
  submitted: 'bg-blue-100 text-blue-700',
  paid: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-600',
}

const money = (n: number) =>
  new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(n)

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ')

const input = 'text-sm border border-gray-200 rounded px-3 py-2 outline-none focus:border-blue-400 w-full'
const label = 'text-xs text-gray-500 block mb-1'

/** A titled block of care instructions — omitted entirely when empty. */
function CareSection({ title, value, icon }: { title: string; value?: string; icon?: React.ReactNode }) {
  if (!value) return null
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon}
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</h3>
      </div>
      <p className="text-sm text-gray-700 whitespace-pre-wrap">{value}</p>
    </div>
  )
}

export function TweedModule() {
  const {
    profile, schedule, medical, insurance, summary, loading,
    unsubmittedClaims, upcomingFollowUps,
    saveProfile, createScheduleItem, updateScheduleItem, removeScheduleItem,
    createMedical, updateMedical, removeMedical, saveInsurance,
  } = useTweed()

  const [view, setView] = useState<View>('day_to_day')
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState<TweedProfile>({ desexed: false })
  const [editingInsurance, setEditingInsurance] = useState(false)
  const [insuranceForm, setInsuranceForm] = useState<TweedInsurance>({})
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null)
  const [scheduleForm, setScheduleForm] = useState({ time: '08:00', activity: 'meal' as ScheduleActivity, title: '', details: '' })

  const [showMedicalForm, setShowMedicalForm] = useState(false)
  const [editingMedicalId, setEditingMedicalId] = useState<string | null>(null)
  const [medicalForm, setMedicalForm] = useState({
    date: new Date().toISOString().slice(0, 10), type: 'checkup' as MedicalType, title: '',
    description: '', vet: '', cost: '', followUpDate: '',
    claimStatus: 'not_submitted' as ClaimStatus, amountClaimed: '', amountReimbursed: '',
    claimSubmittedDate: '', claimNotes: '', notes: '',
  })

  useEffect(() => { setProfileForm(profile) }, [profile])
  useEffect(() => { setInsuranceForm(insurance) }, [insurance])

  const p = (patch: Partial<TweedProfile>) => setProfileForm(f => ({ ...f, ...patch }))
  const i = (patch: Partial<TweedInsurance>) => setInsuranceForm(f => ({ ...f, ...patch }))

  async function handleSaveProfile() {
    await saveProfile(profileForm)
    setEditingProfile(false)
  }

  async function handleSaveInsurance() {
    await saveInsurance(insuranceForm)
    setEditingInsurance(false)
  }

  function resetScheduleForm() {
    setScheduleForm({ time: '08:00', activity: 'meal', title: '', details: '' })
    setEditingScheduleId(null)
    setShowScheduleForm(false)
  }

  async function handleSaveSchedule() {
    if (!scheduleForm.title.trim() || !scheduleForm.time) return
    const payload = {
      time: scheduleForm.time,
      activity: scheduleForm.activity,
      title: scheduleForm.title.trim(),
      details: scheduleForm.details.trim() || undefined,
    }
    if (editingScheduleId) await updateScheduleItem(editingScheduleId, payload)
    else await createScheduleItem(payload)
    resetScheduleForm()
  }

  function resetMedicalForm() {
    setMedicalForm({
      date: new Date().toISOString().slice(0, 10), type: 'checkup', title: '',
      description: '', vet: '', cost: '', followUpDate: '',
      claimStatus: 'not_submitted', amountClaimed: '', amountReimbursed: '',
      claimSubmittedDate: '', claimNotes: '', notes: '',
    })
    setEditingMedicalId(null)
    setShowMedicalForm(false)
  }

  function startEditMedical(m: TweedMedicalRecord) {
    setMedicalForm({
      date: m.date, type: m.type, title: m.title,
      description: m.description ?? '', vet: m.vet ?? '',
      cost: m.cost != null ? String(m.cost) : '',
      followUpDate: m.followUpDate ?? '',
      claimStatus: m.claimStatus,
      amountClaimed: m.amountClaimed != null ? String(m.amountClaimed) : '',
      amountReimbursed: m.amountReimbursed != null ? String(m.amountReimbursed) : '',
      claimSubmittedDate: m.claimSubmittedDate ?? '',
      claimNotes: m.claimNotes ?? '', notes: m.notes ?? '',
    })
    setEditingMedicalId(m.id)
    setShowMedicalForm(true)
  }

  async function handleSaveMedical() {
    if (!medicalForm.title.trim() || !medicalForm.date) return
    const payload = {
      date: medicalForm.date,
      type: medicalForm.type,
      title: medicalForm.title.trim(),
      description: medicalForm.description.trim() || undefined,
      vet: medicalForm.vet.trim() || undefined,
      cost: medicalForm.cost ? Number(medicalForm.cost) : undefined,
      followUpDate: medicalForm.followUpDate || undefined,
      claimStatus: medicalForm.claimStatus,
      amountClaimed: medicalForm.amountClaimed ? Number(medicalForm.amountClaimed) : undefined,
      amountReimbursed: medicalForm.amountReimbursed ? Number(medicalForm.amountReimbursed) : undefined,
      claimSubmittedDate: medicalForm.claimSubmittedDate || undefined,
      claimNotes: medicalForm.claimNotes.trim() || undefined,
      notes: medicalForm.notes.trim() || undefined,
    }
    if (editingMedicalId) await updateMedical(editingMedicalId, payload)
    else await createMedical(payload)
    resetMedicalForm()
  }

  const age = formatAge(profile.dateOfBirth)
  const renewalDays = daysUntil(insurance.renewalDate)

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 sm:py-8">
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-2">
          <PawPrint className="w-5 h-5 text-amber-600" />
          <h1 className="text-xl font-semibold text-gray-900">Tweed</h1>
          {age && <span className="text-sm text-gray-400">{age}</span>}
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex rounded-md border border-gray-200 overflow-hidden text-sm mb-4 sm:w-fit">
        <button
          onClick={() => setView('day_to_day')}
          className={`flex-1 sm:flex-none px-3 py-2.5 sm:py-1.5 flex items-center justify-center gap-1.5 ${view === 'day_to_day' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
        >
          <Clock className="w-3.5 h-3.5" /> Day-to-day
        </button>
        <button
          onClick={() => setView('vet')}
          className={`flex-1 sm:flex-none px-3 py-2.5 sm:py-1.5 border-l border-gray-200 flex items-center justify-center gap-1.5 ${view === 'vet' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
        >
          <Stethoscope className="w-3.5 h-3.5" /> Vet &amp; Insurance
          {medical.length > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${view === 'vet' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
              {medical.length}
            </span>
          )}
        </button>
      </div>

      <PhilosophyBox moduleId="tweed" />

      {loading && <p className="text-sm text-gray-400 text-center py-8">Loading…</p>}

      {/* ══ Day-to-day ══ */}
      {view === 'day_to_day' && !loading && (
        <>
          {/* Allergies — deliberately the loudest thing on the page */}
          {profile.allergies && (
            <div className="mb-4 rounded-lg border-2 border-red-300 bg-red-50 px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span className="text-sm font-bold text-red-800 uppercase tracking-wide">Allergies — do not feed</span>
              </div>
              <p className="text-sm text-red-900 font-medium whitespace-pre-wrap">{profile.allergies}</p>
            </div>
          )}

          {profile.currentMedications && (
            <div className="mb-4 rounded-lg border border-violet-200 bg-violet-50 px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <Pill className="w-4 h-4 text-violet-500" />
                <span className="text-sm font-semibold text-violet-800">Current medication</span>
              </div>
              <p className="text-sm text-violet-900 whitespace-pre-wrap">{profile.currentMedications}</p>
            </div>
          )}

          {/* Daily schedule */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Daily schedule</h2>
              {!showScheduleForm && (
                <button onClick={() => setShowScheduleForm(true)}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium">
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              )}
            </div>

            {showScheduleForm && (
              <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                  <div>
                    <label className={label}>Time</label>
                    <input type="time" className={input} value={scheduleForm.time}
                      onChange={e => setScheduleForm(f => ({ ...f, time: e.target.value }))} />
                  </div>
                  <div>
                    <label className={label}>Activity</label>
                    <select className={`${input} bg-white`} value={scheduleForm.activity}
                      onChange={e => setScheduleForm(f => ({ ...f, activity: e.target.value as ScheduleActivity }))}>
                      {SCHEDULE_ACTIVITIES.map(a => <option key={a} value={a}>{cap(a)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={label}>What</label>
                    <input className={input} placeholder="e.g. Breakfast" value={scheduleForm.title} autoFocus
                      onChange={e => setScheduleForm(f => ({ ...f, title: e.target.value }))} />
                  </div>
                  <input className={`${input} sm:col-span-3`} placeholder="Details — amount, route, anything the sitter needs"
                    value={scheduleForm.details}
                    onChange={e => setScheduleForm(f => ({ ...f, details: e.target.value }))} />
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={resetScheduleForm} className="text-xs px-3 py-1.5 text-gray-500 hover:text-gray-700">Cancel</button>
                  <button onClick={handleSaveSchedule} disabled={!scheduleForm.title.trim()}
                    className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-40">
                    {editingScheduleId ? 'Save' : 'Add to schedule'}
                  </button>
                </div>
              </div>
            )}

            {schedule.length === 0 && !showScheduleForm ? (
              <p className="text-sm text-gray-400 text-center py-8 rounded-lg border border-dashed border-gray-200">
                No schedule yet. Add his meals, walks and bedtime.
              </p>
            ) : (
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                {schedule.map((item, idx) => (
                  <div key={item.id}
                    className={`flex items-start gap-3 px-4 py-3 bg-white group ${idx < schedule.length - 1 ? 'border-b border-gray-100' : ''}`}>
                    <span className="text-sm font-mono font-medium text-gray-700 w-14 shrink-0 pt-0.5">{item.time}</span>
                    <span className="text-base shrink-0" aria-hidden>{ACTIVITY_ICONS[item.activity]}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800">{item.title}</div>
                      {item.details && <div className="text-xs text-gray-500 mt-0.5 whitespace-pre-wrap">{item.details}</div>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setScheduleForm({ time: item.time, activity: item.activity, title: item.title, details: item.details ?? '' })
                          setEditingScheduleId(item.id); setShowScheduleForm(true)
                        }}
                        className="p-1.5 rounded-md text-gray-300 hover:text-blue-500 hover:bg-blue-50">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {confirmDelete === item.id ? (
                        <span className="flex items-center gap-1 text-xs">
                          <button onClick={() => { removeScheduleItem(item.id); setConfirmDelete(null) }}
                            className="text-red-500 hover:text-red-700 font-medium">Yes</button>
                          <button onClick={() => setConfirmDelete(null)} className="text-gray-400">No</button>
                        </span>
                      ) : (
                        <button onClick={() => setConfirmDelete(item.id)}
                          className="p-1.5 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Care profile */}
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Care notes</h2>
            <button onClick={() => setEditingProfile(!editingProfile)}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium">
              {editingProfile ? <><X className="w-3.5 h-3.5" /> Cancel</> : <><Pencil className="w-3.5 h-3.5" /> Edit</>}
            </button>
          </div>

          {editingProfile ? (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div><label className={label}>Breed</label>
                  <input className={input} value={profileForm.breed ?? ''} onChange={e => p({ breed: e.target.value })} /></div>
                <div><label className={label}>Date of birth</label>
                  <input type="date" className={input} value={profileForm.dateOfBirth ?? ''} onChange={e => p({ dateOfBirth: e.target.value })} /></div>
                <div><label className={label}>Weight (kg)</label>
                  <input type="number" step="0.1" className={input} value={profileForm.weightKg ?? ''}
                    onChange={e => p({ weightKg: e.target.value === '' ? undefined : Number(e.target.value) })} /></div>
                <div><label className={label}>Colour</label>
                  <input className={input} value={profileForm.colour ?? ''} onChange={e => p({ colour: e.target.value })} /></div>
                <div><label className={label}>Microchip number</label>
                  <input className={input} value={profileForm.microchipNumber ?? ''} onChange={e => p({ microchipNumber: e.target.value })} /></div>
                <label className="flex items-end gap-2 cursor-pointer pb-2">
                  <input type="checkbox" className="rounded" checked={profileForm.desexed ?? false}
                    onChange={e => p({ desexed: e.target.checked })} />
                  <span className="text-sm text-gray-700">Desexed</span>
                </label>
              </div>

              <div>
                <label className={`${label} text-red-600 font-semibold`}>Allergies — anything he must not have</label>
                <textarea rows={2} className={`${input} resize-none border-red-200`} value={profileForm.allergies ?? ''}
                  onChange={e => p({ allergies: e.target.value })} placeholder="e.g. chicken, grain-based treats" />
              </div>
              <div>
                <label className={label}>Current medication</label>
                <textarea rows={2} className={`${input} resize-none`} value={profileForm.currentMedications ?? ''}
                  onChange={e => p({ currentMedications: e.target.value })} placeholder="Name, dose, when to give it" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div><label className={label}>Food brand</label>
                  <input className={input} value={profileForm.foodBrand ?? ''} onChange={e => p({ foodBrand: e.target.value })} /></div>
                <div><label className={label}>Amount per meal</label>
                  <input className={input} placeholder="e.g. 1 cup" value={profileForm.foodAmount ?? ''} onChange={e => p({ foodAmount: e.target.value })} /></div>
                <div><label className={label}>Where food is kept</label>
                  <input className={input} value={profileForm.foodLocation ?? ''} onChange={e => p({ foodLocation: e.target.value })} /></div>
              </div>
              <div>
                <label className={label}>Feeding notes</label>
                <textarea rows={2} className={`${input} resize-none`} value={profileForm.feedingNotes ?? ''} onChange={e => p({ feedingNotes: e.target.value })} />
              </div>
              <div>
                <label className={label}>Treats — what's allowed and how many</label>
                <textarea rows={2} className={`${input} resize-none`} value={profileForm.treats ?? ''} onChange={e => p({ treats: e.target.value })} />
              </div>
              <div>
                <label className={label}>Toys — favourites, and which are safe unsupervised</label>
                <textarea rows={2} className={`${input} resize-none`} value={profileForm.toys ?? ''} onChange={e => p({ toys: e.target.value })} />
              </div>
              <div>
                <label className={label}>Walk routine</label>
                <textarea rows={2} className={`${input} resize-none`} value={profileForm.walkRoutine ?? ''} onChange={e => p({ walkRoutine: e.target.value })}
                  placeholder="How long, where, leash or off-leash, where the harness lives" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div><label className={label}>Toilet routine</label>
                  <textarea rows={2} className={`${input} resize-none`} value={profileForm.toiletRoutine ?? ''} onChange={e => p({ toiletRoutine: e.target.value })}
                    placeholder="How he signals he needs to go" /></div>
                <div><label className={label}>Sleep routine</label>
                  <textarea rows={2} className={`${input} resize-none`} value={profileForm.sleepRoutine ?? ''} onChange={e => p({ sleepRoutine: e.target.value })}
                    placeholder="Where he sleeps, bedtime" /></div>
              </div>
              <div>
                <label className={label}>Behaviour — fears, triggers, quirks</label>
                <textarea rows={2} className={`${input} resize-none`} value={profileForm.behaviourNotes ?? ''} onChange={e => p({ behaviourNotes: e.target.value })}
                  placeholder="e.g. scared of thunderstorms and the vacuum" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div><label className={label}>Commands he knows</label>
                  <textarea rows={2} className={`${input} resize-none`} value={profileForm.commands ?? ''} onChange={e => p({ commands: e.target.value })} /></div>
                <div><label className={label}>House rules</label>
                  <textarea rows={2} className={`${input} resize-none`} value={profileForm.houseRules ?? ''} onChange={e => p({ houseRules: e.target.value })}
                    placeholder="e.g. not allowed on the couch" /></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div><label className={label}>Emergency contact</label>
                  <input className={input} value={profileForm.emergencyContactName ?? ''} onChange={e => p({ emergencyContactName: e.target.value })} /></div>
                <div><label className={label}>Emergency phone</label>
                  <input className={input} value={profileForm.emergencyContactPhone ?? ''} onChange={e => p({ emergencyContactPhone: e.target.value })} /></div>
                <div><label className={label}>Vet</label>
                  <input className={input} value={profileForm.vetName ?? ''} onChange={e => p({ vetName: e.target.value })} /></div>
                <div><label className={label}>Vet phone</label>
                  <input className={input} value={profileForm.vetPhone ?? ''} onChange={e => p({ vetPhone: e.target.value })} /></div>
                <div className="sm:col-span-2"><label className={label}>Vet address</label>
                  <input className={input} value={profileForm.vetAddress ?? ''} onChange={e => p({ vetAddress: e.target.value })} /></div>
                <div><label className={label}>After-hours vet</label>
                  <input className={input} value={profileForm.afterHoursVetName ?? ''} onChange={e => p({ afterHoursVetName: e.target.value })} /></div>
                <div><label className={label}>After-hours phone</label>
                  <input className={input} value={profileForm.afterHoursVetPhone ?? ''} onChange={e => p({ afterHoursVetPhone: e.target.value })} /></div>
              </div>

              <div className="flex justify-end">
                <button onClick={handleSaveProfile}
                  className="flex items-center gap-1.5 text-sm px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  <Save className="w-3.5 h-3.5" /> Save care notes
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {(profile.foodBrand || profile.foodAmount || profile.feedingNotes || profile.foodLocation) && (
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">Food</h3>
                  <div className="text-sm text-gray-700 space-y-0.5">
                    {profile.foodBrand && <div><span className="text-gray-400">Brand:</span> {profile.foodBrand}</div>}
                    {profile.foodAmount && <div><span className="text-gray-400">Amount:</span> {profile.foodAmount}</div>}
                    {profile.foodLocation && <div><span className="text-gray-400">Kept in:</span> {profile.foodLocation}</div>}
                    {profile.feedingNotes && <div className="whitespace-pre-wrap mt-1">{profile.feedingNotes}</div>}
                  </div>
                </div>
              )}
              <CareSection title="Treats" value={profile.treats} />
              <CareSection title="Toys" value={profile.toys} />
              <CareSection title="Walks" value={profile.walkRoutine} />
              <CareSection title="Toilet" value={profile.toiletRoutine} />
              <CareSection title="Sleep" value={profile.sleepRoutine} />
              <CareSection title="Behaviour" value={profile.behaviourNotes} />
              <CareSection title="Commands" value={profile.commands} />
              <CareSection title="House rules" value={profile.houseRules} />

              {(profile.vetName || profile.emergencyContactName || profile.afterHoursVetName) && (
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Emergency contacts</h3>
                  <div className="space-y-1.5 text-sm">
                    {profile.emergencyContactName && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-gray-700">{profile.emergencyContactName}</span>
                        {profile.emergencyContactPhone && (
                          <a href={`tel:${profile.emergencyContactPhone}`} className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs">
                            <Phone className="w-3 h-3" />{profile.emergencyContactPhone}
                          </a>
                        )}
                      </div>
                    )}
                    {profile.vetName && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-gray-700">{profile.vetName} <span className="text-gray-400 text-xs">vet</span></span>
                        {profile.vetPhone && (
                          <a href={`tel:${profile.vetPhone}`} className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs">
                            <Phone className="w-3 h-3" />{profile.vetPhone}
                          </a>
                        )}
                      </div>
                    )}
                    {profile.vetAddress && <div className="text-xs text-gray-400">{profile.vetAddress}</div>}
                    {profile.afterHoursVetName && (
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100">
                        <span className="text-gray-700">{profile.afterHoursVetName} <span className="text-red-500 text-xs font-medium">after hours</span></span>
                        {profile.afterHoursVetPhone && (
                          <a href={`tel:${profile.afterHoursVetPhone}`} className="flex items-center gap-1 text-red-600 hover:text-red-800 text-xs font-medium">
                            <Phone className="w-3 h-3" />{profile.afterHoursVetPhone}
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {profile.microchipNumber && (
                <p className="text-xs text-gray-400 px-1">Microchip {profile.microchipNumber}</p>
              )}
            </div>
          )}
        </>
      )}

      {/* ══ Vet & Insurance ══ */}
      {view === 'vet' && !loading && (
        <>
          {/* Claim totals */}
          {summary && summary.totalCost > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Vet spend</p>
                <p className="text-xl font-bold text-gray-900">{money(summary.totalCost)}</p>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                <p className="text-xs text-emerald-700 uppercase tracking-wide mb-1">Reimbursed</p>
                <p className="text-xl font-bold text-emerald-800">{money(summary.totalReimbursed)}</p>
              </div>
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                <p className="text-xs text-blue-700 uppercase tracking-wide mb-1">Awaiting payout</p>
                <p className="text-xl font-bold text-blue-800">{money(summary.outstanding)}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Net cost</p>
                <p className="text-xl font-bold text-gray-900">{money(summary.netCost)}</p>
              </div>
            </div>
          )}

          {/* Nudges */}
          {(unsubmittedClaims.length > 0 || upcomingFollowUps.length > 0) && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 space-y-1">
              {unsubmittedClaims.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  {unsubmittedClaims.length} visit{unsubmittedClaims.length !== 1 ? 's' : ''} not yet claimed
                  <span className="text-amber-600 ml-auto font-medium">
                    {money(summary?.unclaimed ?? 0)}
                  </span>
                </div>
              )}
              {upcomingFollowUps.map(({ record, days }) => (
                <div key={record.id} className="flex items-center gap-2 text-sm text-amber-800">
                  <CalendarClock className="w-4 h-4 text-amber-500 shrink-0" />
                  Follow-up: {record.title}
                  <span className={`ml-auto text-xs ${days < 0 ? 'text-red-500 font-medium' : 'text-amber-600'}`}>
                    {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'today' : `in ${days}d`}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Policy */}
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Insurance policy</h2>
            <button onClick={() => setEditingInsurance(!editingInsurance)}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium">
              {editingInsurance ? <><X className="w-3.5 h-3.5" /> Cancel</> : <><Pencil className="w-3.5 h-3.5" /> Edit</>}
            </button>
          </div>

          {editingInsurance ? (
            <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div><label className={label}>Provider</label>
                  <input className={input} value={insuranceForm.provider ?? ''} onChange={e => i({ provider: e.target.value })} /></div>
                <div><label className={label}>Policy number</label>
                  <input className={input} value={insuranceForm.policyNumber ?? ''} onChange={e => i({ policyNumber: e.target.value })} /></div>
                <div><label className={label}>Annual premium ($)</label>
                  <input type="number" className={input} value={insuranceForm.annualPremium ?? ''}
                    onChange={e => i({ annualPremium: e.target.value === '' ? undefined : Number(e.target.value) })} /></div>
                <div><label className={label}>Excess ($)</label>
                  <input type="number" className={input} value={insuranceForm.excess ?? ''}
                    onChange={e => i({ excess: e.target.value === '' ? undefined : Number(e.target.value) })} /></div>
                <div><label className={label}>Reimbursement rate (%)</label>
                  <input type="number" min={0} max={100} className={input} value={insuranceForm.reimbursementRate ?? ''}
                    onChange={e => i({ reimbursementRate: e.target.value === '' ? undefined : Number(e.target.value) })} /></div>
                <div><label className={label}>Annual limit ($)</label>
                  <input type="number" className={input} value={insuranceForm.annualLimit ?? ''}
                    onChange={e => i({ annualLimit: e.target.value === '' ? undefined : Number(e.target.value) })} /></div>
                <div><label className={label}>Renewal date</label>
                  <input type="date" className={input} value={insuranceForm.renewalDate ?? ''} onChange={e => i({ renewalDate: e.target.value })} /></div>
                <div><label className={label}>Contact phone</label>
                  <input className={input} value={insuranceForm.contactPhone ?? ''} onChange={e => i({ contactPhone: e.target.value })} /></div>
                <div className="sm:col-span-2"><label className={label}>Claims portal URL</label>
                  <input className={input} value={insuranceForm.portalUrl ?? ''} onChange={e => i({ portalUrl: e.target.value })} /></div>
                <div className="sm:col-span-2"><label className={label}>Coverage notes</label>
                  <textarea rows={2} className={`${input} resize-none`} value={insuranceForm.coverageNotes ?? ''}
                    onChange={e => i({ coverageNotes: e.target.value })} placeholder="What's covered, waiting periods, exclusions" /></div>
              </div>
              <div className="flex justify-end mt-3">
                <button onClick={handleSaveInsurance}
                  className="flex items-center gap-1.5 text-sm px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  <Save className="w-3.5 h-3.5" /> Save policy
                </button>
              </div>
            </div>
          ) : insurance.provider ? (
            <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-semibold text-gray-800">{insurance.provider}</span>
                    {insurance.policyNumber && <span className="text-xs font-mono text-gray-400">{insurance.policyNumber}</span>}
                    {renewalDays !== null && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        renewalDays < 0 ? 'bg-red-50 text-red-600'
                          : renewalDays <= 30 ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {renewalDays < 0 ? 'Renewal overdue' : `Renews in ${renewalDays}d`}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500">
                    {insurance.reimbursementRate != null && <span><span className="text-gray-400">Rate</span> {insurance.reimbursementRate}%</span>}
                    {insurance.excess != null && <span><span className="text-gray-400">Excess</span> {money(insurance.excess)}</span>}
                    {insurance.annualLimit != null && <span><span className="text-gray-400">Limit</span> {money(insurance.annualLimit)}</span>}
                    {insurance.annualPremium != null && <span><span className="text-gray-400">Premium</span> {money(insurance.annualPremium)}/yr</span>}
                  </div>
                  {insurance.coverageNotes && <p className="text-xs text-gray-500 italic mt-2 whitespace-pre-wrap">{insurance.coverageNotes}</p>}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {insurance.portalUrl && (
                    <a href={insurance.portalUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                      Claims <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {insurance.contactPhone && (
                    <a href={`tel:${insurance.contactPhone}`} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
                      <Phone className="w-3 h-3" />{insurance.contactPhone}
                    </a>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="mb-6 text-sm text-gray-400 text-center py-6 rounded-lg border border-dashed border-gray-200">
              No policy recorded yet.
            </p>
          )}

          {/* Medical history */}
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Medical history</h2>
            {!showMedicalForm && (
              <button onClick={() => setShowMedicalForm(true)}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium">
                <Plus className="w-3.5 h-3.5" /> Add record
              </button>
            )}
          </div>

          {showMedicalForm && (
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div><label className={label}>Date</label>
                  <input type="date" className={input} value={medicalForm.date}
                    onChange={e => setMedicalForm(f => ({ ...f, date: e.target.value }))} /></div>
                <div><label className={label}>Type</label>
                  <select className={`${input} bg-white`} value={medicalForm.type}
                    onChange={e => setMedicalForm(f => ({ ...f, type: e.target.value as MedicalType }))}>
                    {MEDICAL_TYPES.map(t => <option key={t} value={t}>{cap(t)}</option>)}
                  </select></div>
                <input className={`${input} sm:col-span-2`} placeholder="What happened *" value={medicalForm.title} autoFocus
                  onChange={e => setMedicalForm(f => ({ ...f, title: e.target.value }))} />
                <input className={`${input} sm:col-span-2`} placeholder="Description" value={medicalForm.description}
                  onChange={e => setMedicalForm(f => ({ ...f, description: e.target.value }))} />
                <div><label className={label}>Vet / clinic</label>
                  <input className={input} value={medicalForm.vet} onChange={e => setMedicalForm(f => ({ ...f, vet: e.target.value }))} /></div>
                <div><label className={label}>Cost ($)</label>
                  <input type="number" step="0.01" className={input} value={medicalForm.cost}
                    onChange={e => setMedicalForm(f => ({ ...f, cost: e.target.value }))} /></div>
                <div><label className={label}>Follow-up date</label>
                  <input type="date" className={input} value={medicalForm.followUpDate}
                    onChange={e => setMedicalForm(f => ({ ...f, followUpDate: e.target.value }))} /></div>
                <div><label className={label}>Claim status</label>
                  <select className={`${input} bg-white`} value={medicalForm.claimStatus}
                    onChange={e => setMedicalForm(f => ({ ...f, claimStatus: e.target.value as ClaimStatus }))}>
                    {CLAIM_STATUSES.map(s => <option key={s} value={s}>{CLAIM_LABELS[s]}</option>)}
                  </select></div>
                <div><label className={label}>Amount claimed ($)</label>
                  <input type="number" step="0.01" className={input} value={medicalForm.amountClaimed}
                    onChange={e => setMedicalForm(f => ({ ...f, amountClaimed: e.target.value }))} /></div>
                <div><label className={label}>Amount reimbursed ($)</label>
                  <input type="number" step="0.01" className={input} value={medicalForm.amountReimbursed}
                    onChange={e => setMedicalForm(f => ({ ...f, amountReimbursed: e.target.value }))} /></div>
                <div><label className={label}>Claim submitted</label>
                  <input type="date" className={input} value={medicalForm.claimSubmittedDate}
                    onChange={e => setMedicalForm(f => ({ ...f, claimSubmittedDate: e.target.value }))} /></div>
                <input className={input} placeholder="Claim notes" value={medicalForm.claimNotes}
                  onChange={e => setMedicalForm(f => ({ ...f, claimNotes: e.target.value }))} />
                <input className={`${input} sm:col-span-2`} placeholder="Notes" value={medicalForm.notes}
                  onChange={e => setMedicalForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-2 mt-3">
                <button onClick={resetMedicalForm} className="text-xs px-3 py-1.5 text-gray-500 hover:text-gray-700">Cancel</button>
                <button onClick={handleSaveMedical} disabled={!medicalForm.title.trim()}
                  className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-40">
                  {editingMedicalId ? 'Save changes' : 'Add record'}
                </button>
              </div>
            </div>
          )}

          {medical.length === 0 && !showMedicalForm ? (
            <p className="text-sm text-gray-400 text-center py-12">No medical records yet.</p>
          ) : (
            <div className="space-y-2">
              {medical.map(m => (
                <div key={m.id} className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-800">{m.title}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600">{cap(m.type)}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${CLAIM_COLORS[m.claimStatus]}`}>
                          {CLAIM_LABELS[m.claimStatus]}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {new Date(m.date + 'T00:00:00').toLocaleDateString()}
                        {m.vet && <span className="ml-2">{m.vet}</span>}
                      </div>
                      {m.description && <p className="text-sm text-gray-600 mt-1">{m.description}</p>}
                      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                        {m.cost != null && <span className="text-gray-700 font-medium">{money(m.cost)}</span>}
                        {m.amountClaimed != null && <span className="text-blue-600">claimed {money(m.amountClaimed)}</span>}
                        {m.amountReimbursed != null && <span className="text-emerald-600 font-medium">back {money(m.amountReimbursed)}</span>}
                        {m.followUpDate && (
                          <span className="text-gray-400">follow-up {new Date(m.followUpDate + 'T00:00:00').toLocaleDateString()}</span>
                        )}
                      </div>
                      {(m.claimNotes || m.notes) && (
                        <p className="text-xs text-gray-400 italic mt-1">{[m.claimNotes, m.notes].filter(Boolean).join(' · ')}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => startEditMedical(m)}
                        className="p-2 rounded-md text-gray-300 hover:text-blue-500 hover:bg-blue-50">
                        <Pencil className="w-4 h-4" />
                      </button>
                      {confirmDelete === m.id ? (
                        <span className="flex items-center gap-1 text-xs px-1">
                          <button onClick={() => { removeMedical(m.id); setConfirmDelete(null) }}
                            className="text-red-500 hover:text-red-700 font-medium">Yes</button>
                          <button onClick={() => setConfirmDelete(null)} className="text-gray-400">No</button>
                        </span>
                      ) : (
                        <button onClick={() => setConfirmDelete(m.id)}
                          className="p-2 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
