import * as THREE from "https://esm.sh/three@0.160.0";
import { OrbitControls } from "https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";
import { OBJLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/OBJLoader.js";
import { DRACOLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/DRACOLoader.js";

// Eigene Module
import { initRightSidebar } from "./js/modules/ui.js"; 
import { toggleAvatar, toggleAvatarView, isFirstPersonActive } from "./js/modules/avatar.js";

// === 1. Setup & Globale Variablen ===
window.app = {}; 

const GLOBAL_SCALE = 0.6; 
const FURNITURE_Y_OFFSET = 0.22; // Standardhöhe für Möbel
const VISION_LAYER_HEIGHT = 2.2; 
const TOP_VIEW_HEIGHT = 18; 

// Glossar Texte & Pädagogische Tipps  
const SIM_GLOSSARY = {  
    // Visus  
    normal: { title: "Normale Sicht", text: "Keine Einschränkungen aktiv.", tip: "" },  
    low: { 
        title: "Sehbehinderung (z.B. Myopie, Hyperopie, Astigmatismus)",  
        text: "Visus < 0.3. Details an der Tafel oder in Büchern sind nur schwer erkennbar. Vergrößerungshilfen sind nötig. Bei Kindern meistens durch Fehlbildung des Augapfels oder asymmetrische Hornhautkrümmung.",  
        tip: "Vergrößerte Arbeitsblätter (A3) anbieten. Tafelbild verbalisieren (alles laut vorlesen). Sitzplatz nah an der Tafel."  
    },  
    severe: {  
        title: "Hochgradige Sehbehinderung",  
        text: "Visus < 0.05. Orientierung ist noch möglich, aber Lesen normaler Schrift ist unmöglich.",  
        tip: "Digitale Hilfsmittel (Tablet mit Zoom/VoiceOver) zulassen. Taktile Leitsysteme im Raum freihalten. Starke Kontraste bei Farben, Linien und Texturen nutzen."  
    },  
    blind: {  
        title: "Blindheit",  
        text: "Visus < 0.02. Visuelle Informationen fehlen fast vollständig. Tast- und Hörsinn sind entscheidend.",  
        tip: "Fester Sitzplatz (Orientierung). Materialien digital barrierefrei oder in Braille bereitstellen. Laufwege zwingend freihalten!"  
    },  

    // Gesichtsfeld  
    tunnel: {  
        title: "Retinitis Pigmentosa (RP) / Tunnelblick",  
        text: "Verlust der Peripherie (Röhrengesichtsfeld/Tunnelblick), Nachtblindheit. Orientierung im Raum ist massiv erschwert, zentrales Lesen oft noch gut möglich.",  
        tip: "Ordnung halten! Taschen gehören nicht in den Gang (Stolperfallen). Schüler zentral vor die Tafel setzen (nicht seitlich)."  
    },  
    spot: {  
        title: "Juvenile Makuladegeneration (Morbus Stargardt, Best)",  
        text: "Einschränkung des zentralen Gesichtsfelds. Verzerrung von Formen bis hin zu komplettem Ausfall. Gesichter und Texte können nicht fixiert werden. Orientierung im Raum funktioniert über peripheres Sehen.",  
        tip: "Schüler schaut oft 'daneben', um zu sehen – das ist kein Desinteresse! Vergrößerung hilft oft nicht (fällt in den toten Winkel)."  
    },  
    scotoma: {  
        title: "Parazentralskotom",  
        text: "Inselförmige Ausfälle neben dem Zentrum, bspw. als Folge von Makuladegeneration oder des Glaukoms. Buchstaben oder Wörter 'springen' oder fehlen beim Lesen.",  
        tip: "Geduld beim Lesen. Serifenlose, klare Schriftarten (Arial, Verdana) mit erhöhtem Zeilenabstand nutzen."  
    },  
    hemi: {  
        title: "Hemianopsie (Rechts)",  
        text: "Rechtsseitiger Ausfall (z. B. nach Schlaganfall). Die rechte Hälfte der Welt fehlt.",  
        tip: "Sitzplatz LINKS im Raum wählen, damit das Geschehen im gesunden (linken) Sichtfeld liegt. Schüler nicht von rechts ansprechen."  
    },  
    'hemi-l': {  
        title: "Hemianopsie (Links)",  
        text: "Linksseitiger Ausfall. Die linke Hälfte der Welt fehlt.",  
        tip: "Sitzplatz RECHTS im Raum wählen. Achtung bei Gruppenarbeit: Partner sollte rechts sitzen."  
    },  
    quadrant: {  
        title: "Quadrantenanopsie",  
        text: "Ausfall eines Viertels (hier oben rechts). Kann beim Blick auf die Tafel stören.",  
        tip: "Tafelbild kompakt halten. Prüfen, ob der Schüler den oberen Tafelrand sehen kann, ohne den Kopf extrem zu verrenken."  
    },  
    ring: {  
        title: "Ringskotom",  
        text: "Ein blinder Ring um das Zentrum, bspw. als Folge von Retinits Pigmentosa. Objekte verschwinden beim Näherkommen kurzzeitig.",  
        tip: "Vorsicht im Sportunterricht (Bälle verschwinden plötzlich). Klare Absprachen bei Bewegungen im Raum."  
    },  

    // Licht & Trübung  
    cataract: {  
        title: "Katarakt (Grauer Star)",  
        text: "Trübung der Linse. Alles wirkt milchig. Hohe Blendempfindlichkeit bei Gegenlicht. Reduzierte Farbintensität.",  
        tip: "Platz mit Rücken zum Fenster. Jalousien nutzen, um Blendung auf der Tafel zu vermeiden. Hohe Kontraste an der Tafel (Gelb auf Blau). Große weiße Flächen vermeiden."  
    },  
    glaucoma: {  
        title: "Glaukom (Grüner Star)",  
        text: "Überhöhter Augeninnendruck. Schleichender, schmerzfreier Prozess. Oft Mischung aus Gesichtsfeldausfällen (bogenförmige, blinde Flecken) und Nebel.",  
        tip: "Stressfreies Sehumfeld schaffen. Pausen für die Augen einplanen. Gute, blendfreie Raumbeleuchtung sicherstellen. In fortgeschrittenen Stadien auf taktile Materialien setzen."  
    },  
    photophobia: {  
        title: "Extreme Photophobie",  
        text: "Lichtschmerz (z. B. bei Albinismus). Normale Raumbeleuchtung blendet massiv. Kontraste verschwinden. Hinweis: Lichtgazing als gegensätzliche Folge von CVI.",  
        tip: "Dunkelster Platz im Raum (Ecke). Erlaubnis für Sonnenbrille/Kappi im Unterricht. 'Dark Mode' auf Tablets nutzen."  
    },  
    nyctalopia: {  
        title: "Nachtblindheit",  
        text: "Sehversagen bei Dämmerung. Im dunklen Klassenzimmer (Beamer) orientierungslos.",  
        tip: "Bei Filmvorführungen/Beamer-Einsatz: Schüler nicht im Raum umherlaufen lassen. Kleine Platzbeleuchtung erlauben."  
    },  
    retina: {  
        title: "Diabetische / Frühgeborenen-Retinopathie",  
        text: "Fleckige Ausfälle (Skotome) im ganzen Bild bis hin zu kompletter Netzhautablösung (Erblindung). Tagesform schwankt stark.",  
        tip: "Flexibilität bei der Leistungserwartung (Tagesform). Kopien in sehr guter Qualität (keine blassen Matrizen)."  
    },  

    // Neuro & Verarbeitung  
    cvi: {  
        title: "CVI (Zerebrale Sehstörung)",  
        text: "Oberbegriff. Gehirn kann visuelle Reize nicht (komplett) verarbeiten. 'Wimmelbilder' (voller Raum) führen zu Wahrnehmungsstörungen, die zu Stress/Orientierungsverlust führen.",  
        tip: "Reizreduktion! Arbeitsblätter entschlacken (nur eine Aufgabe pro Seite). Ruhiger Sitzplatz (Wandblick, nicht in den Raum)."  
    },  
    crowding: {  
        title: "Crowding",  
        text: "Visuelle Überfüllung. Einzelne Objekte in ruhiger Umgebung werden erkannt. Eng stehende/viele Objekte verschmelzen miteinander.",  
        tip: "Größerer Buchstabenabstand und Zeilenabstand. Abdeckschablone beim Lesen nutzen. Visuelle Komplexität massiv reduzieren (≠ 'Aufgaben einfacher machen'!)."  
    },  
    neglect: {
        title: "Neglect",
        text: "Halbseitige Vernachlässigung des Raumes. Neurologisch bedingt wird die Hälfte der visuellen Informationen vernachlässigt.",
        tip: "Sitzplatz entsprechend der gesunden Gesichtsfeldhälfte wählen."
    },
    metamorphopsia: {  
        title: "Metamorphopsie",  
        text: "Verzerrtsehen, meist als Folge von Makuladegeneration. Gerade Linien (Tafel, Karopapier) wirken wellig. Lesen/Schreiben erschwert.",  
        tip: "Linienverstärktes Papier anbieten. Schreiben am Tablet erlauben (Zoom/Raster hilft)."  
    },  
    diplopia: {  
        title: "Diplopie (Doppelbilder)",  
        text: "Bilder decken sich nicht. Führt zu Kopfschmerzen, Übelkeit und Greif-Fehlern. Betroffene ermüden schnell.",  
        tip: "Leseportionen einteilen. Beim Experimentieren (Chemie/Physik) Assistenz stellen."  
    },  
    noise: {  
        title: "Visual Snow",  
        text: "Dauerhaftes Bildrauschen ('Schnee'). Senkt Kontraste und erhöht die Konzentrationslast.",  
        tip: "Kognitive Pausen. Vermeidung von stark gemusterten Hintergründen auf Arbeitsblättern/Tafeln. Hohe visuelle Kontraste herstellen."  
    },
    strabismus: {
        title: "Strabismus (Schielen)",
        text: "Fehlstellung der visuellen Achsen. Doppelbilder oder Unterdrückung des Inputs des abweichenden Auges. Führt zu fehlendem räumlichen Sehen (Orientierung/Motorik).",
        tip: "Besondere Führung bei räumlichen Tätigkeiten, insbesondere im Sportunterricht. Treppensteigen vermeiden bzw. dabei unterstützen."
    },
    amblyopia: {
        title: "Amblyopie ('Lazy Eye')",
        text: "Stark unterentwickelte Sehfähigkeit auf einem Auge. Wird häufig durch Okklusionstherapie behandelt. Räumliches Sehen wird beeinträchtigt.",
        tip: "In Absprache mit Betroffenen Klasse aufklären. Besondere Führung bei räumlichen Tätigkeiten. Treppensteigen unterstützen."
    },  

    // Farbe  
    achromatopsia: {  
        title: "Achromatopsie",  
        text: "Totale Farbenblindheit. Oft verbunden mit hoher Lichtempfindlichkeit.",  
        tip: "Niemals Informationen nur über Farbe codieren! Immer Muster, Worte oder Beschriftungen nutzen (z.B. in Diagrammen)."  
    },  
    protanopia: {  
        title: "Protanomalie/Protanopie (Rot-Schwäche/-Blindheit)",  
        text: "Rot wird nicht wahrgenommen. Ampeln/Warnhinweise wirken dunkelgrau.",  
        tip: "Achtung bei Korrekturen (Roter Stift ist schwer lesbar). Rot nicht als Signalfarbe an der Tafel nutzen."  
    },  
    deuteranopia: {  
        title: "Deuteranomalie/Deuteranopie (Grün-Schwäche/-Blindheit)",  
        text: "Rot und Grün sind schwer zu unterscheiden. Relevant für Landkarten.",  
        tip: "Farbige Kreide an der Tafel vermeiden (Kontrast zu Grün/Grau schlecht). Landkarten beschriften statt färben."  
    },  
    tritanopia: {  
        title: "Tritanomalie/Tritanopie (Blau-Schwäche/-Blindheit)",  
        text: "Blau und Gelb werden verwechselt. Sehr Selten.",  
        tip: "Farbcodierungen in Unterrichtsmaterialien prüfen (nicht Gelb auf Weiß oder Blau auf Grün)."  
    }  
};

// Einstellungen
let settings = {
    controlsEnabled: true, 
    mouseSensitivity: 1.0,
    reducedMotion: false,
    fontScale: 1.0
};

// Input State
const inputState = {
    fwd: false, bwd: false, left: false, right: false,
    zoomIn: false, zoomOut: false 
};

// === ASSETS DEFINITION ===
const ASSETS = {
  rooms: {
    // Standard LLR (50qm)
    "raummodell_leer.glb": { 
        data: null, playableArea: { x: 4.4, z: 4.3 }, area: 50, name: "LLR Standard (Leer)",
        acousticTargets: { warn: 0.25, good: 0.45 } 
    },
    // NEU: GLB Version des möblierten Raums
    "50qm_möbliertglb.glb": { 
        data: null, playableArea: { x: 4.5, z: 4.5 }, area: 50, name: "LLR Möbliert (Standard)",
        acousticTargets: { warn: 0.25, good: 0.45 } 
    },
    // Großer Raum (70qm)
    "leer_70qm.glb": { 
        data: null, playableArea: { x: 5.5, z: 5.5 }, area: 70, name: "Großer Raum (70qm)",
        acousticTargets: { warn: 0.20, good: 0.40 } 
    },
    // Kleiner Raum (30qm)
    "leer_30qm.glb": { 
        data: null, playableArea: { x: 3.5, z: 3.5 }, area: 30, name: "Kleiner Raum (30qm)",
        acousticTargets: { warn: 0.35, good: 0.60 } 
    },
  },
  furniture: {
    // --- Standard Möbel ---
    'row_combo': { file: 'Tischplusstuhleinzeln.glb', dims: {x: 0.8, z: 1.2}, radius: 0.8, seats: 1, name: "Tisch+Stuhl", acousticBonus: 2.0 },
    'tano':      { file: 'trapezTisch.glb',           dims: {x: 1.2, z: 0.7}, radius: 0.6, seats: 1, name: "Trapeztisch", acousticBonus: 1.5 },
    'triangle':  { file: 'dreiecksTisch.glb',         dims: {x: 1.0, z: 0.9}, radius: 0.5, seats: 1, name: "Dreieckstisch", acousticBonus: 1.5 },
    'chair':     { file: 'roterStuhl.glb',            dims: {x: 0.5, z: 0.5}, radius: 0.4, seats: 1, name: "Stuhl", acousticBonus: 0.8 },
    'teacher':   { file: 'Lehrertisch.glb',           dims: {x: 1.6, z: 0.8}, radius: 1.0, seats: 0, name: "Lehrerpult", acousticBonus: 2.5 },
    'cupboard':  { file: 'runderSchrank.glb',         dims: {x: 1.2, z: 0.4}, radius: 0.8, seats: 0, name: "Regal (Rund)", acousticBonus: 3.5 },
    'board':     { file: 'tafel_skaliert.glb',        dims: {x: 2.0, z: 0.2}, radius: 0.2, seats: 0, isWallItem: true, name: "Tafel", acousticBonus: 1.0 },
    
    // --- NEUE ASSETS ---
    // Laptop höher gesetzt (0.86), damit er auf dem Tisch steht
    'laptop':        { file: 'Laptop.glb',         dims: {x: 0.4, z: 0.3}, radius: 0.3, seats: 0, name: "Laptop", acousticBonus: 0.1, yOffset: 1.23 }, 
    'cabinet_short': { file: 'kurzer Schrank.glb', dims: {x: 1.0, z: 0.5}, radius: 0.7, seats: 0, name: "Schrank (Kurz)", acousticBonus: 4.0 },
    'cabinet_long':  { file: 'langer_Schrank.glb', dims: {x: 1.8, z: 0.5}, radius: 1.0, seats: 0, name: "Schrank (Lang)", acousticBonus: 6.0 },
    'sofa':          { file: 'Sofa.glb',           dims: {x: 2.0, z: 0.9}, radius: 1.1, seats: 2, name: "Sofa", acousticBonus: 8.0 },
    'table_square':  { file: 'Quadrat_Tisch.glb',  dims: {x: 1.0, z: 1.0}, radius: 0.8, seats: 0, name: "Quadrat-Tisch", acousticBonus: 2.0 },
    'table_double':  { file: '2er_Tisch.glb',      dims: {x: 1.6, z: 0.8}, radius: 1.0, seats: 0, name: "2er Tisch", acousticBonus: 3.0 },

    // --- Prozedurale Objekte ---
    // Teppich dicker (0.04) und höherer Offset (0.02) gegen Z-Fighting
    'carpet_proc': { 
        procedural: true, type: 'box', dims: {x: 3.0, y: 0.04, z: 2.0}, color: 0x8D6E63, 
        name: "Akustik-Teppich", acousticBonus: 5.0, seats: 0, yOffset: 0.18, radius: 0.1, noShadow: true 
    },
    'partition_proc': { 
        procedural: true, type: 'box', dims: {x: 1.5, y: 1.8, z: 0.1}, color: 0x336699, 
        name: "Schallschutzwand", acousticBonus: 8.0, seats: 0, radius: 0.8, noShadow: false 
    },
    'absorber_proc': { 
        procedural: true, type: 'box', dims: {x: 1.0, y: 1.0, z: 0.05}, color: 0xcccccc, 
        name: "Wand-Absorber", acousticBonus: 3.0, seats: 0, isWallItem: true, radius: 0.1, noShadow: true, yOffset: 1.5 
    },

    // --- Avatar ---
    'avatar_procedural': { 
        data: null, name: "Avatar (Lernender)", radius: 0.4, seats: 0, acousticBonus: 0.5 
    },

    // --- Gruppenkonstellationen ---
    'k1': { file: 'Tischaufstellung1.glb',    dims: {x: 1.6, z: 1.2}, radius: 1.0, seats: 2, name: "2er Ecktisch", acousticBonus: 4.0 }, 
    'k2': { file: 'Tischaufstellung2.glb',    dims: {x: 1.6, z: 1.4}, radius: 1.1, seats: 2, name: "2er Vis-a-Vis", acousticBonus: 4.0 },
    'k3': { file: 'Tischaufstellung3.glb',    dims: {x: 3.2, z: 1.6}, radius: 1.8, seats: 8, name: "8er Gruppentisch", acousticBonus: 16.0 },
    'k4': { file: 'Tischkonstellation4.glb',  dims: {x: 3.5, z: 3.5}, radius: 2.0, seats: 8, name: "8er Kreis", acousticBonus: 16.0 },
    'k5': { file: 'Tischkonstellation5.glb',  dims: {x: 2.2, z: 2.2}, radius: 1.5, seats: 4, name: "4er Ecktisch", acousticBonus: 8.0 },
    'k6': { file: 'Tischkonstellation6.glb',  dims: {x: 3.0, z: 2.0}, radius: 1.8, seats: 6, name: "6er Gruppentisch", acousticBonus: 12.0 }, 
    'k7': { file: 'Tischkonstellation7.glb',  dims: {x: 4.0, z: 3.0}, radius: 2.2, seats: 11, name: "11er U-Form", acousticBonus: 22.0 },
    'k8': { file: 'Tischkonstellation8.glb',  dims: {x: 3.5, z: 3.0}, radius: 2.0, seats: 9, name: "9er U-Form", acousticBonus: 18.0 },
  },
};

// THREE.js Variablen
let scene, camera, renderer, controls;
let currentRoomMesh = null;
let currentRoomFile = ""; 
let currentRoomLimits = { x: 5, z: 5 }; 

// Objekt Management
let movableObjects = [];
let interactionMeshes = [];
let selectedObjects = []; 
let selectedRoot = null;
let selectionBox = null; 
let historyStack = []; 

// Vision / Simulation Status
let isVisionAnalysisMode = false;   
let visionConeMesh = null;
let neuroFilters = { 
    tunnel: false, noise: false, spot: false, hemi: false, 
    'hemi-l': false, retina: false, detachment: false,
    cataract: false, glaucoma: false, photophobia: false,
    cvi: false, diplopia: false, achromatopsia: false
}; 
let colorBlindnessMode = 'none';         
let currentVisionSeverity = 'normal';
let currentSimulationMode = 'none'; 
let tutorialStep = 0;               

// Raycasting & Maus
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const dragOffset = new THREE.Vector3();
let isDragging = false;
let raycastThrottle = 0;

// Loader
const gltfLoader = new GLTFLoader();
const objLoader = new OBJLoader();
const draco = new DRACOLoader();
draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
gltfLoader.setDRACOLoader(draco);

// === INIT ===
function init() {
  try {
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x1e1e1e);
      scene.fog = new THREE.FogExp2(0x1e1e1e, 0);  

      camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
      camera.position.set(0, 16, 0.1); 

      renderer = new THREE.WebGLRenderer({ 
          antialias: true, 
          preserveDrawingBuffer: true, 
          powerPreference: "high-performance"
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);
      
      renderer.shadowMap.enabled = true; 
      renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      document.body.appendChild(renderer.domElement);

      const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.9);
      scene.add(hemiLight);
      const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
      dirLight.position.set(5, 15, 5);
      dirLight.castShadow = true;
      scene.add(dirLight);
      
      const gridHelper = new THREE.GridHelper(30, 30, 0x444444, 0x333333);
      gridHelper.position.y = -0.05;
      scene.add(gridHelper);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.maxPolarAngle = Math.PI / 2 - 0.05;
      controls.minDistance = 0.1; 
      controls.maxDistance = 60;
      controls.listenToKeyEvents(window); 

      window.addEventListener("resize", onWindowResize);
      renderer.domElement.addEventListener("mousedown", onMouseDown);
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
      
      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("keyup", onKeyUp);
      
      selectionBox = new THREE.BoxHelper(new THREE.Mesh(), 0x007acc); 
      selectionBox.visible = false;
      scene.add(selectionBox);

      // UI Init
      const sel = document.getElementById('room-select');
      if(sel) sel.addEventListener('change', (e) => app.switchRoom(e.target.value));
      
      initRightSidebar(); 
      setupAvatarButtons();
      setupOnScreenControls();

      // Start App
      startApp();
      
      // Controls zu Beginn sichtbar schalten
      settings.controlsEnabled = true;
      app.updateSettings(); 

  } catch (err) {
      console.error("Critical Init Error:", err);
      alert("Fehler bei der Initialisierung: " + err.message);
  }
}

function startApp() {
    toggleLoader(true, "Lade Raum...");
    animate();
    // Default Raum laden
    loadRoomAsset("raummodell_leer.glb")
        .then((model) => {
            setupRoom(model, "raummodell_leer.glb");
        })
        .finally(() => toggleLoader(false));
}

// === HOMESCREEN & NAVIGATION ===
window.app.startSession = function() {
    // FIX: Zuerst Settings synchronisieren, solange Homescreen noch sichtbar ist!
    // Das überträgt die Auswahl (z.B. Hochkontrast) vom Home-Menu in die App.
    app.updateSettings(); 

    const home = document.getElementById('homescreen');
    if(home) home.style.display = 'none';
    const ui = document.getElementById('ui-layer');
    if(ui) ui.style.display = 'flex'; 
};

window.app.confirmGoHome = function() {
    showModal("Hauptmenü", `
        <p>Möchten Sie wirklich zum Hauptmenü zurückkehren? Nicht gespeicherte Änderungen gehen verloren.</p>
        <div style="display:flex; gap:10px; flex-direction:column; margin-top:20px;">
            <button class="primary" onclick="app.savePlan(); setTimeout(app.goHome, 500);">Speichern & Beenden</button>
            <button class="danger" onclick="app.goHome()">Ohne Speichern beenden</button>
        </div>
    `);
};

window.app.goHome = function() {
    document.getElementById('modal-overlay').classList.remove('active');
    document.getElementById('ui-layer').style.display = 'none';
    document.getElementById('homescreen').style.display = 'flex';
    app.clearRoom(false); 
    app.exitSimulationMode();
};

// === TUTORIAL SYSTEM ===
window.app.startTutorial = function() {
    tutorialStep = 0;
    app.startSession(); 
    setTimeout(nextTutorialStep, 500);
};

function nextTutorialStep() {
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
        el.classList.remove('tutorial-highlight');
        el.style.boxShadow = '';
        el.style.zIndex = '';
        if(el.classList.contains('sidebar') || el.classList.contains('sidebar-right')) {
            el.style.position = 'absolute'; 
        }
    });

    const uiLayer = document.getElementById('ui-layer');
    let tutBox = document.getElementById('tutorial-box');
    if(!tutBox) {
        tutBox = document.createElement('div');
        tutBox.id = 'tutorial-box';
        tutBox.style.cssText = `position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); 
                                background:var(--bg-panel); padding:20px; border:2px solid var(--primary); 
                                border-radius:8px; width:300px; z-index:9000; box-shadow:0 0 50px rgba(0,0,0,0.8);
                                text-align:center; pointer-events:auto; color:white;`;
        uiLayer.appendChild(tutBox);
    }
    tutBox.style.display = 'block';

    const steps = [
        { sel: '.top-bar', text: "<b>Die Top-Leiste</b><br><br>Hier können Sie den Raum wechseln, speichern, laden und zum Hauptmenü zurückkehren." },
        { sel: '.sidebar', text: "<b>Möbel & Objekte</b><br><br>Wählen Sie Möbel, ganze Gruppen oder Akustik-Elemente. Klicken Sie Objekte an, um sie zu bearbeiten." },
        { sel: '.sidebar-right', text: "<b>Avatar & Analyse</b><br><br>Setzen Sie einen Avatar für Seh-Simulationen und prüfen Sie Barrierefreiheit." },
        { sel: '#onscreen-controls', text: "<b>Steuerung</b><br><br>Nutzen Sie Maus (Rechtsklick Drehen) oder das Pad unten rechts." }
    ];

    if (tutorialStep < steps.length) {
        const step = steps[tutorialStep];
        tutBox.innerHTML = `<p style="margin-bottom:15px; font-size:14px;">${step.text}</p><button class="primary" onclick="app.nextTut()">Weiter</button>`;
        const el = document.querySelector(step.sel);
        if(el) {
            el.classList.add('tutorial-highlight');
            el.style.boxShadow = "0 0 20px var(--primary)";
            el.style.zIndex = "4000"; 
            if(el.classList.contains('sidebar') || el.classList.contains('sidebar-right')) { el.style.position = 'absolute'; }
        }
    } else {
        tutBox.style.display = 'none';
        showNotification("Tutorial beendet.");
    }
}
window.app.nextTut = function() { tutorialStep++; nextTutorialStep(); };


