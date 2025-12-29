import { useEffect, useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import MapPicker from "../components/MapPicker";
import StaffSelector from "../components/StaffSelector";
import PhoneInput from "react-phone-number-input";
import { parsePhoneNumber } from "libphonenumber-js";
import "react-phone-number-input/style.css";

const categories = [
  "Road Damage",
  "Potholes",
  "Street Lights Not Working",
  "Traffic Signal Issue",
  "Drainage Blocked",
  "Water Leakage",
  "No Water Supply",
  "Water Quality Issue",
  "Sewage Overflow",
  "Garbage Not Collected",
  "Illegal Dumping",
  "Public Toilet Issue",
  "Park Maintenance",
  "Tree Fallen",
  "Stray Animals",
  "Noise Pollution",
  "Air Pollution",
  "Building Violation",
  "Illegal Construction",
  "Parking Issue",
  "Encroachment",
  "Other",
];

export default function NewComplaint() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [priority, setPriority] = useState("LOW");
  const [lat, setLat] = useState(28.6139);
  const [lng, setLng] = useState(77.209);
  const [departments, setDepartments] = useState([]);
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [reporterPhone, setReporterPhone] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Phone validation
  const isValidPhone = (phone) => {
    if (!phone) return null;
    try {
      const phoneNumber = parsePhoneNumber(phone);
      return phoneNumber ? phoneNumber.isValid() : false;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/api/departments");
        setDepartments(data.departments || []);
      } catch {}
    })();
  }, []);

  const matchingDepts = departments.filter((d) =>
    d.categoriesHandled?.includes(category)
  );

  useEffect(() => {
    if (matchingDepts.length === 1) {
      setSelectedDeptId(matchingDepts[0]._id);
    } else if (
      matchingDepts.length > 1 &&
      !matchingDepts.find((d) => d._id === selectedDeptId)
    ) {
      setSelectedDeptId("");
    }
  }, [category, matchingDepts.length]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate required fields
    if (!title || !description || !category) {
      setError("Title, description, and category are required");
      setLoading(false);
      return;
    }

    // Validate location
    if (!lat || !lng || Number.isNaN(lat) || Number.isNaN(lng)) {
      setError(
        "Please select a location on the map or use your current location"
      );
      setLoading(false);
      return;
    }

    // Validate reporter phone if provided
    if (reporterPhone && !isValidPhone(reporterPhone)) {
      setError("Please enter a valid phone number");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        title,
        description,
        category,
        priority,
        location: {
          lat: Number(lat),
          lng: Number(lng),
        },
      };

      // Add reporter info if provided
      if (reporterName || reporterPhone || reporterEmail) {
        payload.reporter = {
          name: reporterName,
          phone: reporterPhone,
          email: reporterEmail,
        };
      }

      if (selectedDeptId) payload.assignedDepartmentId = selectedDeptId;
      if (selectedStaffId) payload.assignedStaffId = selectedStaffId;

      await api.post("/api/complaints", payload);
      navigate("/");
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">New Complaint</h1>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <form onSubmit={onSubmit} className="space-y-4">
        <input
          className="w-full border rounded p-2"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="w-full border rounded p-2"
          rows={4}
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select
            className="border rounded p-2"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            className="border rounded p-2"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">
            Department {matchingDepts.length === 1 ? "(auto-selected)" : ""}
          </label>
          <select
            className="w-full border rounded p-2"
            value={selectedDeptId}
            onChange={(e) => setSelectedDeptId(e.target.value)}
            disabled={matchingDepts.length <= 1}
          >
            {matchingDepts.length === 0 && (
              <option value="">No departments for this category</option>
            )}
            {matchingDepts.length > 1 && (
              <option value="">Select a department</option>
            )}
            {matchingDepts.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">
            Location (click on map or enter coordinates)
          </label>
          <div className="mb-2 flex gap-2">
            <button
              type="button"
              onClick={() => {
                if ("geolocation" in navigator) {
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      setLat(pos.coords.latitude);
                      setLng(pos.coords.longitude);
                    },
                    () =>
                      setError(
                        "Could not fetch your location, please allow permission or pick on map"
                      )
                  );
                } else {
                  setError("Geolocation not supported in this browser");
                }
              }}
              className="px-3 py-2 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 text-sm"
            >
              📍 Use my current location
            </button>
            <div className="text-xs text-fade self-center">
              Lat: {Number(lat).toFixed(5)} • Lng: {Number(lng).toFixed(5)}
            </div>
          </div>
          <MapPicker
            lat={lat}
            lng={lng}
            onLocationChange={(newLat, newLng) => {
              setLat(newLat);
              setLng(newLng);
            }}
          />
          <div className="grid grid-cols-2 gap-2 mt-2">
            <input
              className="border rounded p-2 text-sm"
              placeholder="Latitude"
              value={lat}
              onChange={(e) => setLat(Number(e.target.value))}
            />
            <input
              className="border rounded p-2 text-sm"
              placeholder="Longitude"
              value={lng}
              onChange={(e) => setLng(Number(e.target.value))}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1">Select Staff (Optional)</label>
          <StaffSelector
            lat={lat}
            lng={lng}
            category={category}
            onStaffSelect={setSelectedStaffId}
            selectedStaffId={selectedStaffId}
          />
        </div>

        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <h3 className="font-medium text-sm">
            Your Contact Information (Optional)
          </h3>
          <p className="text-xs text-fade">
            Provide your contact details so staff can reach you for updates or
            clarification.
          </p>

          <input
            className="w-full border rounded p-2"
            placeholder="Your Name"
            value={reporterName}
            onChange={(e) => setReporterName(e.target.value)}
          />

          <div>
            <label className="block text-sm mb-1">Your Phone Number</label>
            <PhoneInput
              className="phone-input"
              value={reporterPhone}
              onChange={setReporterPhone}
              defaultCountry="IN"
              placeholder="Phone for updates"
            />
            {reporterPhone && (
              <div className="text-xs mt-1">
                <span
                  className={
                    isValidPhone(reporterPhone)
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {isValidPhone(reporterPhone)
                    ? "✓ Valid phone number"
                    : "✗ Invalid phone number"}
                </span>
              </div>
            )}
          </div>

          <input
            className="w-full border rounded p-2"
            type="email"
            placeholder="Your Email (for updates)"
            value={reporterEmail}
            onChange={(e) => setReporterEmail(e.target.value)}
          />
        </div>

        <button
          disabled={loading}
          className="px-4 py-2 rounded bg-emerald-600 text-white disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit Complaint"}
        </button>
      </form>
    </div>
  );
}
