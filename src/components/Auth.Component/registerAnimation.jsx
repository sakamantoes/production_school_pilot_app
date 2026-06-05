import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Building,
  Shield,
  UserCircle,
  Phone,
  X,
  FileText,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  GraduationCap,
  MapPin,
  Globe,
  Calendar,
  Award,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import Loader from "../Loader";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/* ================= Animations ================= */
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const slideIn = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4 } },
};

const scaleHover = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
};

/* ================= Component ================= */
const RegisterAnimation = () => {
  const [formData, setFormData] = useState({
    schoolName: "",
    schoolEmail: "",
    logo: "",
    phoneNumber: "",
    website: "",
    address: "",
    city: "",
    state: "",
    country: "",
    coverImage: "",
    isRegistered: false,
    registrationNumber: "",
    registrationDocument: "",
    principalName: "",
    establishedYear: "",
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    phone: "",
    image: "",
  });

  const [imagePreviews, setImagePreviews] = useState({
    logo: null,
    coverImage: null,
    registrationDocument: null,
    profileImage: null,
  });

  const [showPassword1, setShowPassword1] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState("personal");
  const [uploadingImages, setUploadingImages] = useState({
    logo: false,
    coverImage: false,
    registrationDocument: false,
    profileImage: false,
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [termsAccepted, setTermsAccepted] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  const sections = [
    { id: "personal", label: "Personal Info", icon: User },
    { id: "school", label: "School Details", icon: Building },
    { id: "account", label: "Account Setup", icon: Shield },
  ];

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    
    // Clear error for this field if it exists
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleBlur = (fieldName) => {
    setTouchedFields((prev) => ({ ...prev, [fieldName]: true }));
    validateField(fieldName, formData[fieldName]);
  };

  const validateField = (fieldName, value) => {
    let error = "";
    
    switch (fieldName) {
      case "firstName":
        if (!value || value.trim() === "") error = "First name is required";
        else if (value.length < 2) error = "First name must be at least 2 characters";
        break;
      case "lastName":
        if (!value || value.trim() === "") error = "Last name is required";
        else if (value.length < 2) error = "Last name must be at least 2 characters";
        break;
      case "email":
        if (!value || value.trim() === "") error = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = "Invalid email format";
        break;
      case "password":
        if (!value) error = "Password is required";
        else if (value.length < 8) error = "Password must be at least 8 characters";
        else if (!/(?=.*[A-Z])/.test(value)) error = "Password must contain at least one uppercase letter";
        else if (!/(?=.*[0-9])/.test(value)) error = "Password must contain at least one number";
        break;
      case "confirmPassword":
        if (!value) error = "Please confirm your password";
        else if (value !== formData.password) error = "Passwords do not match";
        break;
      default:
        break;
    }
    
    setFieldErrors((prev) => ({ ...prev, [fieldName]: error }));
  };

  const createLocalPreview = (file, type) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreviews((prev) => ({
        ...prev,
        [type]: reader.result,
      }));
    };
    reader.readAsDataURL(file);
  };

  const removePreview = (type, fieldName) => {
    setImagePreviews((prev) => ({
      ...prev,
      [type]: null,
    }));
    setFormData((prev) => ({
      ...prev,
      [fieldName]: "",
    }));
  };

  const uploadToCloudinary = async (file, type) => {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      toast.error("Cloudinary configuration is missing");
      return null;
    }

    setUploadingImages((prev) => ({ ...prev, [type]: true }));

    const formDataCloud = new FormData();
    formDataCloud.append("file", file);
    formDataCloud.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formDataCloud,
        }
      );

      const data = await response.json();

      if (data.secure_url) {
        toast.success(`${type} uploaded successfully!`);
        return data.secure_url;
      } else {
        throw new Error(data.error?.message || "Upload failed");
      }
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      toast.error(`Failed to upload ${type}. Please try again.`);
      return null;
    } finally {
      setUploadingImages((prev) => ({ ...prev, [type]: false }));
    }
  };

  const handleFileUpload = async (e, fieldName, uploadType) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedImageTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    const allowedDocTypes = ["application/pdf"];

    if (uploadType === "registrationDocument") {
      if (![...allowedImageTypes, ...allowedDocTypes].includes(file.type)) {
        toast.error("Please upload a valid file (PDF, JPEG, PNG, WEBP, or JPG)");
        return;
      }
    } else {
      if (!allowedImageTypes.includes(file.type)) {
        toast.error("Please upload a valid image file (JPEG, PNG, WEBP, or JPG)");
        return;
      }
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    if (uploadType !== "registrationDocument" || file.type !== "application/pdf") {
      createLocalPreview(file, uploadType);
    } else {
      setImagePreviews((prev) => ({
        ...prev,
        [uploadType]: { name: file.name, type: "pdf" },
      }));
    }

    const imageUrl = await uploadToCloudinary(file, uploadType);

    if (imageUrl) {
      setFormData((prev) => ({
        ...prev,
        [fieldName]: imageUrl,
      }));
    } else if (uploadType !== "registrationDocument" || file.type !== "application/pdf") {
      removePreview(uploadType, fieldName);
    }
  };

  const validateForm = () => {
    const requiredFields = ["firstName", "lastName", "email", "password", "confirmPassword"];
    let isValid = true;
    
    // Validate required fields
    requiredFields.forEach(field => {
      if (!formData[field] || formData[field].trim() === "") {
        setFieldErrors(prev => ({ ...prev, [field]: `${field === "confirmPassword" ? "Confirm password" : field} is required` }));
        setTouchedFields(prev => ({ ...prev, [field]: true }));
        isValid = false;
      } else {
        validateField(field, formData[field]);
        if (fieldErrors[field]) isValid = false;
      }
    });
    
    // Check password match
    if (formData.password !== formData.confirmPassword) {
      setFieldErrors(prev => ({ ...prev, confirmPassword: "Passwords do not match" }));
      setTouchedFields(prev => ({ ...prev, confirmPassword: true }));
      isValid = false;
    }
    
    // Check terms acceptance
    if (!termsAccepted) {
      toast.error("Please accept the Terms of Service and Privacy Policy");
      isValid = false;
    }
    
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    setLoading(true);

    try {
      const userData = {};
      
      // Required user fields
      userData.firstName = formData.firstName.trim();
      userData.lastName = formData.lastName.trim();
      userData.email = formData.email.trim();
      userData.password = formData.password;
      
      // Optional user fields
      if (formData.username?.trim()) userData.username = formData.username.trim();
      if (formData.phone?.trim()) userData.phone = formData.phone.trim();
      if (formData.image?.trim()) userData.image = formData.image;
      
      // Optional school fields
      if (formData.schoolName?.trim()) userData.schoolName = formData.schoolName.trim();
      if (formData.schoolEmail?.trim()) userData.schoolEmail = formData.schoolEmail.trim();
      if (formData.logo?.trim()) userData.logo = formData.logo;
      if (formData.phoneNumber?.trim()) userData.phoneNumber = formData.phoneNumber.trim();
      if (formData.website?.trim()) userData.website = formData.website.trim();
      if (formData.address?.trim()) userData.address = formData.address.trim();
      if (formData.city?.trim()) userData.city = formData.city.trim();
      if (formData.state?.trim()) userData.state = formData.state.trim();
      if (formData.country?.trim()) userData.country = formData.country.trim();
      if (formData.coverImage?.trim()) userData.coverImage = formData.coverImage;
      if (formData.registrationNumber?.trim()) userData.registrationNumber = formData.registrationNumber.trim();
      if (formData.registrationDocument?.trim()) userData.registrationDocument = formData.registrationDocument;
      if (formData.principalName?.trim()) userData.principalName = formData.principalName.trim();
      if (formData.establishedYear?.toString().trim()) {
        userData.establishedYear = parseInt(formData.establishedYear);
      }
      userData.isRegistered = formData.isRegistered;

      const result = await register(userData);
      
      if (result && result.success !== false) {
        setSuccess(true);
        toast.success("Registration successful! Redirecting to login...");
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        throw new Error(result?.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(error.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const goToNextSection = () => {
    if (activeSection === "personal") {
      if (!formData.firstName?.trim() || !formData.lastName?.trim()) {
        toast.error("Please fill in your first and last name");
        setTouchedFields(prev => ({ ...prev, firstName: true, lastName: true }));
        return;
      }
    }
    
    const currentIndex = sections.findIndex(s => s.id === activeSection);
    if (currentIndex < sections.length - 1) {
      setActiveSection(sections[currentIndex + 1].id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goToPreviousSection = () => {
    const currentIndex = sections.findIndex(s => s.id === activeSection);
    if (currentIndex > 0) {
      setActiveSection(sections[currentIndex - 1].id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const ImagePreview = ({ preview, type, onRemove, fieldName, label }) => {
    if (!preview) return null;
    const isPdf = typeof preview === "object" && preview.type === "pdf";

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="mt-2 relative inline-block"
      >
        <div className="relative group">
          {isPdf ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
              <FileText className="w-8 h-8 text-red-500" />
              <span className="text-sm text-gray-700 font-medium">{preview.name}</span>
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden shadow-md">
              <img
                src={preview}
                alt={`${label} preview`}
                className="w-24 h-24 object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
          <button
            type="button"
            onClick={() => onRemove(type, fieldName)}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-all shadow-lg opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </motion.div>
    );
  };

  const InputField = ({ icon: Icon, label, name, type = "text", required, placeholder, ...props }) => (
    <motion.div variants={slideIn} className="space-y-1.5">
      <label className="block text-sm font-semibold text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative group">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 transition-colors group-focus-within:text-blue-500" />
        )}
        <input
          type={type}
          name={name}
          value={formData[name] || ""}
          onChange={handleChange}
          onBlur={() => handleBlur(name)}
          required={required}
          className={`w-full bg-gray-50/50 px-10 py-2.5 rounded-xl outline-none border-2 transition-all duration-200 text-sm
            ${touchedFields[name] && fieldErrors[name] 
              ? "border-red-300 focus:border-red-500 bg-red-50/30" 
              : "border-gray-200 focus:border-blue-400 hover:border-gray-300"
            }`}
          placeholder={placeholder}
          {...props}
        />
      </div>
      <AnimatePresence>
        {touchedFields[name] && fieldErrors[name] && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-xs text-red-500 flex items-center gap-1 mt-1"
          >
            <AlertCircle className="w-3 h-3" />
            {fieldErrors[name]}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );

  // Check if any image is uploading
  const isUploading = Object.values(uploadingImages).some(u => u);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="w-full max-w-5xl"
      >
        {/* Header Section */}
        <motion.div variants={fadeInUp} className="text-center mb-8">
          <motion.div
            className="inline-flex items-center justify-center mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
          </motion.div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">
            Join the Future of Education
          </h1>
          <p className="text-gray-600 text-lg">
            Create your account and start your journey with us
          </p>
        </motion.div>

        {/* Main Card */}
        <motion.div
          variants={fadeInUp}
          className="bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Progress Steps */}
          <div className="px-6 pt-6 border-b border-gray-100">
            <div className="flex items-center justify-between max-w-md mx-auto">
              {sections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => {
                    if (section.id === "personal") {
                      setActiveSection(section.id);
                    } else if (section.id === "school") {
                      if (formData.firstName?.trim() && formData.lastName?.trim()) {
                        setActiveSection(section.id);
                      } else {
                        toast.error("Please complete personal information first");
                      }
                    } else if (section.id === "account") {
                      if (formData.firstName?.trim() && formData.lastName?.trim()) {
                        setActiveSection(section.id);
                      } else {
                        toast.error("Please complete previous sections first");
                      }
                    }
                  }}
                  className={`flex flex-col items-center gap-2 transition-all duration-300 ${
                    activeSection === section.id
                      ? "text-blue-600"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    activeSection === section.id
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                      : "bg-gray-100 text-gray-500"
                  }`}>
                    <section.icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium hidden sm:block">{section.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6 sm:p-8">
            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome Aboard! 🎉</h2>
                <p className="text-gray-600 mb-6">
                  Your account has been created successfully. Redirecting you to login...
                </p>
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <AnimatePresence mode="wait">
                  {/* Personal Information */}
                  {activeSection === "personal" && (
                    <motion.div
                      key="personal"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-5"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <InputField
                          icon={User}
                          label="First Name"
                          name="firstName"
                          required
                          placeholder="John"
                        />
                        <InputField
                          icon={User}
                          label="Last Name"
                          name="lastName"
                          required
                          placeholder="Doe"
                        />
                      </div>
                      
                      <InputField
                        icon={Phone}
                        label="Phone Number"
                        name="phone"
                        type="tel"
                        placeholder="+1 234 567 8900"
                      />

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                          Profile Photo <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                        </label>
                        <label className="relative cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, "image", "profileImage")}
                            className="hidden"
                            disabled={uploadingImages.profileImage}
                          />
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors cursor-pointer">
                            <Upload className="w-5 h-5 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              {uploadingImages.profileImage ? "Uploading..." : "Click or drag to upload profile photo"}
                            </span>
                          </div>
                        </label>
                        <ImagePreview
                          preview={imagePreviews.profileImage}
                          type="profileImage"
                          fieldName="image"
                          label="Profile"
                          onRemove={removePreview}
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* School Information */}
                  {activeSection === "school" && (
                    <motion.div
                      key="school"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-5"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <InputField
                          icon={Building}
                          label="School Name"
                          name="schoolName"
                          placeholder="Oxford International School"
                        />
                        <InputField
                          icon={Mail}
                          label="School Email"
                          name="schoolEmail"
                          type="email"
                          placeholder="contact@school.edu"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <InputField
                          icon={Phone}
                          label="School Phone"
                          name="phoneNumber"
                          type="tel"
                          placeholder="+1 234 567 8900"
                        />
                        <InputField
                          icon={Globe}
                          label="Website"
                          name="website"
                          placeholder="https://school.edu"
                        />
                      </div>

                      <InputField
                        icon={MapPin}
                        label="Address"
                        name="address"
                        placeholder="123 Education Street"
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <InputField
                          icon={MapPin}
                          label="City"
                          name="city"
                          placeholder="New York"
                        />
                        <InputField
                          icon={MapPin}
                          label="State"
                          name="state"
                          placeholder="NY"
                        />
                        <InputField
                          icon={Globe}
                          label="Country"
                          name="country"
                          placeholder="USA"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <InputField
                          icon={User}
                          label="Principal Name"
                          name="principalName"
                          placeholder="Dr. Sarah Johnson"
                        />
                        <InputField
                          icon={Calendar}
                          label="Established Year"
                          name="establishedYear"
                          type="number"
                          placeholder="2000"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <InputField
                          icon={Award}
                          label="Registration Number"
                          name="registrationNumber"
                          placeholder="REG123456"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">School Logo</label>
                        <label className="relative cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, "logo", "logo")}
                            className="hidden"
                            disabled={uploadingImages.logo}
                          />
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors cursor-pointer">
                            <ImageIcon className="w-5 h-5 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              {uploadingImages.logo ? "Uploading..." : "Upload school logo"}
                            </span>
                          </div>
                        </label>
                        <ImagePreview
                          preview={imagePreviews.logo}
                          type="logo"
                          fieldName="logo"
                          label="Logo"
                          onRemove={removePreview}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Cover Image</label>
                        <label className="relative cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, "coverImage", "coverImage")}
                            className="hidden"
                            disabled={uploadingImages.coverImage}
                          />
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors cursor-pointer">
                            <ImageIcon className="w-5 h-5 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              {uploadingImages.coverImage ? "Uploading..." : "Upload cover image"}
                            </span>
                          </div>
                        </label>
                        <ImagePreview
                          preview={imagePreviews.coverImage}
                          type="coverImage"
                          fieldName="coverImage"
                          label="Cover"
                          onRemove={removePreview}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Registration Document</label>
                        <label className="relative cursor-pointer">
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.webp"
                            onChange={(e) => handleFileUpload(e, "registrationDocument", "registrationDocument")}
                            className="hidden"
                            disabled={uploadingImages.registrationDocument}
                          />
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors cursor-pointer">
                            <FileText className="w-5 h-5 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              {uploadingImages.registrationDocument ? "Uploading..." : "Upload registration document (PDF or image)"}
                            </span>
                          </div>
                        </label>
                        <ImagePreview
                          preview={imagePreviews.registrationDocument}
                          type="registrationDocument"
                          fieldName="registrationDocument"
                          label="Document"
                          onRemove={removePreview}
                        />
                      </div>

                      <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl">
                        <input
                          type="checkbox"
                          id="isRegistered"
                          name="isRegistered"
                          checked={formData.isRegistered}
                          onChange={handleChange}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="isRegistered" className="cursor-pointer text-sm text-gray-700">
                          This school is registered with the government
                        </label>
                      </div>
                    </motion.div>
                  )}

                  {/* Account Information */}
                  {activeSection === "account" && (
                    <motion.div
                      key="account"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-5"
                    >
                      <InputField
                        icon={UserCircle}
                        label="Username"
                        name="username"
                        placeholder="johndoe_2024"
                      />

                      <InputField
                        icon={Mail}
                        label="Email Address"
                        name="email"
                        type="email"
                        required
                        placeholder="john.doe@example.com"
                      />

                      <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-gray-700">
                          Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative group">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input
                            type={showPassword1 ? "text" : "password"}
                            required
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            onBlur={() => handleBlur("password")}
                            className={`w-full bg-gray-50/50 px-10 py-2.5 rounded-xl outline-none border-2 transition-all duration-200 text-sm pr-12
                              ${touchedFields.password && fieldErrors.password 
                                ? "border-red-300 focus:border-red-500 bg-red-50/30" 
                                : "border-gray-200 focus:border-blue-400 hover:border-gray-300"
                              }`}
                            placeholder="Create a strong password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword1(!showPassword1)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {showPassword1 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <ul className="text-xs text-gray-500 space-y-1 mt-2">
                          <li className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${formData.password?.length >= 8 ? "bg-green-500" : "bg-gray-300"}`} />
                            At least 8 characters
                          </li>
                          <li className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${/(?=.*[A-Z])/.test(formData.password) ? "bg-green-500" : "bg-gray-300"}`} />
                            One uppercase letter
                          </li>
                          <li className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${/(?=.*[0-9])/.test(formData.password) ? "bg-green-500" : "bg-gray-300"}`} />
                            One number
                          </li>
                        </ul>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-gray-700">
                          Confirm Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input
                            type={showPassword2 ? "text" : "password"}
                            required
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            onBlur={() => handleBlur("confirmPassword")}
                            className={`w-full bg-gray-50/50 px-10 py-2.5 rounded-xl outline-none border-2 transition-all duration-200 text-sm pr-12
                              ${touchedFields.confirmPassword && fieldErrors.confirmPassword 
                                ? "border-red-300 focus:border-red-500 bg-red-50/30" 
                                : "border-gray-200 focus:border-blue-400 hover:border-gray-300"
                              }`}
                            placeholder="Confirm your password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword2(!showPassword2)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Navigation Buttons */}
                <div className="flex gap-3 pt-6">
                  {activeSection !== "personal" && (
                    <motion.button
                      type="button"
                      onClick={goToPreviousSection}
                      className="flex-1 px-6 py-2.5 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Back
                    </motion.button>
                  )}
                  
                  {activeSection !== "account" ? (
                    <motion.button
                      type="button"
                      onClick={goToNextSection}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                      {...scaleHover}
                    >
                      Continue
                      <ChevronRight className="w-4 h-4 inline-block ml-2" />
                    </motion.button>
                  ) : (
                    <motion.button
                      type="submit"
                      disabled={loading || isUploading}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      {...scaleHover}
                    >
                      {loading ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader size="sm" />
                          <span>Creating Account...</span>
                        </div>
                      ) : isUploading ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader size="sm" />
                          <span>Uploading Files...</span>
                        </div>
                      ) : (
                        <>
                          <Shield className="w-4 h-4 inline-block mr-2" />
                          Complete Registration
                        </>
                      )}
                    </motion.button>
                  )}
                </div>

                {/* Terms and Login Link */}
                <div className="pt-4 text-center space-y-3">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      id="terms"
                      required
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="terms" className="cursor-pointer">
                      I agree to the <button type="button" onClick={() => window.open("/terms", "_blank")} className="text-blue-600 hover:underline">Terms of Service</button> and <button type="button" onClick={() => window.open("/privacy", "_blank")} className="text-blue-600 hover:underline">Privacy Policy</button>
                    </label>
                  </div>
                  
                  <p className="text-sm text-gray-600">
                    Already have an account?{" "}
                    <Link to="/login" className="text-blue-600 font-semibold hover:underline">
                      Sign In
                    </Link>
                  </p>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default RegisterAnimation;