// === AVATAR & VISION LOGIC ===
function setupAvatarButtons() {
    const btnSpawn = document.getElementById('btn-spawn-avatar');
    if (btnSpawn) {
        const newBtn = btnSpawn.cloneNode(true);
        btnSpawn.parentNode.replaceChild(newBtn, btnSpawn);
        newBtn.addEventListener('click', () => {
            if (isFirstPersonActive() || isVisionAnalysisMode) return;
            toggleAvatar(scene, movableObjects, interactionMeshes);
            updateAvatarUI(); 
        });
    }

    const btnView = document.getElementById('btn-toggle-view');
    if (btnView) {
        const newView = btnView.cloneNode(true);
        btnView.parentNode.replaceChild(newView, btnView);
        newView.addEventListener('click', () => {
            if (isVisionAnalysisMode) return; 
            deselectObject(); 
            
            toggleAvatarView(camera, controls);
            
            // Anpassung: Controls bleiben aktiv, aber Pan/Zoom werden gesperrt
            if (isFirstPersonActive()) {
                controls.enableZoom = false;
                controls.enablePan = false;
                controls.rotateSpeed = 0.5; // Langsamer in FP
            } else {
                controls.enableZoom = true;
                controls.enablePan = true;
                controls.rotateSpeed = settings.mouseSensitivity;
            }

            app.updateSettings(); 
            app.updateVisionEffects(); 
            updateAvatarUI();
        });
    }

    const btnExit = document.getElementById('btn-exit-simulation');
    if(btnExit) {
        btnExit.addEventListener('click', () => app.exitSimulationMode());
    }
}

