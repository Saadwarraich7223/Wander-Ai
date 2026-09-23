"use client";

import React, { useState, useMemo } from "react";

interface EmergencySOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeRegionName?: string;
}

interface EmergencyContact {
  id: string;
  name: string;
  number: string;
  category: "rescue" | "police" | "highway" | "hospital";
  badge: string;
  description: string;
  icon: string;
}

const PRIMARY_EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    id: "rescue-1122",
    name: "Rescue 1122 Emergency",
    number: "1122",
    category: "rescue",
    badge: "24/7 NATIONWIDE",
    description: "Ambulance, trauma medical response, desert/mountain search & rescue, and fire response.",
    icon: "emergency",
  },
  {
    id: "tourist-police-gb",
    name: "GB Tourist Police & Helpline",
    number: "1422",
    category: "police",
    badge: "NORTHERN CORRIDORS",
    description: "Dedicated tourist facilitation, route assistance, and checkpost clearance.",
    icon: "local_police",
  },
  {
    id: "motorway-police-130",
    name: "National Highway & Motorway Police",
    number: "130",
    category: "highway",
    badge: "M-1 to M-16 & EXPRESSWAYS",
    description: "Roadside mechanical breakdown, pass blockage alerts, towing, and route clearance.",
    icon: "minor_crash",
  },
  {
    id: "police-15",
    name: "National Police Emergency",
    number: "15",
    category: "police",
    badge: "ALL PROVINCES",
    description: "General law enforcement and district security coordination across Pakistan.",
    icon: "shield",
  },
  {
    id: "edhi-115",
    name: "Edhi Ambulance & Air Rescue",
    number: "115",
    category: "rescue",
    badge: "AIR & GROUND",
    description: "Nationwide patient transport and regional emergency medical evacuation.",
    icon: "medical_services",
  },
];

const REGIONAL_HOSPITALS_BY_ZONE = [
  {
    zoneId: "punjab",
    regionName: "Punjab & Cholistan Corridor (Bahawalpur, Multan, Lahore)",
    keywords: ["bahawalpur", "cholistan", "derawar", "multan", "lahore", "punjab", "chishtian", "rahim yar khan"],
    facilities: [
      { name: "Bahawal Victoria Hospital (BVH), Bahawalpur", phone: "+92 62 9250431", type: "Tertiary Trauma & 24/7 Emergency Centre" },
      { name: "Rescue 1122 Emergency Station, Bahawalpur", phone: "1122", type: "Desert Emergency & Fast Medical Response" },
      { name: "Sheikh Zayed Medical Hospital, Rahim Yar Khan", phone: "+92 68 9230161", type: "Full Specialty Trauma Care" },
      { name: "Nishtar Hospital, Multan", phone: "+92 61 9200231", type: "Major Regional Medical Teaching Complex" },
    ],
  },
  {
    zoneId: "gilgit",
    regionName: "Gilgit-Baltistan (Hunza, Nagar, Gilgit)",
    keywords: ["hunza", "gilgit", "nagar", "karimabad", "aliabad", "attabad", "passu", "khunjerab"],
    facilities: [
      { name: "DHQ Hospital Gilgit", phone: "+92 5811 920253", type: "Full Trauma & Oxygen Hub" },
      { name: "Combined Military Hospital (CMH) Gilgit", phone: "+92 5811 920201", type: "Advanced ICU & Heli Evac Coordination" },
      { name: "Aga Khan Health Centre, Aliabad Hunza", phone: "+92 5813 455026", type: "Altitude Sickness & Primary Care" },
      { name: "Civil Hospital Karimabad", phone: "+92 5813 457011", type: "First Aid & Oxygen Cylinders" },
    ],
  },
  {
    zoneId: "baltistan",
    regionName: "Baltistan (Skardu, Deosai, Shigar, Khaplu)",
    keywords: ["skardu", "deosai", "shigar", "khaplu", "baltistan", "kachura", "shangrila"],
    facilities: [
      { name: "Combined Military Hospital (CMH) Skardu", phone: "+92 5815 920235", type: "High-Altitude Trauma & Military Heli Evac" },
      { name: "DHQ Hospital Skardu", phone: "+92 5815 920211", type: "District Hospital & Oxygen Hub" },
      { name: "Civil Hospital Shigar", phone: "+92 5815 922014", type: "Valley Medical & First Aid Post" },
    ],
  },
  {
    zoneId: "kpk",
    regionName: "Khyber Pakhtunkhwa (Naran, Swat, Chitral, Kumrat)",
    keywords: ["naran", "kaghan", "swat", "chitral", "kumrat", "saidu", "kalam", "babusar"],
    facilities: [
      { name: "Civil Hospital Naran (Kaghan Valley)", phone: "+92 997 430018", type: "Seasonal Tourist Medical Post & Oxygen" },
      { name: "Saidu Teaching Hospital, Swat", phone: "+92 946 9240131", type: "Major Tertiary Care Hospital" },
      { name: "DHQ Hospital Chitral", phone: "+92 943 412502", type: "District Emergency Centre" },
    ],
  },
  {
    zoneId: "sindh_balochistan",
    regionName: "Sindh & Balochistan (Karachi, Gwadar, Quetta, Coastal Highway)",
    keywords: ["karachi", "gwadar", "quetta", "sindh", "balochistan", "coastal", "ziarat", "hingol"],
    facilities: [
      { name: "GDA Memorial Hospital, Gwadar", phone: "+92 86 4210088", type: "Coastal Highway Emergency Care" },
      { name: "Jinnah Postgraduate Medical Centre (JPMC), Karachi", phone: "+92 21 99215740", type: "24/7 Level 1 Trauma Centre" },
      { name: "Civil Hospital Quetta", phone: "+92 81 9213038", type: "District Emergency Centre" },
    ],
  },
];

