"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Trip, ItineraryDay, ItineraryItem } from "@/types";
import { SITE_URL } from "@/lib/siteConfig";

interface ExportDossierModalProps {
  isOpen?: boolean;
  onClose: () => void;
  trip: Trip;
  days?: ItineraryDay[];
  destLoc?: {
    name?: string;
    province?: string;
    latitude?: number;
    longitude?: number;
  };
  totalCost?: number;
}

export default function ExportDossierModal({
  isOpen = true,
  onClose,
  trip,
  days = trip.active_itinerary?.days || [],
  destLoc,
  totalCost = 0,
}: ExportDossierModalProps) {
  const [activeTab, setActiveTab] = useState<"dossier" | "calendar" | "share">("dossier");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const destinationName = destLoc?.name || trip.title;
  const startDateStr = trip.start_date ? String(trip.start_date) : new Date().toISOString().split("T")[0];

  // Helper to generate RFC 5545 iCalendar format string
  const generateICS = () => {
    const lines: string[] = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//WanderAI Intelligence Inc//Expedition Planner//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      `X-WR-CALNAME:WanderAI: ${trip.title}`,
      "X-WR-TIMEZONE:Asia/Karachi",
    ];

    const baseDate = new Date(startDateStr);

    days.forEach((day) => {
      const dayOffset = (day.day_number || 1) - 1;
      const eventDate = new Date(baseDate);
      eventDate.setDate(baseDate.getDate() + dayOffset);

      const year = eventDate.getFullYear();
      const month = String(eventDate.getMonth() + 1).padStart(2, "0");
      const dateNum = String(eventDate.getDate()).padStart(2, "0");
      const datePrefix = `${year}${month}${dateNum}`;

      day.items.forEach((item, idx) => {
        const placeName = item.place?.name || `Waypoint #${idx + 1}`;
        const startTimeRaw = item.start_time || "09:00";
        const endTimeRaw = item.end_time || "11:00";

        const startParts = startTimeRaw.split(":");
        const endParts = endTimeRaw.split(":");

        const startHour = (startParts[0] || "09").padStart(2, "0");
        const startMin = (startParts[1] || "00").padStart(2, "0");
        const endHour = (endParts[0] || "11").padStart(2, "0");
        const endMin = (endParts[1] || "00").padStart(2, "0");

        const dtStart = `${datePrefix}T${startHour}${startMin}00`;
        const dtEnd = `${datePrefix}T${endHour}${endMin}00`;

        const desc = [
          `WanderAI Scheduled Stop: Day ${day.day_number} (#${idx + 1})`,
          item.place?.category?.name ? `Category: ${item.place.category.name}` : "",
          item.estimated_cost ? `Estimated Admission: PKR ${item.estimated_cost.toLocaleString()}` : "",
          item.notes ? `Waypoint Notes: ${item.notes}` : "",
          `Expedition: ${trip.title}`,
          `Navigation: https://www.google.com/maps/dir/?api=1&destination=${item.place?.latitude || 31.52},${item.place?.longitude || 74.35}`,
        ]
          .filter(Boolean)
          .join("\\n");

        lines.push(
          "BEGIN:VEVENT",
          `UID:${trip.id}-day${day.day_number}-item${item.id || idx}@wanderai.travel`,
          `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
          `DTSTART;TZID=Asia/Karachi:${dtStart}`,
          `DTEND;TZID=Asia/Karachi:${dtEnd}`,
          `SUMMARY:[WanderAI] ${placeName} (Day ${day.day_number})`,
          `DESCRIPTION:${desc}`,
          `LOCATION:${placeName}, ${destinationName}, Pakistan`,
          "STATUS:CONFIRMED",
          "END:VEVENT"
        );
      });
    });

    lines.push("END:VCALENDAR");
    return lines.join("\r\n");
  };

  const handleDownloadICS = () => {
    const icsContent = generateICS();
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const cleanTitle = trip.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    link.download = `wanderai-${cleanTitle}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const shareUrl = `${SITE_URL}/trips/${trip.id}`;
  const shareText = `Check out my ${trip.duration_days}-day itinerary for ${destinationName} generated with WanderAI:\n${shareUrl}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
      {/* Modal Card */}
      <div className="bg-surface-container-lowest text-on-surface rounded-3xl border border-outline-variant/60 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant/40 bg-surface-container-low flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-secondary/15 border border-secondary/30 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-xl">folder_shared</span>
            </div>
            <div>
              <h2 className="font-display font-bold text-base sm:text-lg text-on-surface">
                Expedition Dossier &amp; Export
              </h2>
              <p className="text-xs text-on-surface-variant font-mono">
                {trip.title} · {destinationName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 bg-surface-container-low/50 border-b border-outline-variant/40 flex items-center gap-2 shrink-0 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab("dossier")}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
              activeTab === "dossier"
                ? "text-secondary border-secondary bg-surface-container-lowest"
                : "text-on-surface-variant border-transparent hover:text-on-surface"
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-base">picture_as_pdf</span>
            <span>Printable Dossier &amp; PDF</span>
          </button>

          <button
            onClick={() => setActiveTab("calendar")}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
              activeTab === "calendar"
                ? "text-secondary border-secondary bg-surface-container-lowest"
                : "text-on-surface-variant border-transparent hover:text-on-surface"
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-base">event</span>
            <span>Calendar Sync (.ics)</span>
          </button>

          <button
            onClick={() => setActiveTab("share")}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
              activeTab === "share"
                ? "text-secondary border-secondary bg-surface-container-lowest"
                : "text-on-surface-variant border-transparent hover:text-on-surface"
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-base">share</span>
            <span>Share Link</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* TAB 1: DOSSIER & PRINT VIEW */}
          {activeTab === "dossier" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-secondary/10 border border-secondary/20">
                <div className="space-y-0.5">
                  <h3 className="font-bold text-sm text-secondary flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base">print</span>
                    Print / Save as Offline PDF
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    Generates a high-density, printable field document with day-by-day coordinates, time windows, and emergency helplines.
                  </p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2.5 rounded-xl bg-secondary text-white hover:bg-secondary-dark font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
                  type="button"
                >
                  <span className="material-symbols-outlined text-base">print</span>
                  <span>Print Dossier</span>
                </button>
              </div>

              {/* Printable Dossier Preview Frame */}
              <div id="printable-dossier-content" className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/60 space-y-6 font-sans">
                {/* Dossier Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-outline-variant/60">
                  <div>
                    <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-secondary">
                      WanderAI Verified Travel Dossier
                    </span>
                    <h2 className="font-display text-xl sm:text-2xl font-black text-on-surface mt-1">
                      {trip.title}
                    </h2>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {destinationName} · {trip.duration_days} Days · Pacing: {trip.pace || "Moderate"}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-xs font-mono font-bold text-secondary">
                      Budget: PKR {(trip.total_budget || totalCost).toLocaleString()}
                    </div>
                    <div className="text-[11px] text-on-surface-variant">
                      Start Date: {startDateStr}
                    </div>
                  </div>
                </div>

                {/* Regional Emergency Contacts Strip */}
                <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/60 space-y-2">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-red-600 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">emergency</span>
                    Regional Emergency Helplines &amp; Dispatch
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-surface-container-low">
                      <span className="text-[10px] text-on-surface-variant block">Emergency Ambulance</span>
                      <strong className="font-bold text-on-surface">Rescue 1122</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-surface-container-low">
                      <span className="text-[10px] text-on-surface-variant block">Tourist Police</span>
                      <strong className="font-bold text-on-surface">1422 (GB / KP)</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-surface-container-low">
                      <span className="text-[10px] text-on-surface-variant block">PTDC Tourism Desk</span>
                      <strong className="font-bold text-on-surface">051-9212824</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-surface-container-low">
                      <span className="text-[10px] text-on-surface-variant block">Highway Police</span>
                      <strong className="font-bold text-on-surface">NH&amp;MP 130</strong>
                    </div>
                  </div>
                </div>

                {/* Day-by-Day Stops Table */}
                <div className="space-y-4">
                  <h4 className="font-display font-bold text-sm text-on-surface">
                    Itinerary Chronology &amp; Waypoints
                  </h4>

                  {days.map((day) => (
                    <div key={day.id || day.day_number} className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/50 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
                        <span className="font-display font-bold text-xs text-secondary flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm">calendar_today</span>
                          Day {day.day_number} · {day.items?.length || 0} Waypoints
                        </span>
                        <span className="text-[11px] text-on-surface-variant font-mono">
                          {typeof day.weather_context === "string" ? day.weather_context : (day.weather_context as any)?.condition || "Optimal weather passability"}
                        </span>
                      </div>

                      <div className="divide-y divide-outline-variant/30">
                        {day.items?.map((item: ItineraryItem, idx: number) => {
                          const placeName = item.place?.name || `Stop ${idx + 1}`;
                          const navUrl = item.place?.latitude && item.place?.longitude
                            ? `https://www.google.com/maps/dir/?api=1&destination=${item.place.latitude},${item.place.longitude}`
                            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeName + " " + destinationName)}`;

                          return (
                            <div key={item.id || idx} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                              <div className="flex items-start gap-2.5 min-w-0">
                                <span className="w-5 h-5 rounded-full bg-secondary/15 text-secondary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                                  {idx + 1}
                                </span>
                                <div className="min-w-0">
                                  <h5 className="font-bold text-on-surface">
                                    {placeName}
                                  </h5>
                                  <p className="text-[11px] text-on-surface-variant">
                                    {item.place?.category?.name || "Attraction"} · {item.visit_duration_minutes || 60} mins · {item.notes || item.place?.description || "Audited waypoint"}
                                  </p>
                                </div>
                              </div>

                              <div className="flex flex-col items-end shrink-0 gap-1">
                                <span className="font-mono text-[11px] font-bold text-secondary">
                                  {item.start_time || "09:00"}–{item.end_time || "11:00"}
                                </span>
                                <a
                                  href={navUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[10px] text-secondary hover:underline flex items-center gap-0.5 font-bold"
                                >
                                  <span>GPS Nav</span>
                                  <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CALENDAR SYNC (.ICS) */}
          {activeTab === "calendar" && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/60 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-secondary/15 text-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">event_available</span>
                </div>
                <div className="space-y-1">
                  <h3 className="font-display font-bold text-base text-on-surface">
                    Sync Itinerary to Google / Apple Calendar
                  </h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Export all your scheduled stops, transit windows, admission costs, and waypoint notes into a universal <strong>.ics</strong> file compatible with Google Calendar, Apple Calendar, Outlook, and mobile calendar apps.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/40 space-y-2 text-xs">
                  <h4 className="font-mono font-bold uppercase text-[11px] text-secondary">Included in Export:</h4>
                  <ul className="space-y-1 text-on-surface-variant list-disc pl-4">
                    <li>All {days.reduce((acc, d) => acc + (d.items?.length || 0), 0)} scheduled waypoints with exact start &amp; end times</li>
                    <li>GPS coordinates &amp; direct navigation links in event description</li>
                    <li>Admission fee estimates &amp; category metadata</li>
                  </ul>
                </div>

                <button
                  onClick={handleDownloadICS}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-secondary text-white hover:bg-secondary-dark font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-base">download</span>
                  <span>Download Calendar File (.ics)</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: SHARE LINK */}
          {activeTab === "share" && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/60 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-secondary/15 text-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">link</span>
                </div>
                <div className="space-y-1">
                  <h3 className="font-display font-bold text-base text-on-surface">
                    Share Expedition with Travel Companions
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    Send your live expedition link or share directly via WhatsApp with family or travel group members.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono text-on-surface-variant block">
                    Public Expedition URL:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={shareUrl}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/60 text-xs font-mono text-on-surface focus:outline-none"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-4 py-2.5 rounded-xl bg-secondary text-white hover:bg-secondary-dark font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-base">
                        {copied ? "check" : "content_copy"}
                      </span>
                      <span>{copied ? "Copied!" : "Copy Link"}</span>
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap gap-2">
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-xs shadow-sm transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">chat</span>
                    <span>Share on WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