window.app.exitSimulationMode = function() {
    if (isFirstPersonActive()) {
        toggleAvatarView(camera, controls);
    }
    if (isVisionAnalysisMode) {
        isVisionAnalysisMode = false;
        if(visionConeMesh) { scene.remove(visionConeMesh); visionConeMesh = null; }
        app.setCamera('top');
    }
    
    // FIX: Rotation wieder erlauben
    controls.enableRotate = true;
    
    // Komplett Reset
    Object.keys(neuroFilters).forEach(k => neuroFilters[k] = false);
    colorBlindnessMode = 'none';
    
    controls.enabled = true; 
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.rotateSpeed = settings.mouseSensitivity;

    app.updateSettings(); 
    app.updateVisionEffects();
    updateAvatarUI();
};

function updateAvatarUI() {
    const isFP = isFirstPersonActive();
    const modeActive = isFP || isVisionAnalysisMode; // Status prüfen
    const avatarExists = movableObjects.some(o => o.userData.isAvatar);
    
    const btnSpawn = document.getElementById('btn-spawn-avatar');
    const groupControls = document.getElementById('avatar-controls-group');
    const hint = document.getElementById('vision-disabled-hint');
    const btnView = document.getElementById('btn-toggle-view'); 
    const btnAnalysis = document.getElementById('btn-toggle-analysis');
    const settingsPanel = document.getElementById('vision-settings-panel');
    const btnExit = document.getElementById('btn-exit-simulation');
    
    // NEU: Sidebar Referenz
    const leftSidebar = document.querySelector('.sidebar');

    // FIX: Linke Sidebar ausblenden, wenn im Simulations-Modus
    if (leftSidebar) {
        leftSidebar.style.display = modeActive ? 'none' : 'flex';
    }

    // FIX: Wizard-Button deaktivieren
    const wizBtn = document.querySelector('button[onclick="app.runWizard()"]');
    if(wizBtn) {
        wizBtn.disabled = modeActive;
        wizBtn.style.opacity = modeActive ? "0.3" : "1";
        wizBtn.style.cursor = modeActive ? "not-allowed" : "pointer";
    }

    if (btnSpawn) {
        if (avatarExists) {
            btnSpawn.innerText = "Avatar entfernen";
            btnSpawn.classList.add('danger');
            btnSpawn.disabled = modeActive; 
            btnSpawn.style.opacity = modeActive ? "0.3" : "1";
        } else {
            btnSpawn.innerText = "Avatar setzen";
            btnSpawn.classList.remove('danger');
            btnSpawn.disabled = false;
            btnSpawn.style.opacity = "1";
        }
    }

    if (groupControls) groupControls.style.display = avatarExists ? 'block' : 'none';
    if (hint) hint.style.display = avatarExists ? 'none' : 'block';

    if (btnView && btnAnalysis) {
        if (isFP) {
            btnView.classList.add('active'); 
            btnView.disabled = true; 
            btnAnalysis.disabled = true; 
            btnAnalysis.style.opacity = "0.3";
        } else if (isVisionAnalysisMode) {
            btnAnalysis.classList.add('active');
            btnAnalysis.disabled = true;
            btnView.disabled = true;
            btnView.style.opacity = "0.3";
        } else {
            btnView.classList.remove('active');
            btnAnalysis.classList.remove('active');
            btnView.disabled = false;
            btnAnalysis.disabled = false;
            btnView.style.opacity = "1";
            btnAnalysis.style.opacity = "1";
        }
    }

    if (btnExit) btnExit.style.display = modeActive ? 'block' : 'none';
    if (settingsPanel) settingsPanel.style.display = modeActive ? 'block' : 'none';
}

// === VISION EFFEKTE & NEURO-FILTER ===

// Helper: Nur ein Akkordeon gleichzeitig offen halten
window.app.handleAccordion = function(element) {
    if (!element.open) {
        // Wenn wir es gerade öffnen, schließen wir alle anderen
        const groups = document.querySelectorAll('.sim-group');
        groups.forEach(g => {
            if (g !== element) g.removeAttribute('open');
        });
    }
};

// 1. Toggle Funktion (Exklusiv-Logik)
window.app.toggleNeuroFilter = function(type) {
    if(!isFirstPersonActive()) return;
    
    // Status merken
    const wasActive = neuroFilters[type];
    
    // Alle Filter ausschalten (Werte auf false setzen)
    Object.keys(neuroFilters).forEach(k => neuroFilters[k] = false);

    // Gewählten Filter aktivieren, falls er vorher aus war
    if (!wasActive) neuroFilters[type] = true;
    
    app.updateVisionEffects();
};

// 2. Farbblindheit setzen
window.app.setColorBlindness = function(val) {
    colorBlindnessMode = val;
    app.updateVisionEffects();
};

// 3. Bestehende Sehschwäche-Funktion
window.app.setVisionSeverity = function(val) {
    currentVisionSeverity = val;
    if (isVisionAnalysisMode && visionConeMesh) updateAnalysisRing();
    app.updateVisionEffects();
};

window.app.setSimulationMode = function(mode) {
    currentSimulationMode = mode;
    app.updateVisionEffects();
};

// 4. Haupt-Update Funktion
window.app.updateVisionEffects = function() {
    const isFP = isFirstPersonActive();
    
    // 1. Reset Classes (Alle "sim-" Klassen entfernen)
    document.body.className = document.body.className.replace(/\bsim-\S+/g, "");
    if(scene.fog) scene.fog.density = 0;

    // 2. UI-Sichtbarkeit
    const neuroSection = document.getElementById('neuro-section');
    if(neuroSection) neuroSection.style.display = isFP ? 'block' : 'none';

    // 3. UI Sync (Dropdowns)
    const simSelect = document.getElementById('sim-select');
    if(simSelect) simSelect.value = currentSimulationMode;
    const visusSelect = document.getElementById('vision-select-right');
    if(visusSelect) visusSelect.value = currentVisionSeverity;

    // NEU: Slider Wert holen
    const severitySlider = document.getElementById('sim-severity');
    let severityLevel = severitySlider ? severitySlider.value : "2";

    // NEU: Slider nur einblenden, wenn eine Simulation aktiv ist (die Stufen unterstützt)
    // FIX: strabismus und amblyopia aus dem Array entfernt, damit der Slider angezeigt wird!
    const sliderContainer = document.getElementById('sim-severity-container');
    if (sliderContainer) {
        if (currentSimulationMode !== 'none' && !['protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia'].includes(currentSimulationMode)) {
            sliderContainer.style.display = 'block';
        } else {
            sliderContainer.style.display = 'none';
        }
    }

    // ABBRUCH wenn nicht FP
    if (!isFP) { return; }

    let fogDensity = 0;
    
    // 4. Visus anwenden
    switch(currentVisionSeverity) {
        case 'low': document.body.classList.add('sim-blur'); fogDensity = 0.05; break;
        case 'severe': document.body.classList.add('sim-severe'); fogDensity = 0.15; break;
        case 'blind': document.body.classList.add('sim-blind'); fogDensity = 0.6; break;
    }

    // 5. Simulation & Schweregrad anwenden
    if (currentSimulationMode !== 'none') {
        document.body.classList.add('sim-' + currentSimulationMode);
        document.body.classList.add('sim-lvl-' + severityLevel); // Fügt z.B. sim-lvl-2 hinzu
    }

    // 6. GLOSSAR & TIPP UPDATE
    let glossKey = 'normal';
    if (currentSimulationMode !== 'none') {
        glossKey = currentSimulationMode;
    } else if (currentVisionSeverity !== 'normal') {
        glossKey = currentVisionSeverity;
    }

    const glossInfo = SIM_GLOSSARY[glossKey] || SIM_GLOSSARY.normal;
    const gTitle = document.getElementById('glossary-title');
    const gText = document.getElementById('glossary-text');
    const gTipBox = document.getElementById('glossary-tip');
    const gTipText = document.getElementById('glossary-tip-text');
    
    if(gTitle && gText) {
        gTitle.innerText = glossInfo.title;
        gText.innerText = glossInfo.text;
        
        if (glossInfo.tip && glossInfo.tip.length > 0) {
            gTipBox.style.display = 'block';
            gTipText.innerText = glossInfo.tip;
        } else {
            gTipBox.style.display = 'none';
        }
    }
    
    if(scene.fog) scene.fog.density = fogDensity;
};

// Draufsicht Analyse
window.app.toggleVisionAnalysis = function() {
    const currentAvatarObj = movableObjects.find(o => o.userData.isAvatar);
    if (!currentAvatarObj) { showNotification("Kein Avatar vorhanden!"); return; }
    if (isVisionAnalysisMode) return; 

    isVisionAnalysisMode = true;
    
    // FIX: Rotation sperren, damit man nicht "unter" die Ebene schaut
    controls.enableRotate = false;
    
    updateAvatarUI();
    updateAnalysisRing();
    
    controls.enabled = true;
    app.updateSettings(); 
    showNotification("Modus: Draufsicht Analyse");
};

