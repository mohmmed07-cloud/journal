import React, { useState, useEffect } from 'react';
import './App.css';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'daily', label: 'Daily' },
  { id: 'travel', label: 'Travel' },
  { id: 'thoughts', label: 'Thoughts' },
  { id: 'moments', label: 'Moments' },
];

const MOOD_TAGS = [
  '✨ Cozy',
  '☕ Calm',
  '🌿 Grateful',
  '⚡ Excited',
  '🌧️ Melancholy',
  '🎯 Inspired',
  '🌸 Joyful',
];

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function App() {
  // 1. PIN Lock
  const [isLocked, setIsLocked] = useState(true);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const correctPin = '1234';

  // 2. Entries State
  const [entries, setEntries] = useState(() => {
    try {
      const saved = localStorage.getItem('sketch_diary_entries');
      return saved
        ? JSON.parse(saved)
        : [
            {
              id: 1,
              date: '2026-09-14',
              displayDate: 'Mon, Sep 14, 2026',
              text: 'Collect moments, not things.\n\nToday was remarkably quiet and cozy. Took a long morning stroll, enjoyed a freshly brewed dark roast, and felt genuinely grateful for the simple, peaceful moments.',
              photos: [
                'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1511497584788-87676104235f?w=800&auto=format&fit=crop&q=80',
              ],
              caption: 'A gentle sunset ✨',
              category: 'daily',
              mood: '☕ Calm',
              notes: [
                'Captured on Mon, Sep 14, 2026',
                'Mood: ☕ Calm',
                'Saved in Field Notes Diary',
              ],
            },
          ];
    } catch {
      return [];
    }
  });

  // 3. Navigation & Filtering states
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [currentEntryIndex, setCurrentEntryIndex] = useState(0);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // 4. Calendar State
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState(new Date(2026, 8, 1)); // September 2026

  // 5. Modal Add States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [caption, setCaption] = useState('');
  const [selectedMood, setSelectedMood] = useState('✨ Cozy');
  const [sideNotes, setSideNotes] = useState('');
  const [category, setCategory] = useState('daily');

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('sketch_diary_entries', JSON.stringify(entries));
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        alert('Storage quota exceeded! Please clear old data.');
      }
    }
  }, [entries]);

  useEffect(() => {
    setCurrentPhotoIndex(0);
  }, [currentEntryIndex]);

  // Unlock Handler
  const handleUnlock = (e) => {
    e.preventDefault();
    if (pin === correctPin) {
      setIsLocked(false);
      setPinError(false);
      setPin('');
    } else {
      setPinError(true);
      setPin('');
    }
  };

  // Multiple image upload with auto compression
  const handleMultipleFilesUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 750;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const compressed = canvas.toDataURL('image/jpeg', 0.75);
          setUploadedPhotos((prev) => [...prev, compressed]);
        };
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhotoFromUpload = (index) => {
    setUploadedPhotos((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Save new entry
  const handleSaveEntry = (e) => {
    e.preventDefault();
    if (!noteText && uploadedPhotos.length === 0) return;

    const now = new Date();
    const isoDate = now.toISOString().split('T')[0];
    const newEntry = {
      id: Date.now(),
      date: isoDate,
      displayDate: now.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      text: noteText,
      photos: uploadedPhotos,
      caption: caption || 'Polaroid Memory',
      category: category,
      mood: selectedMood,
      notes: sideNotes
        ? sideNotes.split('\n').filter((n) => n.trim())
        : [
            `Captured on ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
            `Mood: ${selectedMood}`,
            'Saved in Field Notes Diary',
          ],
    };

    setEntries([newEntry, ...entries]);
    setNoteText('');
    setUploadedPhotos([]);
    setCaption('');
    setSideNotes('');
    setIsModalOpen(false);
    setSelectedDate('');
    setCurrentEntryIndex(0);
  };

  // Delete current entry
  const handleDeleteCurrentEntry = (id) => {
    if (!id) return;
    const confirmDelete = window.confirm('Are you sure you want to delete this scrapbook entry?');
    if (confirmDelete) {
      const updated = entries.filter((item) => item.id !== id);
      setEntries(updated);
      if (currentEntryIndex > 0) {
        setCurrentEntryIndex(currentEntryIndex - 1);
      }
    }
  };

  // Filter entries
  const filteredEntries = entries.filter((item) => {
    const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
    const matchDate = !selectedDate || item.date === selectedDate;
    return matchCat && matchDate;
  });

  const currentEntry = filteredEntries[currentEntryIndex];

  // ==================== Calendar Generation Helper ====================
  const year = calendarViewDate.getFullYear();
  const month = calendarViewDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  // مجموعة كل التواريخ التي تمت الكتابة فيها بصيغة YYYY-MM-DD
  const datesWithEntries = new Set(entries.map((e) => e.date));

  const handlePrevMonth = () => {
    setCalendarViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarViewDate(new Date(year, month + 1, 1));
  };

  const handleSelectDateFromCalendar = (dayNumber) => {
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(dayNumber).padStart(2, '0');
    const clickedDate = `${year}-${formattedMonth}-${formattedDay}`;

    if (datesWithEntries.has(clickedDate)) {
      setSelectedDate(clickedDate);
      setCurrentEntryIndex(0);
      setIsCalendarOpen(false);
    }
  };

  // ==================== 1. Lock Screen ====================
  if (isLocked) {
    return (
      <div className="lock-screen-wrap">
        <div className="lock-box-modal">
          <div className="washi-tape"></div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', marginBottom: '6px' }}>Private Diary</h2>
          <p style={{ fontSize: '11px', color: '#776' }}>PIN: 1234</p>
          <form onSubmit={handleUnlock}>
            <input
              type="password"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              className="lock-input"
              autoFocus
            />
            {pinError && <p style={{ color: '#b91c1c', fontSize: '12px' }}>Incorrect passcode</p>}
            <button type="submit" className="btn-add" style={{ width: '100%', borderRadius: '6px' }}>
              Unlock
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==================== 2. Fullscreen Scrapbook Workspace ====================
  return (
    <div className="full-screen-board">
      {/* Top Navbar */}
      <header className="canvas-navbar-full">
        <span className="brand-title">Field Notes</span>

        <div className="nav-actions">
          <button className="btn-add" onClick={() => setIsModalOpen(true)}>
            + Add
          </button>

          {/* زر التقويم التفاعلي */}
          <button
            className={`btn-nav-tool ${isCalendarOpen || selectedDate ? 'active-tool' : ''}`}
            onClick={() => setIsCalendarOpen(true)}
            title="Open Tracker Calendar"
          >
            📅 Calendar
          </button>

          <button className="btn-nav-tool" onClick={() => window.print()}>
            🖨️ Print
          </button>

          {currentEntry && (
            <button
              className="btn-nav-tool btn-nav-delete"
              onClick={() => handleDeleteCurrentEntry(currentEntry.id)}
              title="Delete this entry"
            >
              🗑️ Delete
            </button>
          )}

          <button className="btn-nav-tool" onClick={() => setIsLocked(true)}>
            🔒 Lock
          </button>
        </div>
      </header>

      {/* Categories & Filter Bar */}
      <div className="filter-bar-full">
        <div className="categories-tags-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`tag-btn ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => {
                setSelectedCategory(cat.id);
                setCurrentEntryIndex(0);
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* عرض اليوم المختار من الكالندر مع إمكانية مسحه */}
        {selectedDate && (
          <div className="active-date-pill">
            <span>Filtered by Date: <strong>{selectedDate}</strong></span>
            <button className="clear-date-btn" onClick={() => setSelectedDate('')}>
              ✕ Clear
            </button>
          </div>
        )}
      </div>

      {/* Main Workspace */}
      <main className="full-workspace">
        {!currentEntry ? (
          <div style={{ textAlign: 'center', gridColumn: '1 / -1', color: '#887' }}>
            <p style={{ fontSize: '18px', marginBottom: '8px' }}>No entries found for this filter.</p>
            {selectedDate && (
              <button
                className="tag-btn"
                style={{ background: '#3e2d1d', color: '#fff', padding: '6px 16px' }}
                onClick={() => setSelectedDate('')}
              >
                Show All Dates
              </button>
            )}
          </div>
        ) : (
          <>
            {/* LEFT: Cutout Note Card (TEXT.png) */}
            <div className="scrap-text-wrapper">
              <div className="scrap-text-box">
                <div className="scrap-text-content">{currentEntry.text}</div>
                <div className="card-footer-action">
                  <button
                    className="inline-delete-btn"
                    onClick={() => handleDeleteCurrentEntry(currentEntry.id)}
                    title="Remove this note"
                  >
                    🗑️ Remove Page
                  </button>
                </div>
              </div>
            </div>

            {/* CENTER: Polaroid Multi-Photo Display */}
            <div className="scrap-polaroid-container">
              <button
                className="arrow-circle-btn"
                disabled={!currentEntry.photos || currentEntry.photos.length <= 1 || currentPhotoIndex === 0}
                onClick={() => setCurrentPhotoIndex((prev) => prev - 1)}
                title="Prev Photo"
              >
                ←
              </button>

              <div className="polaroid-frame-main">
                <div className="washi-tape"></div>
                {currentEntry.photos && currentEntry.photos.length > 0 ? (
                  <img
                    src={currentEntry.photos[currentPhotoIndex]}
                    alt="Memory"
                    className="polaroid-img-box"
                  />
                ) : (
                  <div className="polaroid-empty">No Photo Attached</div>
                )}
                <div className="polaroid-title">{currentEntry.caption}</div>
                <div className="polaroid-date-stamp">{currentEntry.displayDate || currentEntry.date}</div>

                {currentEntry.photos && currentEntry.photos.length > 1 && (
                  <div className="polaroid-counter">
                    Photo {currentPhotoIndex + 1} of {currentEntry.photos.length}
                  </div>
                )}
              </div>

              <button
                className="arrow-circle-btn"
                disabled={!currentEntry.photos || currentEntry.photos.length <= 1 || currentPhotoIndex >= currentEntry.photos.length - 1}
                onClick={() => setCurrentPhotoIndex((prev) => prev + 1)}
                title="Next Photo"
              >
                →
              </button>
            </div>

            {/* RIGHT: Side Reflections Sticky Note */}
            <div className="scrap-side-note">
              <div className="washi-tape"></div>
              <h4>Daily Reflections</h4>
              <ul className="side-note-list">
                {currentEntry.mood && (
                  <li style={{ color: '#945327', fontWeight: 'bold' }}>
                    Mood: {currentEntry.mood}
                  </li>
                )}
                {currentEntry.notes && currentEntry.notes.length > 0 ? (
                  currentEntry.notes.map((note, idx) => <li key={idx}>{note}</li>)
                ) : (
                  <>
                    <li>Captured on {currentEntry.displayDate || currentEntry.date}</li>
                    <li>Saved in Field Notes Diary</li>
                  </>
                )}
              </ul>
            </div>
          </>
        )}
      </main>

      {/* Bottom Navigation */}
      {filteredEntries.length > 0 && (
        <footer className="bottom-footer-full">
          <button
            className="btn-nav-full"
            disabled={currentEntryIndex >= filteredEntries.length - 1}
            onClick={() => setCurrentEntryIndex((prev) => prev + 1)}
          >
            Older Entry →
          </button>

          <span style={{ fontSize: '14px', color: '#4a3726', fontFamily: 'Caveat, cursive', fontWeight: 'bold' }}>
            Entry {currentEntryIndex + 1} of {filteredEntries.length}
          </span>

          <button
            className="btn-nav-full"
            disabled={currentEntryIndex === 0}
            onClick={() => setCurrentEntryIndex((prev) => prev - 1)}
          >
            ← Newer Entry
          </button>
        </footer>
      )}

      {/* ==================== 3. Calendar Tracker Modal ==================== */}
      {isCalendarOpen && (
        <div className="modal-overlay">
          <div className="modal-content calendar-card-modal">
            <div className="washi-tape"></div>
            <div className="calendar-header-nav">
              <button className="cal-nav-btn" onClick={handlePrevMonth}>&lt;</button>
              <span className="cal-month-title">
                {calendarViewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button className="cal-nav-btn" onClick={handleNextMonth}>&gt;</button>
            </div>

            {/* تقويم الشبكة */}
            <div className="calendar-grid">
              {WEEKDAYS.map((wd) => (
                <div key={wd} className="cal-weekday">{wd}</div>
              ))}

              {/* فراغات بداية الشهر */}
              {Array.from({ length: firstDayIndex }).map((_, idx) => (
                <div key={`empty-${idx}`} className="cal-day-cell empty"></div>
              ))}

              {/* أيام الشهر مع طابع اليوميات */}
              {Array.from({ length: totalDays }).map((_, idx) => {
                const day = idx + 1;
                const formattedMonth = String(month + 1).padStart(2, '0');
                const formattedDay = String(day).padStart(2, '0');
                const dayDateString = `${year}-${formattedMonth}-${formattedDay}`;
                const hasEntry = datesWithEntries.has(dayDateString);
                const isSelected = selectedDate === dayDateString;

                return (
                  <div
                    key={day}
                    className={`cal-day-cell ${hasEntry ? 'has-entry' : ''} ${isSelected ? 'selected-day' : ''}`}
                    onClick={() => handleSelectDateFromCalendar(day)}
                    title={hasEntry ? 'View memory from this day' : ''}
                  >
                    <span>{day}</span>
                    {hasEntry && <span className="stamp-dot">✦</span>}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
              <span style={{ fontSize: '11px', color: '#7a6752' }}>✦ = Days with recorded memories</span>
              <button
                className="btn-nav-tool"
                onClick={() => setIsCalendarOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 4. Modal Popup (+ Add) ==================== */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="washi-tape"></div>
            <h3>Tape New Memory 📌</h3>
            <form onSubmit={handleSaveEntry}>
              {/* Category */}
              <div className="form-group">
                <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Category</label>
                <select
                  className="form-control"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mood Tags */}
              <div className="form-group">
                <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Mood Tag</label>
                <div className="mood-tags-container">
                  {MOOD_TAGS.map((mood) => (
                    <button
                      type="button"
                      key={mood}
                      className={`mood-tag-item ${selectedMood === mood ? 'active' : ''}`}
                      onClick={() => setSelectedMood(mood)}
                    >
                      {mood}
                    </button>
                  ))}
                </div>
              </div>

              {/* Multiple Photos Upload */}
              <div className="form-group">
                <label style={{ fontSize: '11px', fontWeight: 'bold' }}>
                  Polaroid Photos (Select one or more)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleMultipleFilesUpload}
                  className="form-control"
                />

                {uploadedPhotos.length > 0 && (
                  <div className="multi-img-preview-row">
                    {uploadedPhotos.map((src, idx) => (
                      <div key={idx} className="img-preview-thumb">
                        <img src={src} alt="thumb" />
                        <button
                          type="button"
                          className="thumb-remove-btn"
                          onClick={() => handleRemovePhotoFromUpload(idx)}
                          title="Remove photo"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Caption */}
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Photo caption..."
                  className="form-control"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                />
              </div>

              {/* Main Text Note */}
              <div className="form-group">
                <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Main Text Note</label>
                <textarea
                  rows={4}
                  placeholder="Write your story here..."
                  className="form-control"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                />
              </div>

              {/* Side Reflections */}
              <div className="form-group">
                <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Side Reflections (One bullet per line)</label>
                <textarea
                  rows={2}
                  placeholder="Morning walk in the woods&#10;Made lavender tea"
                  className="form-control"
                  value={sideNotes}
                  onChange={(e) => setSideNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '15px' }}>
                <button type="submit" className="btn-add" style={{ flex: 1, borderRadius: '6px' }}>
                  Save Page
                </button>
                <button
                  type="button"
                  className="btn-nav-tool"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}