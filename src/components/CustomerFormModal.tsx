import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  MapPin, 
  Briefcase, 
  PlusCircle, 
  Sparkles, 
  Save, 
  AlertCircle,
  FileText,
  Languages,
  DollarSign,
  Image as ImageIcon
} from 'lucide-react';
import { addCustomer, editCustomer, fetchCustomers } from '../lib/api';
import { Customer } from '../types';

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: Customer) => void;
  customerToEdit?: Customer | null;
}

const STATES_OF_INDIA = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 
  'Uttarakhand', 'West Bengal', 'Delhi', 'Other'
];

export default function CustomerFormModal({ isOpen, onClose, onSave, customerToEdit }: CustomerFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [existingPhones, setExistingPhones] = useState<string[]>([]);

  // 1. Basic Information
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('Other');
  const [dob, setDob] = useState('');

  // 2. Address
  const [doorNumber, setDoorNumber] = useState('');
  const [street, setStreet] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('Karnataka');
  const [pincode, setPincode] = useState('');

  // 3. Business Info
  const [customerType, setCustomerType] = useState<'Regular' | 'Wholesale' | 'VIP'>('Regular');
  const [gstNumber, setGstNumber] = useState('');

  // 4. Additional Info
  const [profilePhoto, setProfilePhoto] = useState('');
  const [notes, setNotes] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('English');
  const [preferredPaymentMethod, setPreferredPaymentMethod] = useState('CASH');

  // Load existing phones for duplicate validation
  useEffect(() => {
    if (isOpen) {
      fetchCustomers()
        .then(data => {
          // Store existing phones (exclude the editing customer itself)
          const phones = data
            .filter(c => !customerToEdit || c.id !== customerToEdit.id)
            .map(c => c.phone.trim());
          setExistingPhones(phones);
        })
        .catch(err => console.error('Failed to pre-fetch customer phones:', err));
    }
  }, [isOpen, customerToEdit]);

  // Set form states if editing
  useEffect(() => {
    if (customerToEdit) {
      setName(customerToEdit.name || '');
      setPhone(customerToEdit.phone || '');
      setWhatsapp(customerToEdit.whatsapp || '');
      setEmail(customerToEdit.email || '');
      setGender(customerToEdit.gender || 'Other');
      setDob(customerToEdit.dob || '');
      
      setDoorNumber(customerToEdit.doorNumber || '');
      setStreet(customerToEdit.street || '');
      setArea(customerToEdit.area || '');
      setCity(customerToEdit.city || '');
      setDistrict(customerToEdit.district || '');
      setState(customerToEdit.state || 'Karnataka');
      setPincode(customerToEdit.pincode || '');

      setCustomerType(customerToEdit.customerType || 'Regular');
      setGstNumber(customerToEdit.gstNumber || '');

      setProfilePhoto(customerToEdit.profilePhoto || '');
      setNotes(customerToEdit.notes || '');
      setPreferredLanguage(customerToEdit.preferredLanguage || 'English');
      setPreferredPaymentMethod(customerToEdit.preferredPaymentMethod || 'CASH');
    } else {
      // Clear states
      setName('');
      setPhone('');
      setWhatsapp('');
      setEmail('');
      setGender('Other');
      setDob('');
      
      setDoorNumber('');
      setStreet('');
      setArea('');
      setCity('');
      setDistrict('');
      setState('Karnataka');
      setPincode('');

      setCustomerType('Regular');
      setGstNumber('');

      setProfilePhoto('');
      setNotes('');
      setPreferredLanguage('English');
      setPreferredPaymentMethod('CASH');
    }
    setErrorMsg(null);
  }, [customerToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Front-end Validations
    if (!name.trim()) {
      setErrorMsg('Full Name is required');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('Mobile Number is required');
      return;
    }

    // Phone format verification (approx 10 digits or country code formatted)
    const cleanPhone = phone.trim();
    if (cleanPhone.replace(/\D/g, '').length < 8) {
      setErrorMsg('Please enter a valid mobile phone number');
      return;
    }

    // Duplicate Phone Validation
    if (existingPhones.includes(cleanPhone)) {
      setErrorMsg(`A customer with the mobile number "${cleanPhone}" is already registered. Please use a unique number.`);
      return;
    }

    // Email verification
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg('Please enter a valid email address');
      return;
    }

    // GSTIN format check (optional, if provided)
    if (gstNumber.trim() && gstNumber.trim().length !== 15) {
      setErrorMsg('GST Number must be exactly 15 characters long');
      return;
    }

    setLoading(true);
    try {
      const payload: Partial<Customer> = {
        name: name.trim(),
        phone: cleanPhone,
        whatsapp: whatsapp.trim(),
        email: email.trim(),
        gender,
        dob,
        doorNumber: doorNumber.trim(),
        street: street.trim(),
        area: area.trim(),
        city: city.trim(),
        district: district.trim(),
        state,
        pincode: pincode.trim(),
        customerType,
        gstNumber: gstNumber.trim().toUpperCase(),
        profilePhoto: profilePhoto.trim(),
        notes: notes.trim(),
        preferredLanguage,
        preferredPaymentMethod
      };

      let savedCust: Customer;
      if (customerToEdit) {
        savedCust = await editCustomer(customerToEdit.id, payload);
      } else {
        savedCust = await addCustomer(payload);
      }

      onSave(savedCust);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An error occurred while saving the customer profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl max-w-3xl w-full border border-slate-150 shadow-2xl flex flex-col my-8 max-h-[90vh] overflow-hidden"
          id="customer-modal-form"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="font-bold text-slate-800 text-sm">
                  {customerToEdit ? 'Edit Customer Profile' : 'Register New Customer'}
                </h3>
                <p className="text-[10px] text-slate-400">
                  {customerToEdit ? `Customer ID: ${customerToEdit.id}` : 'System will auto-generate unique ID (e.g. CUS0001)'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-700 transition"
              id="customer-modal-close-btn"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Error message */}
            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3.5 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Part 1: Basic Info */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 pb-1.5 border-b border-slate-100">
                <User className="w-3.5 h-3.5 text-blue-500" />
                Basic Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rajesh Kumar"
                    className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs outline-none transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Mobile Number *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs outline-none transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">WhatsApp Number</label>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs outline-none transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. rajesh.kumar@gmail.com"
                    className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs outline-none transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs outline-none transition"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Date of Birth</label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs outline-none transition"
                  />
                </div>
              </div>
            </div>

            {/* Part 2: Address */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 pb-1.5 border-b border-slate-100">
                <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                Address Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Door Number</label>
                  <input
                    type="text"
                    value={doorNumber}
                    onChange={(e) => setDoorNumber(e.target.value)}
                    placeholder="e.g. Flat 401"
                    className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs outline-none transition"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-600">Street Name / Building</label>
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="e.g. Lake View Apartments, Outer Ring Road"
                    className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs outline-none transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Area / Locality</label>
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="e.g. HSR Layout Sector 3"
                    className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs outline-none transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Bengaluru"
                    className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs outline-none transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">District</label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="e.g. Bengaluru Urban"
                    className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs outline-none transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">State</label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs outline-none transition"
                  >
                    {STATES_OF_INDIA.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Pincode</label>
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="e.g. 560102"
                    className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs outline-none transition"
                  />
                </div>
              </div>
            </div>

            {/* Part 3: Business Information */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 pb-1.5 border-b border-slate-100">
                <Briefcase className="w-3.5 h-3.5 text-amber-500" />
                Business Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Customer Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Regular', 'Wholesale', 'VIP'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setCustomerType(type)}
                        className={`py-2 px-3 border rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-0.5 ${
                          customerType === type
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">GST Number (GSTIN - Optional)</label>
                  <input
                    type="text"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                    placeholder="e.g. 29AAABP4211G1Z3"
                    maxLength={15}
                    className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs outline-none uppercase font-mono transition"
                  />
                </div>
              </div>
            </div>

            {/* Part 4: Additional Information */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 pb-1.5 border-b border-slate-100">
                <FileText className="w-3.5 h-3.5 text-purple-500" />
                Additional Preferences
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                    <ImageIcon className="w-3 h-3 text-slate-400" />
                    Profile Photo URL
                  </label>
                  <input
                    type="text"
                    value={profilePhoto}
                    onChange={(e) => setProfilePhoto(e.target.value)}
                    placeholder="e.g. https://domain.com/photo.jpg"
                    className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs outline-none transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                    <Languages className="w-3 h-3 text-slate-400" />
                    Preferred Language
                  </label>
                  <select
                    value={preferredLanguage}
                    onChange={(e) => setPreferredLanguage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs outline-none transition"
                  >
                    <option value="English">English</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-slate-400" />
                    Preferred Payment
                  </label>
                  <select
                    value={preferredPaymentMethod}
                    onChange={(e) => setPreferredPaymentMethod(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs outline-none transition"
                  >
                    <option value="CASH">Cash (CASH)</option>
                    <option value="CARD">Card (CARD)</option>
                    <option value="UPI">UPI/Digital (UPI)</option>
                    <option value="DUE">Book Debt (DUE)</option>
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-3">
                  <label className="text-xs font-semibold text-slate-600">Notes / Loyalty Remarks</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Write customer allergies, regular brands, or custom credit arrangements..."
                    rows={2}
                    className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs outline-none transition resize-none"
                  />
                </div>
              </div>
            </div>

          </form>

          {/* Footer Sticky */}
          <div className="px-6 py-4 border-t border-slate-150 flex items-center justify-end gap-3 bg-slate-50/50 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 hover:bg-slate-200 text-slate-600 hover:text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              id="customer-save-btn"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm hover:shadow shrink-0 cursor-pointer"
            >
              {loading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Customer</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