function updateAnalysisRing() {
    if(visionConeMesh) { scene.remove(visionConeMesh); visionConeMesh.geometry.dispose(); visionConeMesh = null; }

    const currentAvatarObj = movableObjects.find(o => o.userData.isAvatar);
    if (!currentAvatarObj) return;

    let r = 15.0; 
    let col = new THREE.Color(0x2ea043); 

    switch(currentVisionSeverity) {
        case 'normal': r = 15.0; col.setHex(0x2ea043); break;
        case 'low':    r = 3.5;  col.setHex(0xd4a72c); break;
        case 'severe': r = 1.5;  col.setHex(0xff8800); break;
        case 'blind':  r = 0.8;  col.setHex(0xd73a49); break;
    }

    const vertexShader = `
        varying vec3 vWorldPosition;
        void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
    `;
    
    const limitX = currentRoomLimits.x; 
    const limitZ = currentRoomLimits.z;

    const fragmentShader = `
        uniform vec3 color;
        uniform vec2 limits;
        varying vec3 vWorldPosition;
        void main() {
            if (abs(vWorldPosition.x) > limits.x || abs(vWorldPosition.z) > limits.y) {
                discard;
            }
            gl_FragColor = vec4(color, 0.4);
        }
    `;

    const fovRad = 216 * (Math.PI / 180);
    const thetaStart = (Math.PI / 2) - (fovRad / 2);
    const geometry = new THREE.CircleGeometry(r, 64, thetaStart, fovRad);
    
    const material = new THREE.ShaderMaterial({
        uniforms: {
            color: { value: col },
            limits: { value: new THREE.Vector2(limitX, limitZ) }
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true,
        side: THREE.DoubleSide
    });

    visionConeMesh = new THREE.Mesh(geometry, material);
    visionConeMesh.position.copy(currentAvatarObj.position);
    visionConeMesh.position.y = VISION_LAYER_HEIGHT; 
    
    visionConeMesh.rotation.x = -Math.PI / 2;
    visionConeMesh.rotation.z = currentAvatarObj.rotation.y;

    scene.add(visionConeMesh);

    // Kamera initial setzen
    const targetPos = currentAvatarObj.position.clone();
    const cameraPos = targetPos.clone();
    cameraPos.y = TOP_VIEW_HEIGHT; 
    smoothCameraMove(cameraPos, targetPos);
}

// === ON-SCREEN CONTROLS ===
function setupOnScreenControls() {
    const extraControls = document.querySelector('.extra-controls');
    if(extraControls) extraControls.style.display = 'none'; 
    const resetBtn = document.querySelector('.btn-center');
    if(resetBtn) resetBtn.style.display = 'none'; 

    const bindBtn = (selector, stateKey) => {
        const el = document.querySelector(selector);
        if(!el) return;
        const newEl = el.cloneNode(true);
        el.parentNode.replaceChild(newEl, el);
        
        newEl.addEventListener('mousedown', (e) => { e.preventDefault(); inputState[stateKey] = true; });
        newEl.addEventListener('touchstart', (e) => { e.preventDefault(); inputState[stateKey] = true; }, {passive: false});
        newEl.addEventListener('touchend', (e) => { e.preventDefault(); inputState[stateKey] = false; });
    };

    const clearInputs = () => Object.keys(inputState).forEach(k => inputState[k] = false);
    window.addEventListener('mouseup', clearInputs);
    window.addEventListener('touchend', clearInputs);

    bindBtn('.btn-up', 'fwd');
    bindBtn('.btn-down', 'bwd');
    bindBtn('.btn-left', 'left');
    bindBtn('.btn-right', 'right');
}

// === STEUERUNG (Loop) & ANIMATION ===
function processMovement() {
    if (isFirstPersonActive()) return; 
    if (!settings.controlsEnabled) return; 

    const moveSpeed = 0.05 * settings.mouseSensitivity;
    const zoomSpeed = 1.02; 

    if (inputState.fwd || inputState.bwd || inputState.left || inputState.right) {
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        forward.y = 0; forward.normalize();
        if(forward.lengthSq() < 0.1) forward.set(0, 0, -1);
        const right = new THREE.Vector3();
        right.crossVectors(camera.up, forward).normalize();
        const move = new THREE.Vector3();
        if (inputState.fwd) move.add(forward);
        if (inputState.bwd) move.sub(forward);
        if (inputState.right) move.sub(right); 
        if (inputState.left) move.add(right);
        
        if (move.lengthSq() > 0) {
            move.normalize().multiplyScalar(moveSpeed);
            camera.position.add(move);
            controls.target.add(move);
        }
    }
    if (inputState.zoomIn) controls.dollyIn(zoomSpeed);
    if (inputState.zoomOut) controls.dollyOut(zoomSpeed);
}

function animate() { 
    requestAnimationFrame(animate); 
    
    // Live Update für Vision Cone (Draufsicht)
    if(isVisionAnalysisMode) {
        const av = movableObjects.find(o => o.userData.isAvatar);
        if(av && visionConeMesh) {
            visionConeMesh.position.x = av.position.x;
            visionConeMesh.position.z = av.position.z;
            visionConeMesh.rotation.z = av.rotation.y;
        }
    }

    processMovement();
    
    // Controls Update IMMER ausführen (für Maus-Rotation auch in FP)
    controls.update(); 
    
    renderer.render(scene, camera); 
}

// Dummy Functions für Kompatibilität mit HTML Aufrufen
window.app.moveCamera = function(x, z) {}; 
window.app.zoomCamera = function(dir) {};
window.app.tiltCamera = function(dir) {};

// === SETTINGS ===
window.app.toggleSettings = function() {
    const el = document.getElementById('settings-overlay');
    el.classList.toggle('active');
};

window.app.updateSettings = function() {
    const home = document.getElementById('homescreen');
    const isHomeVisible = home && home.style.display !== 'none';

    const syncVal = (idApp, idHome, type='check') => {
        const elApp = document.getElementById(idApp);
        const elHome = document.getElementById(idHome);
        
        // FIX: Wenn das App-Element fehlt, Abbruch.
        if (!elApp) return false;
        
        // FIX: Wenn das Homescreen-Element (z.B. start-controls) im neuen Design nicht existiert,
        // nehmen wir einfach den Wert direkt aus dem Einstellungs-Menü der App!
        let val;
        if (!elHome) {
            val = type === 'check' ? elApp.checked : elApp.value;
            return val;
        }
        
        if (isHomeVisible) {
            val = type === 'check' ? elHome.checked : elHome.value;
            if (type === 'check') elApp.checked = val; else elApp.value = val;
        } else {
            val = type === 'check' ? elApp.checked : elApp.value;
            if (type === 'check') elHome.checked = val; else elHome.value = val;
        }
        return val;
    };

    // Jetzt funktioniert das Einlesen wieder korrekt!
    settings.controlsEnabled = syncVal('set-controls', 'start-controls');
    settings.mouseSensitivity = parseFloat(syncVal('set-rotate-speed', 'start-rotate-speed', 'val')) || 1.0;
    settings.reducedMotion = syncVal('set-reduced-motion', 'start-reduced-motion');
    const highContrast = syncVal('set-high-contrast', 'start-high-contrast');

    document.body.className = document.body.className.replace(/filter-\w+/g, ''); 
    document.body.classList.remove('high-contrast');
    
    if(highContrast) {
        document.body.classList.add('high-contrast');
    }
    
    app.updateVisionEffects();

    // Radikale Hochkontrast-Umschaltung für alle 3D Objekte
    if (window.app.applyHighContrast3D) {
        window.app.applyHighContrast3D(highContrast);
    }

    if(!isFirstPersonActive()) {
        controls.rotateSpeed = settings.mouseSensitivity;
        controls.zoomSpeed = settings.mouseSensitivity;
        controls.enableDamping = !settings.reducedMotion;
    }
    
    // Hier ist auch die Logik, die die Controls während der Simulation ausblendet
    const osc = document.getElementById('onscreen-controls');
    if(osc) {
        const simActive = isFirstPersonActive() || isVisionAnalysisMode;
        if(settings.controlsEnabled && !simActive) {
             osc.classList.add('visible');
             osc.style.display = 'flex'; 
        } else {
             osc.classList.remove('visible');
             osc.style.display = 'none';
        }
    }
};

window.app.applyHighContrast3D = function(isActive) {
    // Harte Monochrom-Werte
    const COLOR_ROOM = 0xeeeeee; // Sehr helles Grau für den Raum
    const COLOR_FURN = 0x111111; // Fast Schwarz für alle Möbel

    const applyColor = (mesh, isRoom) => {
        if (!mesh) return;
        mesh.traverse(child => {
            // WICHTIG: Nur sichtbare Meshes einfärben! Unsichtbare Hitboxen ignorieren.
            if (child.isMesh && child.material && child.material.visible !== false) {
                
                // 1. Original-Material einmalig dauerhaft sichern
                if (!child.userData.origMaterial) {
                    child.userData.origMaterial = child.material;
                }

                if (!isActive) {
                    // 2. Hochkontrast AUS: Zurück zum Original-Material (Texturen sind wieder da)
                    child.material = child.userData.origMaterial;
                } else {
                    // 3. Hochkontrast AN: Komplett sauberes, neues Material erzwingen!
                    const colorHex = isRoom ? COLOR_ROOM : COLOR_FURN;
                    child.material = new THREE.MeshStandardMaterial({
                        color: colorHex,
                        roughness: 0.9,   // Wenig Glanz (verhindert irritierende Reflektionen)
                        metalness: 0.05,
                        side: THREE.DoubleSide
                    });
                }
            }
        });
    };

    // 1. Raum überschreiben
    applyColor(currentRoomMesh, true);

    // 2. Radikal ALLE Möbel in der Szene überschreiben
    movableObjects.forEach(obj => {
        applyColor(obj, false);
    });
};

window.app.setFontScale = function(delta) {
    settings.fontScale = Math.max(0.8, Math.min(1.5, settings.fontScale + delta));
    document.body.style.fontSize = (14 * settings.fontScale) + "px";
    document.getElementById('font-scale-val').innerText = Math.round(settings.fontScale * 100) + "%";
};

// === OBJECT LIST & UNDO ===
function updateObjectList() {
    const container = document.getElementById('object-list-container');
    container.innerHTML = "";
    if(movableObjects.length === 0) {
        container.innerHTML = "<small style='color:#888;'>Keine Objekte im Raum.</small>";
        return;
    }
    const counts = {};
    const objMap = {}; 
    movableObjects.forEach(obj => {
        const name = ASSETS.furniture[obj.userData.typeId].name;
        if(!counts[name]) { counts[name] = 0; objMap[name] = []; }
        counts[name]++;
        objMap[name].push(obj);
    });
    for(let name in counts) {
        const div = document.createElement('div');
        div.className = "object-list-item";
        div.innerHTML = `<span>${name}</span> <span>${counts[name]}x</span>`;
        div.onclick = () => {
            deselectObject();
            selectedObjects = objMap[name];
            selectObject(selectedObjects[0]); 
        };
        container.appendChild(div);
    }
}

window.app.updateAnnotation = function(text) {
    if(selectedObjects.length > 0) selectedObjects.forEach(obj => { obj.userData.annotation = text; });
};

function saveHistory() {
    const state = movableObjects.map(obj => ({
        typeId: obj.userData.typeId,
        x: obj.position.x,
        z: obj.position.z,
        rot: obj.rotation.y,
        annotation: obj.userData.annotation || ""
    }));
    historyStack.push(state);
    if(historyStack.length > 20) historyStack.shift(); 
}

window.app.undo = function() {
    if(historyStack.length === 0) { showNotification("Nichts zum Rückgängig machen."); return; }
    const prevState = historyStack.pop();
    
    const hadAvatar = movableObjects.some(o => o.userData.isAvatar);
    if(hadAvatar) app.exitSimulationMode();

    movableObjects.forEach(obj => { scene.remove(obj); obj.traverse(c => { if(c.geometry) c.geometry.dispose(); }); });
    movableObjects = [];
    interactionMeshes = [];
    selectedObjects = [];
    deselectObject();
    
    prevState.forEach(item => {
        createFurnitureInstance(item.typeId, item.x, item.z, item.rot);
        if(item.annotation && movableObjects.length > 0) movableObjects[movableObjects.length-1].userData.annotation = item.annotation;
    });
    
    updateSeatCount();
    updateObjectList();
    updateAvatarUI(); 
    showNotification("Schritt rückgängig gemacht.");
};

// === FURNITURE LOGIC ===

window.app.addFurniture = async function (typeId) { 
    if (isFirstPersonActive() || isVisionAnalysisMode) return;
    saveHistory(); 
    if(typeId.startsWith('k')) document.body.style.cursor = 'wait'; 
    
    const asset = ASSETS.furniture[typeId];
    if(!asset.procedural && !asset.data) { 
        toggleLoader(true, "Lade Objekt..."); 
        await getOrLoadFurniture(typeId); 
        toggleLoader(false); 
    } 
    
    createFurnitureInstance(typeId, 0, 0, 0); 
    document.body.style.cursor = 'default'; 
    setTimeout(() => { const lastObj = movableObjects[movableObjects.length-1]; if(lastObj) selectObject(lastObj); }, 50); 
};

window.app.clearRoom = function(doSave=true) { 
    if(doSave) saveHistory(); 
    const hadAvatar = movableObjects.some(o => o.userData.isAvatar);
    
    movableObjects.forEach(obj => { scene.remove(obj); obj.traverse(c => { if(c.geometry) c.geometry.dispose(); }); }); 
    movableObjects = []; 
    interactionMeshes = []; 
    deselectObject(); 
    updateSeatCount(); 
    updateObjectList(); 
    
    if (hadAvatar) updateAvatarUI();
};

window.app.rotateSelection = function(dir) { 
    if(!selectedObjects || selectedObjects.length===0) return; 
    saveHistory(); 
    selectedObjects.forEach(obj => obj.rotation.y += (Math.PI/4) * dir); 
    if(selectedObjects.length===1) selectionBox.update(); 
};

window.app.deleteSelection = function() { 
    if (selectedObjects.length > 0) { 
        saveHistory(); 
        let avatarDeleted = false;
        selectedObjects.forEach(obj => {
            if(obj.userData.isAvatar) avatarDeleted = true;
            scene.remove(obj); 
            movableObjects = movableObjects.filter(o => o !== obj); 
            const hitbox = obj.children.find(c => c.userData.root === obj); 
            if(hitbox) interactionMeshes = interactionMeshes.filter(m => m !== hitbox); 
            obj.traverse(c => { if(c.geometry) c.geometry.dispose(); });
        });
        deselectObject(); 
        updateSeatCount(); 
        updateObjectList();
        if(avatarDeleted) updateAvatarUI();
    } 
};

// === WIZARD (REPAIRED & RESTORED) ===
function checkPositionValid(x, z, r, lx, lz) { 
    const tolerance = 0.1; 
    return (Math.abs(x) + r <= lx + tolerance) && (Math.abs(z) + r <= lz + tolerance); 
}

function calcRows(count, lx, lz) { 
    const r = ASSETS.furniture['row_combo'].radius; 
    const itemWidth = 1.4; 
    const itemDepth = 1.8; 
    const cols = Math.floor(((lx * 2) - 0.4) / itemWidth); 
    if(cols < 1) return null; 
    let res = []; 
    
    // Tafel mittig an die vordere Wand setzen (-Z Achse ist die Blickrichtung der Stühle)
    res.push({id: 'board', x: 0, z: -lz + 0.1, r: 0});
    
    const startX = -(cols * itemWidth) / 2 + (itemWidth/2); 
    const startZ = -(Math.ceil(count/cols) * itemDepth) / 2 + (itemDepth/2); 
    for(let i=0; i<count; i++) { 
        const col = i % cols; 
        const row = Math.floor(i / cols); 
        const z = startZ + (row * itemDepth); 
        const x = startX + (col * itemWidth); 
        if(!checkPositionValid(x, z, r, lx, lz)) return null; 
        res.push({id: 'row_combo', x: x, z: z, r: Math.PI}); 
    } 
    return res; 
}

function calcGroupsK6(count, lx, lz) { 
    const groupsNeeded = Math.ceil(count / 6); 
    const r = ASSETS.furniture['k6'].radius; 
    let diameter = (r * 2) + 0.3; 
    let cols = Math.floor((lx * 2) / diameter); 
    if(groupsNeeded > cols * Math.floor((lz * 2) / diameter)) return null; 
    let res = []; 
    const startX = -(cols * diameter) / 2 + diameter / 2; 
    const startZ = -(Math.ceil(groupsNeeded/cols) * diameter) / 2 + diameter / 2; 
    for (let i = 0; i < groupsNeeded; i++) { 
        const col = i % cols; 
        const row = Math.floor(i / cols); 
        const x = startX + (col * diameter); 
        const z = startZ + (row * diameter); 
        if(!checkPositionValid(x, z, r, lx, lz)) return null; 
        res.push({id: 'k6', x: x, z: z, r: (col+row)%2===0 ? 0 : Math.PI/4}); 
    } 
    return res; 
}

function calcExam(count, lx, lz) { 
    const itemWidth = 1.8; 
    const itemDepth = 1.8; 
    const cols = Math.floor((lx * 2) / itemWidth); 
    if(cols < 1) return null; 
    let res = []; 
    
    // Tafel mittig an die vordere Wand setzen
    res.push({id: 'board', x: 0, z: -lz + 0.1, r: 0});
    
    const startX = -(cols * itemWidth) / 2 + (itemWidth/2); 
    const startZ = -lz + 1.5; 
    for(let i=0; i<count; i++) { 
        const col = i % cols; 
        const row = Math.floor(i / cols); 
        const x = startX + (col * itemWidth); 
        const z = startZ + (row * itemDepth); 
        if(Math.abs(z) > lz - 0.5) return null; 
        res.push({id: 'row_combo', x: x, z: z, r: Math.PI}); 
    } 
    return res; 
}

function calcCircle(count, lx, lz) { 
    const r = ASSETS.furniture['chair'].radius; 
    const maxRoomRadius = Math.min(lx, lz) - 1.0; 
    if(maxRoomRadius < 1.0) return null; 
    const angleStep = (2 * Math.PI) / count; 
    let res = []; 
    for(let i=0; i<count; i++) { 
        const angle = i * angleStep; 
        res.push({id: 'chair', x: Math.sin(angle) * maxRoomRadius, z: Math.cos(angle) * maxRoomRadius, r: angle + Math.PI}); 
    } 
    return res; 
}

window.app.runWizard = async function() {
    // FIX: Absturz verhindern - Keine Möbel während Simulation
    if (isFirstPersonActive() || isVisionAnalysisMode) {
        showNotification("Funktion in Simulation gesperrt.");
        return;
    }

    saveHistory();
    const scenario = document.getElementById('wizard-scenario').value;
    const count = parseInt(document.getElementById('wizard-count').value);
    
    // Limits abrufen
    const lx = currentRoomLimits.x - 0.2; 
    const lz = currentRoomLimits.z - 0.2;
    
    let pending = [];

    switch(scenario) {
        case 'lecture': pending = calcRows(count, lx, lz); break;
        case 'group': pending = calcGroupsK6(count, lx, lz); break;
        case 'exam': pending = calcExam(count, lx, lz); break;
        case 'circle': pending = calcCircle(count, lx, lz); break;
    }

    if (!pending || pending.length === 0) { 
        showNotification("Raum zu klein oder ungültige Anzahl."); 
        return; 
    }
    
    app.clearRoom(false); 
    
    // Sicherstellen, dass ALLE benötigten Assets (z.B. Tische UND Tafel) geladen sind
    const uniqueTypes = [...new Set(pending.map(p => p.id))];
    let needsLoading = uniqueTypes.some(type => !ASSETS.furniture[type].data);
    
    if (needsLoading) {
        toggleLoader(true, "Lade Möbel..."); 
        for (let type of uniqueTypes) {
            if (!ASSETS.furniture[type].data) {
                await getOrLoadFurniture(type);
            }
        }
        toggleLoader(false); 
    }
    
    pending.forEach(p => createFurnitureInstance(p.id, p.x, p.z, p.r));
    showNotification("Planung generiert.");
};

// === ACCESSIBILITY CHECKS ===
function getAccessibilityStats() {
    let minFound = Infinity;
    let acousticPoints = 0;
    let wallIssues = 0;
    
    const targets = ASSETS.rooms[currentRoomFile].acousticTargets || { warn: 0.25, good: 0.45 };
    
    for(let i=0; i<movableObjects.length; i++) {
        const objA = movableObjects[i];
        const infoA = ASSETS.furniture[objA.userData.typeId];
        acousticPoints += (infoA.acousticBonus || 1);

        for(let j=i+1; j<movableObjects.length; j++) {
            const objB = movableObjects[j];
            const infoB = ASSETS.furniture[objB.userData.typeId];
            
            const dist = objA.position.distanceTo(objB.position);
            const r1 = infoA.radius || 0.5;
            const r2 = infoB.radius || 0.5;
            const gap = Math.max(0, dist - (r1 + r2));

            if (gap > 0.05) { 
                if (gap < minFound) minFound = gap;
            }
        }
    }

    if (minFound === Infinity) minFound = 2.0; 
    
    for(let obj of movableObjects) {
        if(obj.userData.isWallItem) continue;
        const info = ASSETS.furniture[obj.userData.typeId];
        const r = info.radius || 0.5;
        const distX = currentRoomLimits.x - Math.abs(obj.position.x) - r;
        const distZ = currentRoomLimits.z - Math.abs(obj.position.z) - r;
        const issueX = (distX > 0.05 && distX < 0.7);
        const issueZ = (distZ > 0.05 && distZ < 0.7);
        if(issueX || issueZ) wallIssues++; 
    }
    
    const minCm = movableObjects.length < 2 ? 100 : Math.round(minFound * 100);
    const roomArea = ASSETS.rooms[currentRoomFile].area || 50;
    const acousticScore = acousticPoints / roomArea; 
    
    return { minCm, wallIssues, count: movableObjects.length, acousticScore, targets };
}

window.app.checkAccessibility = function() {
    const stats = getAccessibilityStats();
    if(stats.count < 1) { showModal("Barrierefreiheit & Akustik", "Raum ist leer."); return; }

    let statusClass = stats.minCm < 70 ? "bad" : (stats.minCm < 90 ? "warn" : "good");
    let statusText = stats.minCm < 70 ? "Kritisch (<70cm)" : (stats.minCm < 90 ? "Akzeptabel (70-90cm)" : "Sehr gut (>90cm)");
    
    let acClass = "bad";
    let acText = "Viel Hall (Schlecht für Hörgeräte)";
    
    if(stats.acousticScore > stats.targets.warn) { acClass = "warn"; acText = "Akzeptabel (Mittel)"; }
    if(stats.acousticScore > stats.targets.good) { acClass = "good"; acText = "Gut gedämpft"; }

    let html = `<h4>Rollstuhlfreiheit</h4>
                <div class="report-item ${statusClass}"><span>Engster Durchgang:</span><span class="report-val">${stats.minCm} cm</span><div style="font-size:11px; opacity:0.8">${statusText}</div></div>`;
    
    if(stats.wallIssues > 0) {
        html += `<div class="report-item warn"><span>Möbel ungünstig an Wand:</span><span class="report-val">${stats.wallIssues}</span><div style="font-size:11px; opacity:0.8">Abstand zu klein für Durchgang aber nicht bündig.</div></div>`;
    }
    
    html += `<h4 style="margin-top:20px;">Akustik (Prognose)</h4>
             <div class="report-item ${acClass}"><span>Hörsamkeit:</span><div style="font-size:11px; opacity:0.8; margin-top:5px;">${acText}</div></div>`;
    
    if(acClass === "bad" || acClass === "warn") {
        html += `<div class="report-item" style="border-left-color:#336699; background:rgba(51, 102, 153, 0.1);"><span>Tipp:</span><div style="font-size:11px; opacity:0.8">Nutzen Sie Teppiche, Trennwände oder Wandabsorber (unter "Einzelmöbel & Ausstattung"), um die Akustik zu verbessern.</div></div>`;
    }

    html += `<p style="font-size:11px; color:#888;">Hinweis: Schätzung basierend auf Möbelanzahl und Raumgröße.</p>`;

    showModal("Barrierefreiheit & Akustik", html);
};

window.app.checkAccessibility = function() {
    const stats = getAccessibilityStats();
    if(stats.count < 1) { showModal("Barrierefreiheit & Akustik", "Raum ist leer."); return; }

    let statusClass = stats.minCm < 70 ? "bad" : (stats.minCm < 90 ? "warn" : "good");
    let statusText = stats.minCm < 70 ? "Kritisch (<70cm)" : (stats.minCm < 90 ? "Akzeptabel (70-90cm)" : "Sehr gut (>90cm)");
    
    let acClass = "bad";
    let acText = "Viel Hall (Schlecht für Hörgeräte)";
    
    if(stats.acousticScore > stats.targets.warn) { acClass = "warn"; acText = "Akzeptabel (Mittel)"; }
    if(stats.acousticScore > stats.targets.good) { acClass = "good"; acText = "Gut gedämpft"; }

    let html = `<h4>Rollstuhlfreiheit</h4>
                <div class="report-item ${statusClass}"><span>Engster Durchgang:</span><span class="report-val">${stats.minCm} cm</span><div style="font-size:11px; opacity:0.8">${statusText}</div></div>`;
    
    if(stats.wallIssues > 0) {
        html += `<div class="report-item warn"><span>Möbel ungünstig an Wand:</span><span class="report-val">${stats.wallIssues}</span><div style="font-size:11px; opacity:0.8">Abstand zu klein für Durchgang aber nicht bündig.</div></div>`;
    }
    
    html += `<h4 style="margin-top:20px;">Akustik (Prognose)</h4>
             <div class="report-item ${acClass}"><span>Hörsamkeit:</span><div style="font-size:11px; opacity:0.8; margin-top:5px;">${acText}</div></div>`;
    
    if(acClass === "bad" || acClass === "warn") {
        html += `<div class="report-item" style="border-left-color:#336699; background:rgba(51, 102, 153, 0.1);"><span>Tipp:</span><div style="font-size:11px; opacity:0.8">Nutzen Sie Teppiche, Trennwände oder Wandabsorber (unter "Einzelmöbel & Ausstattung"), um die Akustik zu verbessern.</div></div>`;
    }

    html += `<p style="font-size:11px; color:#888;">Hinweis: Schätzung basierend auf Möbelanzahl und Raumgröße.</p>`;

    showModal("Barrierefreiheit & Akustik", html);
};

// --- NEUER BLOCK: LITERATUR & QUELLEN ---
window.app.showReferences = function() {
    const linkStyle = "color: #3b82f6; text-decoration: none; border-bottom: 1px dotted #3b82f6;";
    const detailsStyle = "margin-bottom: 10px; background: rgba(255,255,255,0.03); border: 1px solid #374151; border-radius: 6px; padding: 10px;";
    // FIX: Die Überschriften der Dropdowns sollen NICHT markierbar sein (verhindert Flackern beim Klicken)
    const summaryStyle = "color: #e5e7eb; font-size: 13px; font-weight: 700; cursor: pointer; outline: none; user-select: none; -webkit-user-select: none;";
    const pStyle = "font-size: 11px; color: #9ca3af; margin-bottom: 8px; line-height: 1.5; padding-left: 10px; text-indent: -10px; margin-top: 10px;";

    // FIX: Dem Haupt-Container wurde 'user-select: text !important' und 'cursor: text' hinzugefügt
    const html = `
        <div style="max-height: 60vh; overflow-y: auto; padding-right: 10px; user-select: text !important; -webkit-user-select: text !important; cursor: text;">
            <p style="font-size: 12px; color: #d1d5db; margin-bottom: 15px;">Die fachlichen Informationen und pädagogischen Hinweise in diesem Tool basieren auf folgenden Quellen:</p>
            
            <div style="background: rgba(245, 158, 11, 0.1); border-left: 3px solid #f59e0b; padding: 10px; margin-bottom: 20px; font-size: 11px; color: #d1d5db; border-radius: 0 4px 4px 0;">
                <strong style="color: #f59e0b; display: block; margin-bottom: 4px;">Grenzen der Simulation:</strong>
                Eine Simulation repliziert nicht die tatsächliche Lebensrealität. Sehende Personen haben stets den Vorteil, auf visuelle Erinnerungen und Vorerfahrungen zurückgreifen zu können. Diese Filter dienen dem Aufbau von Empathie und Verständnis, nicht der exakten medizinischen Nachbildung.
            </div>
            
            <details style="${detailsStyle}">
                <summary style="${summaryStyle}">Spezifische Krankheitsbilder</summary>
                <div style="${pStyle}"><strong>Retinopathie (ROP):</strong> Akman, S. H., Pfeil, J. M., et al. (2021). Epidemiology and treatment of retinopathy of prematurity: The Hannover Data in Retina.net ROP registry from 2001-2017. <em>Ophthalmologie</em> 119 (5), S. 497–505.</div>
                <div style="${pStyle}"><strong>Retinopathie (ROP):</strong> Hübler, A. & Dawczynski, J. (2010). Retinopathia praematurorum. In: Gerhard, J. & Hübler, A. (Hrsg.) <em>Neonatologie: Die Medizin des Früh- und Reifgeborenen.</em> Stuttgart: Georg Thieme Verlag KG.</div>
                <div style="${pStyle}"><strong>CVI:</strong> Bennett, R. & Baskin, K. (2026). <em>When to Suspect CVI.</em> Perkins School for the Blind. <br><a href="https://www.perkins.org/when-to-suspect-cvi-guide/" target="_blank" style="${linkStyle}">Online lesen</a></div>
                <div style="${pStyle}"><strong>CVI:</strong> National Eye Institute (2024). <em>Cerebral Visual Impairment (CVI).</em> <br><a href="https://www.nei.nih.gov/eye-health-information/eye-conditions-and-diseases/cerebral-visual-impairment-cvi" target="_blank" style="${linkStyle}">Online lesen</a></div>
                <div style="${pStyle}"><strong>Glaukom:</strong> Universitätsspital Zürich (2021/2025). <em>Kongenitales und juveniles Glaukom.</em> <br><a href="https://www.usz.ch/krankheit/kongenitales-und-juveniles-glaukom/" target="_blank" style="${linkStyle}">Online lesen</a></div>
            </details>

            <details style="${detailsStyle}">
                <summary style="${summaryStyle}">Allgemeine Augenheilkunde & Epidemiologie</summary>
                <div style="${pStyle}">Bundesinstitut für Öffentliche Gesundheit (2025). <em>Sehstörungen bei Kindern erkennen.</em> <br><a href="https://www.kindergesundheit-info.de/themen/entwicklung/entwicklungsschritte/sehvermoegen/sehstoerungen/" target="_blank" style="${linkStyle}">Online lesen</a></div>
                <div style="${pStyle}">Dube, M., et al. (2024). Prevalence and Pattern of Ocular Diseases Among Children Aged 7-14 Years Visiting a Tertiary Care Teaching Hospital in Central India. <em>Cureus</em> 16 (8), e66383.</div>
                <div style="${pStyle}">Grehn, F. (1968/2006). <em>Augenheilkunde.</em> Heidelberg: Springer Medizin Verlag.</div>
                <div style="${pStyle}">Jeong, Y. D., et al. (2025). Global Prevalence of Congenital Color Vision Deficiency among Children and Adolescents, 1932-2022. <em>Ophthalmology</em>, 132(12), 1431–1444.</div>
                <div style="${pStyle}">Schmidtke, C., et al. (2018). Inanspruchnahme der Früherkennungsuntersuchungen für Kinder in Deutschland – Querschnittergebnisse aus KiGGS Welle 2. <em>Journal of Health Monitoring</em> 3 (4), S. 68–77. Berlin: RKI.</div>
                <div style="${pStyle}">Turbert, D. (2024). <em>Childhood Eye Diseases and Conditions.</em> American Academy of Ophthalmology. <br><a href="https://www.aao.org/eye-health/tips-prevention/common-childhood-diseases-conditions" target="_blank" style="${linkStyle}">Online lesen</a></div>
                <div style="${pStyle}">Vaughan, D. & Asbury, T. (1983). <em>Ophthalmologie: Diagnose und Therapie in der Praxis.</em> Berlin/Heidelberg/New York/Tokyo: Springer-Verlag.</div>
            </details>

            <details style="${detailsStyle}">
                <summary style="${summaryStyle}">Didaktik & Simulation</summary>
                <div style="${pStyle}">Capovilla, D. & Gebhardt, M. (2016). Assistive Technologien für Menschen mit Sehschädigung im inklusiven Unterricht. <em>Zeitschrift für Heilpädagogik</em> (1), S. 4–15. Würzburg: Verband Sonderpädagogik e.V.</div>
                <div style="${pStyle}">
                    <strong>⭐ Degenhardt, S., Gewinn, W. & Schütt, M.-L. (2016).</strong> <em>Spezifisches Curriculum für Menschen mit Blindheit und Sehbehinderung.</em> Norderstedt: Books on Demand GmbH.<br>
                    <span style="color: #3b82f6; font-size: 10px;">➔ Beschreibt einen spezifischen Lehrplan und dient als zentrale didaktische Grundlage.</span>
                </div>
                <div style="${pStyle}">Krug, F.-K. (2001). Grundlagen einer Didaktik für Sehbehinderte. In: F.-K. Krug (Hrsg.), <em>Didaktik für den Unterricht mit sehbehinderten Schülern</em>, S. 15-26. Stuttgart: Ernst Reinhardt Verlag.</div>
                <div style="${pStyle}">Lang, M. (2024). Förderschwerpunkt Sehen: Pädagogik bei Blindheit und Sehbeeinträchtigung. In: E. Kiel & S. Weiß (Hrsg.), <em>Inklusive Didaktik für die Regelschule: Eine Einführung für Studium und Praxis</em>, S. 49-66. Bad Heilbrunn: Julius Klinkhardt.</div>
                <div style="${pStyle}">Lang, M. & Thiele, M. (2020). <em>Schüler mit Sehbehinderung und Blindheit im inklusiven Unterricht: Praxistipps für Lehrkräfte.</em> München: Ernst Reinhardt Verlag.</div>
                <div style="${pStyle}">Willings, C. (2025). <em>Simulation Activities.</em> teachingvisuallyimpaired.com.</div>
            </details>
        </div>
    `;
    
    showModal("Literaturverzeichnis", html);
};

// === SAVE & LOAD & PDF ===
window.app.savePlan = function() {
    const data = {
        room: currentRoomFile,
        furniture: movableObjects.map(obj => ({ 
            typeId: obj.userData.typeId, 
            x: obj.position.x, 
            z: obj.position.z, 
            rot: obj.rotation.y, 
            annotation: obj.userData.annotation || "" 
        }))
    };
    
    // Inhalt bleibt JSON
    const blob = new Blob([JSON.stringify(data)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); 
    
    a.href = url; 
    a.download = 'raumplan.elmeks'; 
    
    a.click();
    
    // Feedback für Nutzer
    showNotification("Plan als .elmeks gespeichert.");
};

window.app.loadFromFile = function(input) {
    const file = input.files[0];
    if(!file) return;
    document.getElementById('homescreen').style.display = 'none';
    document.getElementById('ui-layer').style.display = 'flex';
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if(data.room !== currentRoomFile) { await app.switchRoom(data.room); app.clearRoom(false); } else { app.clearRoom(false); }
            for(let item of data.furniture) {
                if(ASSETS.furniture[item.typeId] && !ASSETS.furniture[item.typeId].data) { await getOrLoadFurniture(item.typeId); }
                createFurnitureInstance(item.typeId, item.x, item.z, item.rot);
                if(item.annotation && movableObjects.length > 0) movableObjects[movableObjects.length-1].userData.annotation = item.annotation;
            }
            showNotification("Plan geladen.");
        } catch(err) { console.error(err); showNotification("Fehler beim Laden."); }
    };
    reader.readAsText(file); input.value = '';
};

