let imagePool = [];
let timeline = [];
let currentCard = null;
let currentRotation = 0; // Speichert die aktuelle Drehung für das gezogene Bild

// UI Elemente referenzieren
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const drawArea = document.getElementById('draw-area');
const timelineContainer = document.getElementById('timeline-container');
const modal = document.getElementById('fullscreen-modal');
const fullscreenImg = document.getElementById('fullscreen-img');

document.getElementById('btn-select-folder').addEventListener('click', selectFolder);
modal.addEventListener('click', closeModal);

// 1. Ordner einlesen
async function selectFolder() {
    try {
        const dirHandle = await window.showDirectoryPicker();
        imagePool = [];
        
        for await (const entry of dirHandle.values()) {
            if (entry.kind === 'file') {
                const file = await entry.getFile();
                if (file.type.startsWith('image/')) {
                    const yearMatch = file.name.match(/^(\d{4})_/);
                    if (yearMatch) {
                        imagePool.push({
                            url: URL.createObjectURL(file),
                            year: parseInt(yearMatch[1], 10),
                            name: file.name,
                            rotation: 0 // Jedes Bild startet mit 0 Grad
                        });
                    }
                }
            }
        }

        if (imagePool.length < 2) {
            alert("Nicht genug gültige Bilder gefunden! Bitte benenne sie nach dem Muster '1997_1.jpg'.");
            return;
        }

        startGame();
    } catch (err) {
        console.error("Fehler beim Ordnerzugriff:", err);
        alert("Zugriff verweigert oder abgebrochen.");
    }
}

// Mischen
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// 2. Spielstart
function startGame() {
    shuffle(imagePool);
    timeline = [];
    currentCard = null;
    
    const firstCard = imagePool.pop();
    timeline.push(firstCard);
    
    startScreen.classList.remove('active');
    gameScreen.classList.add('active');
    
    render();
}

// 3. Neues Bild ziehen
window.drawCard = function() {
    if (imagePool.length === 0) {
        alert("Wahnsinn! Du hast alle Bilder erfolgreich einsortiert.");
        resetGame();
        return;
    }
    currentRotation = 0; // Reset für das neue Bild
    currentCard = imagePool.pop();
    render();
}

// 4. Bild drehen
window.rotateImage = function() {
    currentRotation = (currentRotation + 90) % 360;
    const img = document.getElementById('current-draw-img');
    if (img) {
        img.style.transform = `rotate(${currentRotation}deg)`;
    }
}

// 5. Einordnung prüfen
window.placeCard = function(insertIndex) {
    const leftYear = insertIndex === 0 ? -Infinity : timeline[insertIndex - 1].year;
    const rightYear = insertIndex === timeline.length ? Infinity : timeline[insertIndex].year;
    
    if (currentCard.year >= leftYear && currentCard.year <= rightYear) {
        // Richtig platziert!
        currentCard.rotation = currentRotation;
        timeline.splice(insertIndex, 0, currentCard);
        currentCard = null;
        render();

        // Check ob gewonnen (1 Startbild + 10 richtig einsortierte = 11)
        if (timeline.length >= 11) {
            // Ein kurzes Timeout, damit das Bild erst noch gerendert wird, bevor die Nachricht kommt
            setTimeout(() => {
                alert("Herzlichen Glückwunsch! Du hast 10 Bilder richtig einsortiert und das Spiel gewonnen! 🎉");
                location.reload(); 
            }, 500);
        }
    } else {
        alert(`Leider falsch! Das Bild stammt aus dem Jahr ${currentCard.year}.`);
        resetGame();
    }
}

function resetGame() {
    location.reload(); // Einfachste Art für einen sauberen Reset
}

// 6. Benutzeroberfläche aktualisieren
function render() {
    // A) Oberer Bereich
    if (currentCard) {
        drawArea.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; gap: 15px;">
                <p style="font-weight:600; margin: 0;">Wo gehört dieses Bild hin?</p>
                <div style="padding: 20px;">
                    <img src="${currentCard.url}" class="card-img" id="current-draw-img" 
                         style="transform: rotate(${currentRotation}deg)" 
                         onclick="openFullscreen('${currentCard.url}', ${currentRotation})" />
                </div>
                <button onclick="rotateImage()" style="background-color: #94a3b8; font-size: 0.9rem; padding: 8px 16px; box-shadow: none;">
                    🔄 Bild drehen
                </button>
            </div>
        `;
    } else {
        drawArea.innerHTML = `<button onclick="drawCard()">Bild vom Stapel nehmen</button>`;
    }

    // B) Zeitleiste
    timelineContainer.innerHTML = '';
    for (let i = 0; i <= timeline.length; i++) {
        if (currentCard) {
            const btn = document.createElement('button');
            btn.className = 'insert-btn';
            btn.innerHTML = '+';
            btn.onclick = () => placeCard(i);
            timelineContainer.appendChild(btn);
        } else {
            const spacer = document.createElement('div');
            spacer.className = 'spacer';
            timelineContainer.appendChild(spacer);
        }
        
        if (i < timeline.length) {
            const cardData = timeline[i];
            const cardDiv = document.createElement('div');
            cardDiv.className = 'timeline-card';
            cardDiv.innerHTML = `
                <img src="${cardData.url}" class="card-img" 
                     style="transform: rotate(${cardData.rotation}deg)" 
                     onclick="openFullscreen('${cardData.url}', ${cardData.rotation})" />
                <div class="year-label">${cardData.year}</div>
            `;
            timelineContainer.appendChild(cardDiv);
        }
    }
}

// 7. Vollbild mit Rotations-Übergabe
window.openFullscreen = function(url, rotation = 0) {
    fullscreenImg.src = url;
    
    // Wichtig: Wir wenden die Drehung hier direkt auf das Vollbild-Element an
    fullscreenImg.style.transform = `rotate(${rotation}deg)`;
    
    modal.classList.remove('hidden');
    modal.classList.add('active');
}

function closeModal() {
    modal.classList.remove('active');
    modal.classList.add('hidden');
    // Zurücksetzen für das nächste Mal
    fullscreenImg.style.transform = "rotate(0deg)";
}