const baseUrl = location.hostname === 'localhost'
  ? 'http://localhost:3000'
  : 'https://diestimmedesmoments.onrender.com';

let currentMonth = new Date();

document.getElementById('prevMonth').onclick = () => {
  currentMonth.setMonth(currentMonth.getMonth() - 1);
  loadSlots();
};

document.getElementById('nextMonth').onclick = () => {
  currentMonth.setMonth(currentMonth.getMonth() + 1);
  loadSlots();
};

function updateMonthLabel() {
  const label = currentMonth.toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'long'
  });
  document.getElementById('monthLabel').textContent = label;
}

async function loadSlots() {
  updateMonthLabel();

  const res = await fetch(`${baseUrl}/api/slots`);
  const data = await res.json();

  const busy = data.busy.map(b => ({
    start: new Date(b.start),
    end: new Date(b.end)
  }));

  const start = new Date(currentMonth);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setMonth(start.getMonth() + 1);

  const slotsByDay = {};

  const current = new Date(start);
  const now = new Date();

  while (current < end) {
    const day = current.getDay();
    if (day > 0 && day < 6) { // Mo–Fr
      for (let hour = 8; hour < 18; hour++) {
        const slotStart = new Date(current);
        slotStart.setHours(hour, 0, 0, 0);
        const slotEnd = new Date(slotStart);
        slotEnd.setHours(hour + 1);

        const isBusy = busy.some(b => slotStart < b.end && slotEnd > b.start);
        if (!isBusy && slotStart > now) {
          const key = slotStart.toLocaleDateString('de-DE');
          if (!slotsByDay[key]) slotsByDay[key] = [];
          slotsByDay[key].push({ start: slotStart, end: slotEnd });
        }
      }
    }
    current.setDate(current.getDate() + 1);
  }

  const container = document.getElementById('slots');
  container.innerHTML = '';

  const days = Object.keys(slotsByDay);
  if (days.length === 0) {
    container.textContent = 'Keine freien Termine verfügbar.';
    return;
  }

  days.forEach(dateStr => {
    const section = document.createElement('div');
    section.className = 'slot-day';
    const title = document.createElement('h3');
    title.textContent = dateStr;
    section.appendChild(title);

    slotsByDay[dateStr].forEach(slot => {
      const btn = document.createElement('button');
      btn.textContent = `${slot.start.getHours()}:00 – ${slot.end.getHours()}:00 Uhr`;
      btn.onclick = async () => {
        const name = prompt('Dein Name:');
        const email = prompt('Deine E-Mail:');
        if (!name || !email) return alert('Name und E-Mail sind erforderlich!');
        try {
          const res = await fetch(`${baseUrl}/api/book`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name, email,
              start: slot.start.toISOString(),
              end: slot.end.toISOString()
            })
          });
          const result = await res.json();
          if (result.success) alert('Termin erfolgreich gebucht!');
          else alert('Fehler: ' + (result.error || 'Unbekannter Fehler'));
          loadSlots();
        } catch (e) {
          alert('Fehler beim Buchen: ' + e.message);
        }
      };
      section.appendChild(btn);
    });

    container.appendChild(section);
  });
}

loadSlots();