// === HIGH-END PDF EXPORT (FINAL DESIGN - Ohne Abfrage) ===
window.app.exportPDF = async function() {
    // 1. Vorbereitung & Kamera-Setup
    app.setCamera('top');
    toggleLoader(true, "Generiere Report...");
    await new Promise(r => setTimeout(r, 800));
    
    // 2. Initialisierung
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // --- Corporate Design Farben (TU Dresden orientiert) ---
    const cBlueDark  = [0, 48, 93];    // TU Dunkelblau (HKS 41)
    const cBlueLight = [0, 158, 224];  // TU Hellblau (Akzent)
    const cGrayText  = [80, 80, 80];   // Fließtext Grau
    const cGrayLight = [240, 240, 240];// Hintergründe
    const cWhite     = [255, 255, 255];
    
    // Status Farben
    const cSuccess = [0, 125, 64];   // Grün
    const cWarn    = [230, 150, 0];  // Orange
    const cDanger  = [200, 30, 30];  // Rot

    // Hilfsfunktion: Zeichnet eine Sektions-Überschrift
    const drawSectionHeader = (text, y) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...cBlueDark);
        doc.text(text.toUpperCase(), 20, y);
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(20, y + 2, 190, y + 2);
        return y + 10;
    };

    // === 1. HEADER ===
    doc.setFillColor(...cBlueDark);
    doc.rect(0, 0, 210, 12, 'F'); 
    
    doc.setTextColor(...cWhite);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("RAUMPLANUNGS-REPORT", 20, 8.5);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("ELMeKS.digital | TU Dresden", 190, 8.5, { align: "right" });

    // === 2. METADATEN ===
    const dateStr = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const roomName = ASSETS.rooms[currentRoomFile]?.name || "Unbekannter Raum";
    const seatCount = document.getElementById("seat-count").innerText;

    doc.setFontSize(9);
    doc.setTextColor(...cGrayText);
    
    // Grid für Metadaten
    let metaY = 22;
    doc.text("DATUM", 20, metaY);
    doc.text("RAUM-MODELL", 80, metaY);
    doc.text("KAPAZITÄT", 160, metaY);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(dateStr, 20, metaY + 5);
    doc.text(roomName, 80, metaY + 5);
    doc.text(seatCount + " Sitzplätze", 160, metaY + 5);

    let currentY = 38;

    // === 3. SCREENSHOT ===
    renderer.render(scene, camera);
    const imgData = renderer.domElement.toDataURL("image/jpeg", 0.95);
    const imgProps = doc.getImageProperties(imgData);
    const pdfWidth = 170;
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    // Feiner Rahmen um das Bild
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    doc.rect(19.5, currentY - 0.5, pdfWidth + 1, pdfHeight + 1); 
    doc.addImage(imgData, 'JPEG', 20, currentY, pdfWidth, pdfHeight);

    currentY += pdfHeight + 15;

    // === 4. ANALYSE DASHBOARD ===
    currentY = drawSectionHeader("Analyse & Barrierefreiheit", currentY);

    const stats = getAccessibilityStats();
    
    // Logik für Status
    let accStatus = "KRITISCH";
    let accColor = cDanger;
    if (stats.minCm >= 70) { accStatus = "EINGESCHRÄNKT"; accColor = cWarn; }
    if (stats.minCm >= 90) { accStatus = "DIN KONFORM"; accColor = cSuccess; }
    if (stats.count < 2)   { accStatus = "LEER"; accColor = cGrayText; }

    let soundStatus = "HALLIG (SCHLECHT)";
    let soundColor = cDanger;
    if(stats.acousticScore > stats.targets.warn) { soundStatus = "AKZEPTABEL"; soundColor = cWarn; }
    if(stats.acousticScore > stats.targets.good) { soundStatus = "GUT (GEDÄMPFT)"; soundColor = cSuccess; }

    // Box Parameter
    const boxW = 82;
    const boxH = 28;
    
    // --- LINKE BOX: ROLLSTUHL ---
    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(252, 252, 252);
    doc.roundedRect(20, currentY, boxW, boxH, 2, 2, 'FD'); 
    
    doc.setFillColor(...accColor);
    doc.rect(20, currentY, 3, boxH, 'F'); 

    doc.setFontSize(8); doc.setTextColor(...cGrayText); doc.setFont("helvetica", "bold");
    doc.text("DURCHGANGSBREITE", 26, currentY + 6);
    
    doc.setFontSize(12); doc.setTextColor(...accColor);
    doc.text(accStatus, 26, currentY + 12);

    doc.setFontSize(10); doc.setTextColor(0,0,0); doc.setFont("helvetica", "normal");
    doc.text(`Gemessen: ${stats.minCm} cm`, 26, currentY + 18);
    
    let hintText = stats.minCm < 90 ? "Empfohlen: > 90cm" : "Anforderung erfüllt";
    doc.setFontSize(8); doc.setTextColor(...cGrayText);
    doc.text(hintText, 26, currentY + 24);

    // --- RECHTE BOX: AKUSTIK ---
    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(252, 252, 252);
    doc.roundedRect(108, currentY, boxW, boxH, 2, 2, 'FD');

    doc.setFillColor(...soundColor);
    doc.rect(108, currentY, 3, boxH, 'F');

    doc.setFontSize(8); doc.setTextColor(...cGrayText); doc.setFont("helvetica", "bold");
    doc.text("AKUSTIK-PROGNOSE", 114, currentY + 6);
    
    doc.setFontSize(12); doc.setTextColor(...soundColor);
    doc.text(soundStatus, 114, currentY + 12);

    doc.setFontSize(10); doc.setTextColor(0,0,0); doc.setFont("helvetica", "normal");
    let acousticDetail = "Basierend auf Möblierung";
    if(stats.wallIssues > 0) acousticDetail += ` + ${stats.wallIssues} Wandkonflikte`;
    doc.text(acousticDetail, 114, currentY + 18);

    doc.setFontSize(8); doc.setTextColor(...cGrayText);
    doc.text("Schätzwert (Simulation)", 114, currentY + 24);

    currentY += boxH + 15;

    // === 5. INVENTARLISTE ===
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...cBlueDark);
    doc.text("INVENTARLISTE", 20, currentY);
    
    // Daten vorbereiten
    const tableData = [];
    const groupedCounts = {};
    const itemNames = {};

    movableObjects.forEach(obj => { 
        const type = obj.userData.typeId;
        const name = ASSETS.furniture[type].name;
        const note = obj.userData.annotation || "";
        if (!note) {
            groupedCounts[type] = (groupedCounts[type] || 0) + 1;
            itemNames[type] = name;
        } else {
            tableData.push([name, "1", note]);
        }
    });

    for (const [type, count] of Object.entries(groupedCounts)) {
        tableData.push([itemNames[type], count.toString(), "-"]);
    }
    tableData.sort((a, b) => a[0].localeCompare(b[0]));

    doc.autoTable({
        startY: currentY + 3,
        head: [['OBJEKT', 'ANZ.', 'ANMERKUNG']],
        body: tableData,
        theme: 'plain',
        headStyles: { 
            fillColor: cBlueDark, 
            textColor: 255, 
            fontStyle: 'bold', 
            fontSize: 9,
            cellPadding: 4
        },
        bodyStyles: {
            textColor: [50, 50, 50],
            fontSize: 9,
            cellPadding: 4,
            lineColor: [230, 230, 230],
            lineWidth: 0.1
        },
        columnStyles: { 
            0: { cellWidth: 80, fontStyle: 'bold' }, 
            1: { cellWidth: 20, halign: 'center' },
            2: { cellWidth: 'auto', fontStyle: 'italic', textColor: [100, 100, 100] } 
        },
        margin: { left: 20, right: 20 },
        didParseCell: function(data) {
            if (data.section === 'body') {
                data.cell.styles.borderBottomWidth = 0.1;
            }
        }
    });

    // === 6. FOOTER / LLR INFO ===
    let finalY = doc.lastAutoTable.finalY + 15;
    const pageHeight = doc.internal.pageSize.height;
    
    // Wenn weniger als 60mm Platz ist -> Neue Seite
    if (pageHeight - finalY < 60) {
        doc.addPage();
        finalY = 30;
    } else {
        // Schiebe Footer nach unten, aber nicht tiefer als bottom margin
        finalY = Math.max(finalY, pageHeight - 65);
    }

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(20, finalY, 190, finalY);
    
    let textY = finalY + 10;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...cBlueDark);
    doc.text("Lehr-Lern-Raum Inklusion (LLR) @ TU Dresden", 20, textY);
    
    textY += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...cGrayText);
    doc.text("Zellescher Weg 20, Seminargebäude II, Raum 21", 20, textY);
    
    textY += 7;
    doc.setTextColor(...cBlueLight);
    const urlWeb = "https://tu-dresden.de/zlsb/lehramtsstudium/im-studium/studienunterstuetzende-angebote/inklusionsraums";
    doc.textWithLink(">> Webseite besuchen (tu-dresden.de/...)", 20, textY, { url: urlWeb });

    textY += 10;
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("Materialien & Kurse:", 20, textY);
    
    textY += 5;
    const urlOpal = "https://bildungsportal.sachsen.de/opal/auth/RepositoryEntry/20508278784/CourseNode/1614569282320629";
    doc.setTextColor(...cBlueLight);
    doc.setFont("helvetica", "normal");
    doc.textWithLink(">> Zum OPAL-Kurs wechseln", 20, textY, { url: urlOpal });
    
    // === 7. PAGE NUMBERS ===
    const pageCount = doc.internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(180, 180, 180);
        doc.text(`Seite ${i} von ${pageCount}`, 105, 290, { align: 'center' });
    }

    // Speichern
    const safeName = roomName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    doc.save(`Raumplan_${safeName}_${Date.now()}.pdf`);
    
    toggleLoader(false);
};