export default function EmergencySOSModal({
  isOpen,
  onClose,
  activeRegionName = "Pakistan Tourist Corridors",
}: EmergencySOSModalProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Sort regional hospital groups so that the active destination region appears first
  const sortedHospitalGroups = useMemo(() => {
    const regionLower = (activeRegionName || "").toLowerCase();

    return [...REGIONAL_HOSPITALS_BY_ZONE].sort((a, b) => {
      const aMatch = a.keywords.some((k) => regionLower.includes(k));
      const bMatch = b.keywords.some((k) => regionLower.includes(k));
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      return 0;
    });
  }, [activeRegionName]);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fade-in">
      <div className="bg-surface-container-lowest rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-outline-variant/60 flex flex-col">
        {/* Clean, Cohesive Header */}
        <div className="p-5 sm:p-6 bg-surface-container-low border-b border-outline-variant/40 rounded-t-3xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-600 shrink-0">
              <span className="material-symbols-outlined text-2xl animate-pulse">sos</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider bg-red-500/15 text-red-800 px-2 py-0.5 rounded-md">
                  Emergency Safety Sentinel
                </span>
                <span className="text-xs text-on-surface-variant font-medium">
                  {activeRegionName}
                </span>
              </div>
              <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight text-on-surface mt-0.5">
                Emergency Helplines &amp; Regional Medical Directory
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors cursor-pointer shrink-0 border border-outline-variant/60"
            type="button"
            title="Close"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-7 space-y-6 flex-1">
          {/* Section 1: 1-Tap National Emergency Helplines */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-red-600">call</span>
                <h3 className="font-display font-bold text-sm text-on-surface uppercase tracking-wider">
                  1-Tap Emergency Helplines
                </h3>
              </div>
              <span className="text-[11px] text-on-surface-variant font-mono">Toll-Free · 24/7 Dispatch</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PRIMARY_EMERGENCY_CONTACTS.map((contact) => (
                <div
                  key={contact.id}
                  className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/50 hover:border-red-500/30 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-red-500/10 text-red-800">
                        {contact.badge}
                      </span>
                      <span className="material-symbols-outlined text-sm text-on-surface-variant">
                        {contact.icon}
                      </span>
                    </div>
                    <div className="font-display font-bold text-sm text-on-surface">
                      {contact.name}
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                      {contact.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 mt-3.5 pt-3 border-t border-outline-variant/40">
                    <a
                      href={`tel:${contact.number}`}
                      className="flex-1 py-2 px-3 rounded-xl bg-red-600 text-white hover:bg-red-700 font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors text-center"
                    >
                      <span className="material-symbols-outlined text-sm">phone_in_talk</span>
                      <span>Call {contact.number}</span>
                    </a>
                    <button
                      onClick={() => handleCopy(contact.number, contact.id)}
                      className="w-8 h-8 rounded-xl bg-surface-container text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors border border-outline-variant/60 cursor-pointer"
                      title="Copy Number"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-sm">
                        {copiedId === contact.id ? "check" : "content_copy"}
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Regional Medical Facilities & Trauma Hubs */}
          <div className="pt-2 border-t border-outline-variant/40">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-secondary">local_hospital</span>
                <h3 className="font-display font-bold text-sm text-on-surface uppercase tracking-wider">
                  Regional Hospitals &amp; Emergency Hubs
                </h3>
              </div>
              <span className="text-[11px] text-on-surface-variant">Matched to your travel corridor</span>
            </div>

            <div className="space-y-3.5">
              {sortedHospitalGroups.map((group, idx) => {
                const isCurrentRegion = group.keywords.some((k) =>
                  (activeRegionName || "").toLowerCase().includes(k)
                );

                return (
                  <div
                    key={group.zoneId || idx}
                    className={`rounded-2xl p-4 border transition-all ${
                      isCurrentRegion
                        ? "bg-surface-container-low border-secondary/40 shadow-xs"
                        : "bg-surface-container-low border-outline-variant/40"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className="text-xs font-bold text-on-surface font-display flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${isCurrentRegion ? "bg-secondary" : "bg-outline-variant"}`} />
                        {group.regionName}
                      </span>
                      {isCurrentRegion && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-secondary/15 text-secondary">
                          ACTIVE CORRIDOR
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      {group.facilities.map((fac, fIdx) => (
                        <div
                          key={fIdx}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-xs"
                        >
                          <div>
                            <div className="font-bold text-on-surface">{fac.name}</div>
                            <div className="text-on-surface-variant text-[11px]">{fac.type}</div>
                          </div>
                          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                            <a
                              href={`tel:${fac.phone.replace(/\s+/g, "")}`}
                              className="px-3 py-1.5 rounded-xl bg-secondary/10 hover:bg-secondary/20 text-secondary font-mono font-bold text-xs flex items-center gap-1.5 transition-colors"
                            >
                              <span className="material-symbols-outlined text-sm">call</span>
                              <span>{fac.phone}</span>
                            </a>
                            <button
                              onClick={() => handleCopy(fac.phone, fac.name)}
                              className="w-7 h-7 rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors border border-outline-variant/50 cursor-pointer"
                              title="Copy Phone Number"
                              type="button"
                            >
                              <span className="material-symbols-outlined text-xs">
                                {copiedId === fac.name ? "check" : "content_copy"}
                              </span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Offline Survival Protocol Alert */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-950 flex items-start gap-3">
            <span className="material-symbols-outlined text-lg text-amber-700 shrink-0 mt-0.5">
              offline_pin
            </span>
            <div className="space-y-0.5 leading-relaxed">
              <strong className="font-bold block text-amber-950">
                Offline Field Emergency Protocol
              </strong>
              <p className="text-amber-900">
                In remote desert or mountain passes (Cholistan, Babusar, Deosai), cellular coverage may be intermittent. Rescue 1122 and Highway Police 130 can often be reached even on weak or emergency-only cellular carrier bands.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 bg-surface-container-low border-t border-outline-variant/40 rounded-b-3xl flex items-center justify-between">
          <span className="text-xs text-on-surface-variant font-mono">
            WanderAI Safety Intelligence
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-primary text-white hover:bg-neutral-800 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            type="button"
          >
            Close Directory
          </button>
        </div>
      </div>
    </div>
  );
}