// === ASSET LOADING & ROOM MANAGEMENT ===
function getOrLoadFurniture(key) {
    return new Promise((resolve) => {
        const obj = ASSETS.furniture[key];
        if (obj.data) { resolve(obj.data); return; }
        if (obj.procedural) { resolve(true); return; }
        if (!obj.file) { resolve(null); return; }

        const loader = obj.file.endsWith('.obj') ? objLoader : gltfLoader;
        loader.load("models/" + obj.file, (result) => {
            const model = result.scene || result;
            model.scale.set(GLOBAL_SCALE, GLOBAL_SCALE, GLOBAL_SCALE);
            disableCullingRecursively(model);
            obj.data = model;
            resolve(model);
        }, undefined, (err) => { resolve(null); });
    });
}

function disableCullingRecursively(obj) {
    if (!obj) return;
    obj.frustumCulled = false; 
    if (obj.isMesh) {
        if(obj.material) obj.material.side = THREE.DoubleSide;
        if(obj.geometry) {
            obj.geometry.computeBoundingSphere();
            if(!obj.geometry.boundingSphere) obj.geometry.boundingSphere = new THREE.Sphere();
            obj.geometry.boundingSphere.radius = Infinity;
        }
    }
    if(obj.children && obj.children.length > 0) {
        obj.children.forEach(child => disableCullingRecursively(child));
    }
}

function loadRoomAsset(filename) {
    return new Promise((resolve, reject) => {
        const info = ASSETS.rooms[filename];
        if (info.data) { resolve(info.data); return; }
        const path = "models/";
        const loader = (info.type === 'obj' || filename.endsWith('.obj')) ? objLoader : gltfLoader;
        loader.load(path + filename, (result) => {
            const model = result.scene || result;
            model.scale.set(GLOBAL_SCALE, GLOBAL_SCALE, GLOBAL_SCALE);
            info.data = model;
            resolve(model);
        }, undefined, reject);
    });
}

window.app.switchRoom = async function(filename) {
  const roomInfo = ASSETS.rooms[filename];
  if (!roomInfo) return;
  
  app.exitSimulationMode();
  saveHistory();
  
  const savedFurniture = movableObjects.map(obj => ({
      typeId: obj.userData.typeId, x: obj.position.x, z: obj.position.z, rot: obj.rotation.y
  }));
  
  let modelData = roomInfo.data;
  if (!modelData) {
      toggleLoader(true, "Wechsle Raum...");
      try { modelData = await loadRoomAsset(filename); } 
      catch(e) { toggleLoader(false); showNotification("Fehler beim Laden des Raumes"); return; }
      toggleLoader(false);
  }
  
  // Clean up old room
  if (currentRoomMesh) {
      scene.remove(currentRoomMesh);
      currentRoomMesh.traverse(o => { if(o.geometry) o.geometry.dispose(); });
      currentRoomMesh = null;
  }
  
  window.app.clearRoom(false);
  setupRoom(modelData, filename);
  
  const newLimits = roomInfo.playableArea;
  const limitX = newLimits.x - 0.5; const limitZ = newLimits.z - 0.5;
  
  savedFurniture.forEach(async (item) => {
      if(ASSETS.furniture[item.typeId].file && !ASSETS.furniture[item.typeId].data) {
          await getOrLoadFurniture(item.typeId);
      }
      let newX = Math.max(-limitX, Math.min(limitX, item.x));
      let newZ = Math.max(-limitZ, Math.min(limitZ, item.z));
      createFurnitureInstance(item.typeId, newX, newZ, item.rot);
  });
};

function setupRoom(model, filename) {
  currentRoomFile = filename;
  const roomInfo = ASSETS.rooms[filename];
  currentRoomMesh = model.clone();
  disableCullingRecursively(currentRoomMesh);
  const box = new THREE.Box3().setFromObject(currentRoomMesh);
  const center = box.getCenter(new THREE.Vector3());
  currentRoomMesh.position.set(-center.x, 0, -center.z);
  currentRoomMesh.position.y = -box.min.y;
  scene.add(currentRoomMesh);
  currentRoomMesh.updateMatrixWorld(true);
  
  // WICHTIG: Limits aktualisieren für den Wizard
  currentRoomLimits = roomInfo.playableArea;
  
  updateSeatCount();
  updateObjectList();
  window.app.setCamera('top');
  historyStack = [];
  
  // NEU: Wenn Hochkontrast-Modus an ist, sofort den neuen Raum überschreiben
  if (window.app.applyHighContrast3D) {
      const highContrastToggle = document.getElementById('set-high-contrast');
      if (highContrastToggle && highContrastToggle.checked) {
          window.app.applyHighContrast3D(true);
      }
  }
}

function toggleLoader(show, text) {
    const el = document.getElementById("loader");
    const txt = document.getElementById("loading-text");
    if(el) {
        if(show) { if(txt && text) txt.innerText = text; el.classList.add("active"); } 
        else { el.classList.remove("active"); }
    }
}

function showModal(title, htmlContent) {
    document.getElementById('modal-title').innerText = title;
    const closeBtn = '<div style="margin-top:20px; text-align:right;"><button class="primary" onclick="document.getElementById(\'modal-overlay\').classList.remove(\'active\')">Schließen</button></div>';
    document.getElementById('modal-content').innerHTML = htmlContent + closeBtn;
    document.getElementById('modal-overlay').classList.add('active');
}

function showNotification(msg) {
    const el = document.getElementById("notification");
    el.innerText = msg;
    el.classList.add("visible");
    setTimeout(() => el.classList.remove("visible"), 3000);
}

function updateSeatCount() { let total = 0; movableObjects.forEach(obj => { if(obj.userData.typeId) total += (ASSETS.furniture[obj.userData.typeId].seats || 0); }); document.getElementById("seat-count").innerText = total; }

// === CREATE INSTANCE ===
function createFurnitureInstance(typeId, x, z, rotY) {
    const info = ASSETS.furniture[typeId];
    
    if (typeId === 'avatar_procedural') {
        const av = toggleAvatar(scene, movableObjects, interactionMeshes);
        if(av) { 
            av.position.set(x, 0, z); 
            av.rotation.y = rotY; 
            updateObjectList();
            updateAvatarUI();
        }
        return;
    }

    let visual;
    if (info.procedural) {
        const geo = new THREE.BoxGeometry(info.dims.x, info.dims.y, info.dims.z);
        const mat = new THREE.MeshStandardMaterial({ color: info.color, roughness: 0.8 });
        visual = new THREE.Mesh(geo, mat);
        
        if(info.noShadow) { visual.castShadow = false; } else { visual.castShadow = true; }
        visual.receiveShadow = true;
        
        let visualY = info.dims.y / 2;
        if(typeId === 'carpet_proc') {
             visualY += 0.005;
        }
        visual.position.y = visualY; 

    } else {
        if (!info.data) return; 
        visual = info.data.clone();
        disableCullingRecursively(visual);
        
        // NEU: Farblosen Möbeln standardmäßig eine edle dunkle Farbe geben
        const colorlessFurniture = [
            'table_square', 'table_double', 'sofa', 'board', 'teacher', 
            'cupboard', 'cabinet_short', 'cabinet_long'
        ];
        
        if (colorlessFurniture.includes(typeId)) {
            visual.traverse(child => {
                if (child.isMesh && child.material) {
                    // Material klonen, damit wir es unabhängig einfärben können
                    child.material = child.material.clone(); 
                    // Edles, tiefes Schieferblau/Anthrazit setzen
                    child.material.color.setHex(0x2c3e50); 
                }
            });
        }

        const box = new THREE.Box3().setFromObject(visual);
        const center = new THREE.Vector3(); box.getCenter(center);
        visual.position.x = -center.x; visual.position.y = -box.min.y; visual.position.z = -center.z;
    }
    
    const wrapper = new THREE.Group();
    visual.traverse(c => { if(c.isMesh && c.material) { c.material.depthWrite = true; c.material.transparent = false; }});
    wrapper.add(visual);

    const hW = info.dims ? info.dims.x : 1.0;
    const hD = info.dims ? info.dims.z : 1.0;
    const hH = info.dims ? (info.dims.y || 1.2) : 1.2;
    
    const hitbox = new THREE.Mesh(new THREE.BoxGeometry(hW, hH, hD), new THREE.MeshBasicMaterial({ visible: false }));
    hitbox.position.y = hH / 2;
    
    wrapper.userData = { typeId: typeId, root: wrapper, isWallItem: !!info.isWallItem };
    hitbox.userData = { root: wrapper };
    wrapper.add(hitbox);

    const yPos = info.yOffset !== undefined ? info.yOffset : FURNITURE_Y_OFFSET;
    
    wrapper.position.set(x, yPos, z); 
    wrapper.rotation.y = rotY; 
    wrapper.updateMatrixWorld(true);
    
    scene.add(wrapper); 
    movableObjects.push(wrapper); 
    interactionMeshes.push(hitbox); 
    
    updateSeatCount(); 
    updateObjectList();
    
    // Hochkontrast-Modus auf das neue Möbelstück anwenden (falls aktiv)
    if (window.app.applyHighContrast3D) {
        const highContrastToggle = document.getElementById('set-high-contrast');
        if (highContrastToggle && highContrastToggle.checked) {
            window.app.applyHighContrast3D(true);
        }
    }
}

// === EVENTS ===
function onMouseDown(event) {
  // In FP ist keine Interaktion mit Objekten möglich (außer Umschauen)
  if (isFirstPersonActive()) return;

  if(event.button !== 0) return; 
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(interactionMeshes, false);
  if (intersects.length > 0) {
    const root = intersects[0].object.userData.root;
    if (isVisionAnalysisMode && !root.userData.isAvatar) return; 

    if(!selectedObjects.includes(root)) { 
        deselectObject(); selectedObjects = [root]; selectObject(root); 
    }
    
    saveHistory(); 
    isDragging = true; 
    controls.enabled = false; 

    const planeIntersect = new THREE.Vector3(); 
    raycaster.ray.intersectPlane(dragPlane, planeIntersect);
    dragOffset.copy(planeIntersect); 
    selectedRoot = root; 
  } else { 
      if (!isVisionAnalysisMode) deselectObject(); 
  }
}

function onMouseMove(event) {
  if (isFirstPersonActive()) { document.body.style.cursor = "default"; return; }
  
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  if (isDragging && selectedObjects.length > 0) {
      raycaster.setFromCamera(mouse, camera); 
      const planeIntersect = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(dragPlane, planeIntersect)) {
        const delta = new THREE.Vector3().copy(planeIntersect).sub(dragOffset);
        
        selectedObjects.forEach(obj => {
            let newX = obj.position.x + delta.x; 
            let newZ = obj.position.z + delta.z;
            
            const isWall = obj.userData.isWallItem;
            const padding = isWall ? 0.05 : 0.5;

            const limitX = currentRoomLimits.x - padding;
            const limitZ = currentRoomLimits.z - padding;

            newX = Math.max(-limitX, Math.min(limitX, newX));
            newZ = Math.max(-limitZ, Math.min(limitZ, newZ));
            obj.position.set(newX, obj.position.y, newZ);
        });
        
        dragOffset.copy(planeIntersect); 
        if(selectedObjects.length === 1) selectionBox.update(); 
      }
      return;
  }

  raycastThrottle++;
  if (raycastThrottle % 5 !== 0) return;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(interactionMeshes, false);
  document.body.style.cursor = (intersects.length > 0) ? "grab" : "default";
}

function onMouseUp() { 
    if(isDragging) { 
        isDragging = false; 
        if (!isVisionAnalysisMode && !isFirstPersonActive()) controls.enabled = true; 
        if(selectedObjects.length === 1 && !selectedObjects[0].userData.isAvatar) { 
            document.getElementById('selection-details').style.display = 'block'; 
            document.getElementById('obj-annotation').value = selectedObjects[0].userData.annotation || ""; 
        }
    } 
    Object.keys(inputState).forEach(k => inputState[k] = false);
}

function selectObject(obj) { 
    selectedRoot = obj; 
    selectionBox.setFromObject(obj); 
    selectionBox.visible = true; 
    document.getElementById('selection-details').style.display = 'block'; 
    document.getElementById('obj-annotation').value = obj.userData.annotation || "";
    
    const ctxMenu = document.getElementById("context-menu");
    ctxMenu.classList.add("visible");
    const delBtn = ctxMenu.querySelector('.danger');
    if(delBtn) {
        if(obj.userData.isAvatar) delBtn.style.display = 'none';
        else delBtn.style.display = 'block';
    }
    updateObjectList();
}

function deselectObject() { 
    selectedRoot = null; selectedObjects = []; selectionBox.visible = false; 
    document.getElementById("context-menu").classList.remove("visible"); 
    document.getElementById('selection-details').style.display = 'none'; 
    document.querySelectorAll('.object-list-item').forEach(el => el.classList.remove('selected')); 
}

function smoothCameraMove(targetPos, targetLookAt) {
  if(settings.reducedMotion) { camera.position.copy(targetPos); controls.target.copy(targetLookAt); controls.update(); return; }
  const startPos = camera.position.clone(); const startLook = controls.target.clone(); const duration = 800; const startTime = performance.now();
  function loop(time) { const t = Math.min((time - startTime) / duration, 1); const ease = t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t; 
    camera.position.lerpVectors(startPos, targetPos, ease); controls.target.lerpVectors(startLook, targetLookAt, ease); controls.update();
    if (t < 1) requestAnimationFrame(loop);
  } requestAnimationFrame(loop);
}

window.app.setCamera = function(mode) {
  if (isFirstPersonActive() || isVisionAnalysisMode) {
      app.exitSimulationMode();
  }
  if (mode === 'top') {
      smoothCameraMove(new THREE.Vector3(0, 16, 0.1), new THREE.Vector3(0, 0, 0));
  } 
  controls.enabled = true;
};

function onWindowResize() { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); }

function onKeyDown(event) { 
    if (event.key === "Escape") app.exitSimulationMode(); 
    
    const canInteract = !isFirstPersonActive(); 
    if (selectedObjects.length > 0 && canInteract) { 
        const key = event.key.toLowerCase(); 
        if (key === "r") { 
            saveHistory(); 
            selectedObjects.forEach(o => o.rotation.y += Math.PI/4); 
            if(selectedObjects.length===1) selectionBox.update(); 
        } 
        if (key === "delete" || key === "backspace") window.app.deleteSelection(); 
    } 
    
    if(settings.controlsEnabled && !isFirstPersonActive() && !isVisionAnalysisMode) { 
        switch(event.key) { case "ArrowUp": inputState.fwd = true; break; case "ArrowDown": inputState.bwd = true; break; case "ArrowLeft": inputState.left = true; break; case "ArrowRight": inputState.right = true; break; case "+": case "=": inputState.zoomIn = true; break; case "-": inputState.zoomOut = true; break; } 
    } 
}
function onKeyUp(event) { 
    if(settings.controlsEnabled) { 
        switch(event.key) { case "ArrowUp": inputState.fwd = false; break; case "ArrowDown": inputState.bwd = false; break; case "ArrowLeft": inputState.left = false; break; case "ArrowRight": inputState.right = false; break; case "+": case "=": inputState.zoomIn = false; break; case "-": inputState.zoomOut = false; break; } 
    } 
}

init();